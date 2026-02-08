import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorStatus extends Document {
  doctorId: mongoose.Schema.Types.ObjectId;
  date: Date;
  status: 'on-time' | 'running-late' | 'emergency';
  delayMinutes: number;
  reason?: string;
  updatedBy: mongoose.Schema.Types.ObjectId;
  updatedAt: Date;
  affectedAppointments: mongoose.Schema.Types.ObjectId[];
  notificationsSent: {
    inApp: number;
    email: number;
  };
  clearedAt?: Date;
  clearedBy?: mongoose.Schema.Types.ObjectId;
}

const doctorStatusSchema: Schema<IDoctorStatus> = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['on-time', 'running-late', 'emergency'],
        message: 'Status must be on-time, running-late, or emergency'
      },
      required: [true, 'Status is required'],
      default: 'on-time'
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Delay cannot be negative'],
      max: [240, 'Delay cannot exceed 4 hours']
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Updated by is required']
    },
    affectedAppointments: [{
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    }],
    notificationsSent: {
      inApp: {
        type: Number,
        default: 0
      },
      email: {
        type: Number,
        default: 0
      }
    },
    clearedAt: {
      type: Date
    },
    clearedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
doctorStatusSchema.index({ doctorId: 1, date: 1 });

export default mongoose.model<IDoctorStatus>('DoctorStatus', doctorStatusSchema);
