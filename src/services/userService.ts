import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../utils/errors';
import crypto from 'crypto';

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'patient' | 'doctor' | 'nurse' | 'admin';
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Partial<IUser>;
}

class UserService {
  // Signup a new user
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'patient',
      ...rest
    } = payload;

    // Validate email format
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      throw new ValidationError('Valid email is required');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    if (!firstName || !lastName) {
      throw new ValidationError('First name and last name are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role,
      ...rest
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const userResponse = user.toObject();
    const { password: pwd, ...userWithoutPassword } = userResponse;

    return { token, user: userWithoutPassword };
  }

  // Login user
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const loginEmail = payload.email;
    const loginPassword = payload.password;

    if (!loginEmail || !loginPassword) {
      throw new ValidationError('Email and password are required');
    }

    // Find user with password field selected
    const user = await User.findOne({ email: loginEmail.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(loginPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const userResponse = user.toObject();
    const { password: _pwd, ...userWithoutPassword } = userResponse;

    return { token, user: userWithoutPassword };
  }

  // Get user by ID
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('-password');
  }

  // Get all users (admin only)
  async getAllUsers(
    limit: number = 10,
    page: number = 1,
    role?: string
  ): Promise<{ users: IUser[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(filter);

    return {
      users: users as unknown as IUser[],
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser> {
    // Don't allow updating password through this method
    if ('password' in updateData) {
      throw new ValidationError('Use changePassword endpoint to update password');
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  // Change password
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    if (!oldPassword || !newPassword) {
      throw new ValidationError('Old password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.save();

    return { resetToken };
  }

  // Reset password with token
  async resetPassword(
    resetToken: string,
    newPassword: string
  ): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Verify email
  async verifyEmail(verificationToken: string): Promise<{ message: string }> {
    const user = await User.findOne({
      emailVerificationToken: verificationToken
    });

    if (!user) {
      throw new UnauthorizedError('Invalid verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;

    await user.save();

    return { message: 'Email verified successfully' };
  }

  // Deactivate user account
  async deactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { message: 'Account deactivated successfully' };
  }

  // Reactivate user account (admin only)
  async reactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { message: 'Account reactivated successfully' };
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  // Get users by role
  async getUsersByRole(role: string): Promise<IUser[]> {
    return User.find({ role }).select('-password') as unknown as Promise<IUser[]>;
  }
}

export default new UserService();
