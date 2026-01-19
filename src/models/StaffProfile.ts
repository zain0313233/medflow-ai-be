import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffProfile extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  gender?: 'male' | 'female' | 'other';
  dob?: Date;
  photo?: string;
  staffRole: string; // 'nurse', 'technician', 'receptionist', etc.
  employeeId: string;
  department: string;
  experienceYears: number;
  supervisorDoctorId?: mongoose.Schema.Types.ObjectId;
  shiftTiming: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', ...]
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const staffProfileSchema: Schema<IStaffProfile> = new Schema(
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
    staffRole: {
      type: String,
      required: [true, 'Staff role is required'],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience years is required'],
      min: [0, 'Experience years cannot be negative']
    },
    supervisorDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    shiftTiming: {
      start: {
        type: String,
        required: [true, 'Shift start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      end: {
        type: String,
        required: [true, 'Shift end time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      }
    },
    workingDays: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required']
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number']
      },
      relationship: {
        type: String,
        required: [true, 'Emergency contact relationship is required']
      }
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

const StaffProfile = mongoose.model<IStaffProfile>('StaffProfile', staffProfileSchema);

export default StaffProfile;
