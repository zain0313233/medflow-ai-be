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

      // Filter data based on user role
      const filteredProfile = this.filterDoctorData(profile, req.user?.role);

      res.status(200).json({
        success: true,
        data: filteredProfile
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

      // Filter data based on user role
      const filteredProfiles = result.profiles.map(profile => 
        this.filterDoctorData(profile, req.user?.role)
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

  /**
   * Filter doctor profile data based on user role
   * Patients see limited info, Admins see everything except sensitive data
   */
  private filterDoctorData(profile: any, userRole?: string) {
    if (!profile) return null;

    const profileObj = profile.toObject ? profile.toObject() : profile;
    const userId = profileObj.userId;

    // Data for patients (public view)
    const patientView = {
      _id: profileObj._id,
      userId: {
        _id: userId?._id,
        firstName: userId?.firstName,
        lastName: userId?.lastName,
        profileImage: userId?.profileImage
      },
      specialization: profileObj.specialization,
      experienceYears: profileObj.experienceYears,
      designation: profileObj.designation,
      workingDays: profileObj.workingDays,
      workingHours: profileObj.workingHours,
      consultationType: profileObj.consultationType,
      appointmentDuration: profileObj.appointmentDuration,
      bio: profileObj.bio,
      languages: profileObj.languages,
      clinic: profileObj.clinic
    };

    // Data for admins (more info but not sensitive)
    const adminView = {
      ...patientView,
      gender: profileObj.gender,
      dob: profileObj.dob,
      photo: profileObj.photo,
      licenseNumber: profileObj.licenseNumber,
      licenseAuthority: profileObj.licenseAuthority,
      licenseExpiry: profileObj.licenseExpiry,
      breakTimes: profileObj.breakTimes,
      profileCompleted: profileObj.profileCompleted,
      createdAt: profileObj.createdAt,
      updatedAt: profileObj.updatedAt,
      userId: {
        ...patientView.userId,
        email: userId?.email,
        phone: userId?.phone
      }
    };

    // Return based on role
    switch (userRole) {
      case 'admin':
        return adminView;
      case 'patient':
      default:
        return patientView;
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
