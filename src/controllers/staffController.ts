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

      // Filter data based on user role
      const filteredProfile = this.filterStaffData(profile, req.user?.role, req.user?.userId);

      res.status(200).json({
        success: false,
        data: filteredProfile
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

      // Filter data based on user role
      const filteredProfiles = result.profiles.map(profile => 
        this.filterStaffData(profile, req.user?.role, req.user?.userId)
      );

      res.status(200).json({
        success: true,
        data: {
          profiles: filteredProfiles,
          total: result.total,
          pages: result.pages
        }
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

      // Check if user is the doctor or admin
      if (req.user?.role !== 'admin' && req.user?.userId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own staff.'
        });
      }

      const result = await staffService.getStaffByDoctor(
        doctorId,
        parseInt(limit as string),
        parseInt(page as string)
      );

      // Filter data based on user role
      const filteredProfiles = result.profiles.map(profile => 
        this.filterStaffData(profile, req.user?.role, req.user?.userId)
      );

      res.status(200).json({
        success: true,
        data: {
          profiles: filteredProfiles,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch staff'
      });
    }
  }

  /**
   * Filter staff profile data based on user role
   * Only admin and supervisor doctor can see full staff info
   */
  private filterStaffData(profile: any, userRole?: string, userId?: string) {
    if (!profile) return null;

    const profileObj = profile.toObject ? profile.toObject() : profile;
    const userIdObj = profileObj.userId;

    // Basic view (minimal info)
    const basicView = {
      _id: profileObj._id,
      userId: {
        _id: userIdObj?._id,
        firstName: userIdObj?.firstName,
        lastName: userIdObj?.lastName
      },
      staffRole: profileObj.staffRole,
      department: profileObj.department
    };

    // Admin view (full info except sensitive data)
    const adminView = {
      ...basicView,
      gender: profileObj.gender,
      dob: profileObj.dob,
      photo: profileObj.photo,
      employeeId: profileObj.employeeId,
      experienceYears: profileObj.experienceYears,
      supervisorDoctorId: profileObj.supervisorDoctorId,
      shiftTiming: profileObj.shiftTiming,
      workingDays: profileObj.workingDays,
      emergencyContact: profileObj.emergencyContact,
      profileCompleted: profileObj.profileCompleted,
      createdAt: profileObj.createdAt,
      updatedAt: profileObj.updatedAt,
      userId: {
        ...basicView.userId,
        email: userIdObj?.email,
        phone: userIdObj?.phone
      }
    };

    // Doctor view (can see their own staff details)
    const doctorView = {
      ...basicView,
      photo: profileObj.photo,
      experienceYears: profileObj.experienceYears,
      shiftTiming: profileObj.shiftTiming,
      workingDays: profileObj.workingDays,
      userId: {
        ...basicView.userId,
        phone: userIdObj?.phone
      }
    };

    // Return based on role
    switch (userRole) {
      case 'admin':
        return adminView;
      case 'doctor':
        // Check if this is their staff
        if (profileObj.supervisorDoctorId?.toString() === userId) {
          return doctorView;
        }
        return basicView;
      default:
        return basicView;
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
