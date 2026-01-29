import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  type: 'lab_report' | 'xray_report' | 'prescription' | 'vaccination_record' | 'medical_report' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByRole: 'patient' | 'doctor' | 'staff';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const MedicalDocumentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    type: {
      type: String,
      enum: ['lab_report', 'xray_report', 'prescription', 'vaccination_record', 'medical_report', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['patient', 'doctor', 'staff'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MedicalDocumentSchema.index({ userId: 1, createdAt: -1 });
MedicalDocumentSchema.index({ type: 1 });
MedicalDocumentSchema.index({ status: 1 });

export default mongoose.model<IMedicalDocument>('MedicalDocument', MedicalDocumentSchema);
