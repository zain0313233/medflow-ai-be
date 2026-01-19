import StaffProfile, { IStaffProfile } from '../models/StaffProfile';
import User from '../models/User';
import { NotFoundError, ValidationError } from '../utils/errors';

class StaffService {
  // Create or update staff profile
  async createOrUpdateProfile(
    userId: string,
    profileData: Partial<IStaffProfile>
  ): Promise<IStaffProfile> {
    try {
      // Verify user exists and is staff
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.role !== 'staff') {
        throw new ValidationError('User is not staff');
      }

      // Check if profile exists
      let profile = await StaffProfile.findOne({ userId });

      if (profile) {
        // Update existing profile
        Object.assign(profile, {
          ...profileData,
          profileCompleted: true
        });
        await profile.save();
      } else {
        // Create new profile
        profile = new StaffProfile({
          userId,
          ...profileData,
          profileCompleted: true
        });
        await profile.save();
      }

      // Update user's profileCompleted status
      user.profileCompleted = true;
      await user.save();

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Get staff profile by userId
  async getProfileByUserId(userId: string): Promise<IStaffProfile | null> {
    try {
      const profile = await StaffProfile.findOne({ userId })
        .populate('userId', 'firstName lastName email phone profileImage')
        .populate('supervisorDoctorId', 'firstName lastName email');

      if (!profile) {
        throw new NotFoundError('Staff profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Get staff profile by profile ID
  async getProfileById(profileId: string): Promise<IStaffProfile | null> {
    try {
      const profile = await StaffProfile.findById(profileId)
        .populate('userId', 'firstName lastName email phone profileImage')
        .populate('supervisorDoctorId', 'firstName lastName email');

      if (!profile) {
        throw new NotFoundError('Staff profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Get all staff profiles with pagination
  async getAllProfiles(
    limit: number = 10,
    page: number = 1,
    filters?: { staffRole?: string; department?: string }
  ): Promise<{
    profiles: IStaffProfile[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (filters?.staffRole) {
        query.staffRole = { $regex: filters.staffRole, $options: 'i' };
      }

      if (filters?.department) {
        query.department = { $regex: filters.department, $options: 'i' };
      }

      const profiles = await StaffProfile.find(query)
        .populate('userId', 'firstName lastName email phone profileImage')
        .populate('supervisorDoctorId', 'firstName lastName email')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

      const total = await StaffProfile.countDocuments(query);

      return {
        profiles,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw error;
    }
  }

  // Get staff by supervisor doctor ID
  async getStaffByDoctor(
    supervisorDoctorId: string,
    limit: number = 10,
    page: number = 1
  ): Promise<{
    profiles: IStaffProfile[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const profiles = await StaffProfile.find({ supervisorDoctorId })
        .populate('userId', 'firstName lastName email phone profileImage')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

      const total = await StaffProfile.countDocuments({ supervisorDoctorId });

      return {
        profiles,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw error;
    }
  }

  // Update specific fields
  async updateProfile(
    userId: string,
    updateData: Partial<IStaffProfile>
  ): Promise<IStaffProfile> {
    try {
      const profile = await StaffProfile.findOneAndUpdate(
        { userId },
        { ...updateData, profileCompleted: true },
        { new: true, runValidators: true }
      );

      if (!profile) {
        throw new NotFoundError('Staff profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Delete staff profile
  async deleteProfile(userId: string): Promise<{ message: string }> {
    try {
      const profile = await StaffProfile.findOneAndDelete({ userId });

      if (!profile) {
        throw new NotFoundError('Staff profile not found');
      }

      // Update user's profileCompleted status
      await User.findByIdAndUpdate(userId, { profileCompleted: false });

      return { message: 'Staff profile deleted successfully' };
    } catch (error: any) {
      throw error;
    }
  }

  // Check if staff profile is complete
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await StaffProfile.findOne({ userId });
      return profile?.profileCompleted || false;
    } catch (error: any) {
      throw error;
    }
  }
}

export default new StaffService();
