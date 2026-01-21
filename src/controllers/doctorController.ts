import { Request, Response } from 'express';
import doctorService from '../services/doctorService';
import { generateToken } from '../utils/jwt';
import User from '../models/User';

class DoctorController {
  // Create or update doctor profile
  async createOrUpdateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const profile = await doctorService.createOrUpdateProfile(
        req.user.userId,
        req.body
      );

      // Get updated user to generate new token with profileCompleted = true
      const user = await User.findById(req.user.userId);
      
      if (user) {
        // Generate new token with updated profileCompleted status
        const newToken = generateToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          profileCompleted: true
        });

        return res.status(200).json({
          success: true,
          message: 'Doctor profile updated successfully',
          data: {
            profile,
            token: newToken // Send new token to update frontend
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: profile
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  // Get my profile
  async getMyProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const profile = await doctorService.getProfileByUserId(req.user.userId);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile'
      });
    }
  }

  // Get doctor profile by ID
  async getProfileById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const profile = await doctorService.getProfileByUserId(id);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile'
      });
    }
  }

  // Get all doctor profiles
  async getAllProfiles(req: Request, res: Response) {
    try {
      const { limit = 10, page = 1, specialization } = req.query;

      const result = await doctorService.getAllProfiles(
        parseInt(limit as string),
        parseInt(page as string),
        { specialization: specialization as string }
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profiles'
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

      const profile = await doctorService.updateProfile(
        req.user.userId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  // Delete profile
  async deleteProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const result = await doctorService.deleteProfile(req.user.userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete profile'
      });
    }
  }

  // Check profile completion status
  async checkProfileCompletion(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const isComplete = await doctorService.isProfileComplete(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          profileCompleted: isComplete
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to check profile status'
      });
    }
  }
}

export default new DoctorController();
