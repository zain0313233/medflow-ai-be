import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'staff';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  profileImage?: string;
  employeeId?: string;
  specialization?: string; // For doctors
  department?: string; // For staff
  licenseNumber?: string; // For doctors
  hireDate?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  clinicId?: mongoose.Schema.Types.ObjectId;
  lastLogin?: Date;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['patient', 'doctor', 'nurse', 'admin', 'staff'],
        message: 'Role must be patient, doctor, nurse, admin, or staff'
      },
      default: 'patient'
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be male, female, or other'
      }
    },
    profileImage: String,
    
    // Staff fields
    employeeId: String,
    specialization: String, // For doctors
    department: String, // For staff
    licenseNumber: String, // For doctors
    hireDate: Date,
    
    // Status & Verification
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Clinic Association
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic'
    },
    
    // Profile Completion
    profileCompleted: {
      type: Boolean,
      default: false
    },
    
    // Last Login
    lastLogin: Date
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
