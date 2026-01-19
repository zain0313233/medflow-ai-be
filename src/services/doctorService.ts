import DoctorProfile, { IDoctorProfile } from '../models/DoctorProfile';
import User from '../models/User';
import { NotFoundError, ValidationError } from '../utils/errors';

class DoctorService {
  // Create or update doctor profile
  async createOrUpdateProfile(
    userId: string,
    profileData: Partial<IDoctorProfile>
  ): Promise<IDoctorProfile> {
    try {
      // Verify user exists and is a doctor
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.role !== 'doctor') {
        throw new ValidationError('User is not a doctor');
      }

      // Check if profile exists
      let profile = await DoctorProfile.findOne({ userId });

      if (profile) {
        // Update existing profile
        Object.assign(profile, {
          ...profileData,
          profileCompleted: true
        });
        await profile.save();
      } else {
        // Create new profile
        profile = new DoctorProfile({
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

  // Get doctor profile by userId
  async getProfileByUserId(userId: string): Promise<IDoctorProfile | null> {
    try {
      const profile = await DoctorProfile.findOne({ userId }).populate(
        'userId',
        'firstName lastName email phone profileImage'
      );

      if (!profile) {
        throw new NotFoundError('Doctor profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Get doctor profile by profile ID
  async getProfileById(profileId: string): Promise<IDoctorProfile | null> {
    try {
      const profile = await DoctorProfile.findById(profileId).populate(
        'userId',
        'firstName lastName email phone profileImage'
      );

      if (!profile) {
        throw new NotFoundError('Doctor profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Get all doctor profiles with pagination
  async getAllProfiles(
    limit: number = 10,
    page: number = 1,
    filters?: { specialization?: string; department?: string }
  ): Promise<{
    profiles: IDoctorProfile[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (filters?.specialization) {
        query.specialization = { $regex: filters.specialization, $options: 'i' };
      }

      const profiles = await DoctorProfile.find(query)
        .populate('userId', 'firstName lastName email phone profileImage')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

      const total = await DoctorProfile.countDocuments(query);

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
    updateData: Partial<IDoctorProfile>
  ): Promise<IDoctorProfile> {
    try {
      const profile = await DoctorProfile.findOneAndUpdate(
        { userId },
        { ...updateData, profileCompleted: true },
        { new: true, runValidators: true }
      );

      if (!profile) {
        throw new NotFoundError('Doctor profile not found');
      }

      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  // Delete doctor profile
  async deleteProfile(userId: string): Promise<{ message: string }> {
    try {
      const profile = await DoctorProfile.findOneAndDelete({ userId });

      if (!profile) {
        throw new NotFoundError('Doctor profile not found');
      }

      // Update user's profileCompleted status
      await User.findByIdAndUpdate(userId, { profileCompleted: false });

      return { message: 'Doctor profile deleted successfully' };
    } catch (error: any) {
      throw error;
    }
  }

  // Check if doctor profile is complete
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await DoctorProfile.findOne({ userId });
      return profile?.profileCompleted || false;
    } catch (error: any) {
      throw error;
    }
  }
}

export default new DoctorService();
