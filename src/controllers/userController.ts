import { Request, Response } from 'express';
import userService from '../services/userService';
import { ValidationError } from '../utils/errors';

class UserController {
  // Signup
  async signup(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, ...rest } = req.body;

      const result = await userService.signup({
        email,
        password,
        firstName,
        lastName,
        role,
        ...rest
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          email: result.email
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Signup failed'
      });
    }
  }

  // Verify OTP
  async verifyOTP(req: Request, res: Response) {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        throw new ValidationError('User ID and OTP are required');
      }

      const result = await userService.verifyOTP(userId, otp);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: result
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'OTP verification failed'
      });
    }
  }

  // Resend OTP
  async resendOTP(req: Request, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const result = await userService.resendOTP(userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to resend OTP'
      });
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await userService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await userService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile'
      });
    }
  }

  // Get user by ID (admin only)
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch user'
      });
    }
  }

  // Get all users (admin only)
  async getAllUsers(req: Request, res: Response) {
    try {
      const { limit = 10, page = 1, role } = req.query;

      const result = await userService.getAllUsers(
        parseInt(limit as string),
        parseInt(page as string),
        role as string
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch users'
      });
    }
  }

  // Update profile
  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const updateData = req.body;

      // Remove sensitive fields
      delete updateData.password;
      delete updateData.role;
      delete updateData.email;

      const user = await userService.updateUserProfile(
        req.user.userId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { oldPassword, newPassword } = req.body;

      const result = await userService.changePassword(
        req.user.userId,
        oldPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const result = await userService.requestPasswordReset(email);

      // In production, send this token via email
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
        data: result // Remove this in production - only for testing
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to request password reset'
      });
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        throw new ValidationError('Reset token and new password are required');
      }

      const result = await userService.resetPassword(resetToken, newPassword);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to reset password'
      });
    }
  }

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      const result = await userService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to verify email'
      });
    }
  }

  // Deactivate account
  async deactivateAccount(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const result = await userService.deactivateAccount(req.user.userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to deactivate account'
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  // Get users by role (admin only)
  async getUsersByRole(req: Request, res: Response) {
    try {
      const { role } = req.params;

      if (!role) {
        throw new ValidationError('Role is required');
      }

      const users = await userService.getUsersByRole(role);

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch users'
      });
    }
  }

  // Get profile completion status
  async getProfileStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await userService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          profileCompleted: user.profileCompleted || false,
          role: user.role,
          userId: user._id
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile status'
      });
    }
  }
}

export default new UserController();
