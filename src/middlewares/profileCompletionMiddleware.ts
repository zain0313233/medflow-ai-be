import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if doctor/staff has completed their profile
 * Blocks access to protected routes if profile is not complete
 */
export const requireProfileCompletion = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Only check for doctor and staff roles
    if (req.user.role === 'doctor' || req.user.role === 'staff') {
      // Check if profile is completed
      if (!req.user.profileCompleted) {
        return res.status(403).json({
          success: false,
          message: 'Profile not completed',
          requiresProfileCompletion: true,
          data: {
            profileCompleted: false,
            role: req.user.role
          }
        });
      }
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * Middleware to allow access only to profile completion routes
 * Used for routes that should be accessible even without profile completion
 */
export const allowWithoutProfileCompletion = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This middleware does nothing, just marks the route as accessible
  // without profile completion
  next();
};
