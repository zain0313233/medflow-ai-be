import { Request, Response } from 'express';
import staffService from '../services/staffService';

class StaffController {
  // Create or update staff profile
  async createOrUpdateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const profile = await staffService.createOrUpdateProfile(
        req.user.userId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Staff profile updated successfully',
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

      const profile = await staffService.getProfileByUserId(req.user.userId);

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

  // Get staff profile by ID
  async getProfileById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const profile = await staffService.getProfileByUserId(id);

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

  // Get all staff profiles
  async getAllProfiles(req: Request, res: Response) {
    try {
      const { limit = 10, page = 1, staffRole, department } = req.query;

      const result = await staffService.getAllProfiles(
        parseInt(limit as string),
        parseInt(page as string),
        {
          staffRole: staffRole as string,
          department: department as string
        }
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

  // Get staff by supervisor doctor
  async getStaffByDoctor(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { limit = 10, page = 1 } = req.query;

      const result = await staffService.getStaffByDoctor(
        doctorId,
        parseInt(limit as string),
        parseInt(page as string)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch staff'
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

      const profile = await staffService.updateProfile(
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

      const result = await staffService.deleteProfile(req.user.userId);

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

      const isComplete = await staffService.isProfileComplete(req.user.userId);

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

export default new StaffController();
