import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorProfile extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  gender?: 'male' | 'female' | 'other';
  dob?: Date;
  photo?: string;
  specialization: string;
  licenseNumber: string;
  licenseAuthority: string;
  licenseExpiry: Date;
  experienceYears: number;
  clinic?: string;
  designation: string;
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', ...]
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  breakTimes: Array<{
    start: string;
    end: string;
  }>;
  consultationType: 'online' | 'in-person' | 'both';
  appointmentDuration: number; // in minutes
  bio?: string;
  languages: string[];
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorProfileSchema: Schema<IDoctorProfile> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be male, female, or other'
      }
    },
    dob: Date,
    photo: String,
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      index: true
    },
    licenseAuthority: {
      type: String,
      required: [true, 'License authority is required'],
      trim: true
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required']
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience years is required'],
      min: [0, 'Experience years cannot be negative']
    },
    clinic: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    workingDays: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    workingHours: {
      start: {
        type: String,
        required: [true, 'Working hours start is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      end: {
        type: String,
        required: [true, 'Working hours end is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      }
    },
    breakTimes: [
      {
        start: {
          type: String,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
        },
        end: {
          type: String,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
        }
      }
    ],
    consultationType: {
      type: String,
      required: [true, 'Consultation type is required'],
      enum: {
        values: ['online', 'in-person', 'both'],
        message: 'Consultation type must be online, in-person, or both'
      }
    },
    appointmentDuration: {
      type: Number,
      required: [true, 'Appointment duration is required'],
      min: [15, 'Appointment duration must be at least 15 minutes']
    },
    bio: String,
    languages: {
      type: [String],
      default: ['English']
    },
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
