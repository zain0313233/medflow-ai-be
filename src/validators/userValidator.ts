import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validateSignup = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !email.trim()) {
      throw new ValidationError('Email is required');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!password || password.trim().length === 0) {
      throw new ValidationError('Password is required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    if (!firstName || !firstName.trim()) {
      throw new ValidationError('First name is required');
    }

    if (!lastName || !lastName.trim()) {
      throw new ValidationError('Last name is required');
    }

    const validRoles = ['patient', 'doctor', 'nurse', 'admin'];
    if (req.body.role && !validRoles.includes(req.body.role)) {
      throw new ValidationError(
        `Invalid role. Must be one of: ${validRoles.join(', ')}`
      );
    }

    if (req.body.gender) {
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(req.body.gender)) {
        throw new ValidationError(
          `Invalid gender. Must be one of: ${validGenders.join(', ')}`
        );
      }
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      throw new ValidationError('Email is required');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!password || !password.trim()) {
      throw new ValidationError('Password is required');
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !oldPassword.trim()) {
      throw new ValidationError('Current password is required');
    }

    if (!newPassword || !newPassword.trim()) {
      throw new ValidationError('New password is required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    if (oldPassword === newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, gender, dateOfBirth, firstName, lastName } = req.body;

    if (gender) {
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(gender)) {
        throw new ValidationError(
          `Invalid gender. Must be one of: ${validGenders.join(', ')}`
        );
      }
    }

    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid date format for dateOfBirth');
      }
    }

    if (firstName && !firstName.trim()) {
      throw new ValidationError('First name cannot be empty');
    }

    if (lastName && !lastName.trim()) {
      throw new ValidationError('Last name cannot be empty');
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export const validatePasswordReset = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !resetToken.trim()) {
      throw new ValidationError('Reset token is required');
    }

    if (!newPassword || !newPassword.trim()) {
      throw new ValidationError('New password is required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      throw new ValidationError('Email is required');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};
