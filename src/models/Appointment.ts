import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Schema.Types.ObjectId;
  doctorId: mongoose.Schema.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string; // "14:30"
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  consultationType: 'online' | 'in-person';
  reasonForVisit?: string;
  symptoms?: string;
  notes?: string;
  patientPhone?: string;
  patientName?: string;
  patientEmail?: string;
  voiceAgentBooking?: boolean; // Flag to identify voice agent bookings
  voiceAgentData?: {
    callId?: string;
    transcript?: string;
    confidence?: number;
    agentId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema: Schema<IAppointment> = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
      index: true
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      max: [120, 'Maximum duration is 120 minutes'],
      default: 30
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
        message: 'Status must be pending, confirmed, completed, cancelled, or no-show'
      },
      default: 'pending',
      index: true
    },
    consultationType: {
      type: String,
      enum: {
        values: ['online', 'in-person'],
        message: 'Consultation type must be online or in-person'
      },
      required: [true, 'Consultation type is required']
    },
    reasonForVisit: {
      type: String,
      maxlength: [500, 'Reason for visit cannot exceed 500 characters']
    },
    symptoms: {
      type: String,
      maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    patientPhone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
    },
    patientName: {
      type: String,
      maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    patientEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    voiceAgentBooking: {
      type: Boolean,
      default: false,
      index: true
    },
    voiceAgentData: {
      callId: String,
      transcript: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      agentId: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Virtual for full appointment datetime
appointmentSchema.virtual('fullDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Pre-save middleware to validate appointment time doesn't conflict
appointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('appointmentDate') || this.isModified('appointmentTime')) {
    const conflictingAppointment = await mongoose.model('Appointment').findOne({
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: this._id }
    });

    if (conflictingAppointment) {
      const error = new Error('Doctor already has an appointment at this time');
      return next(error);
    }
  }
  next();
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);