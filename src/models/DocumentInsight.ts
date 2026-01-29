import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentInsight extends Document {
  documentId: mongoose.Types.ObjectId;
  extractedText: string;
  aiSummary: string;
  structuredData: {
    conditions?: string[];
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      purpose?: string;
    }>;
    lifestyleAdvice?: string[];
    dietRestrictions?: string[];
    exercises?: string[];
    followUp?: string;
    abnormalFindings?: string[];
    testResults?: Array<{
      testName: string;
      value: string;
      normalRange?: string;
      status?: 'normal' | 'high' | 'low' | 'abnormal';
    }>;
  };
  flags: string[];
  confidence: 'high' | 'medium' | 'low';
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentInsightSchema: Schema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalDocument',
      required: true,
      unique: true,
      index: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    aiSummary: {
      type: String,
      required: true,
    },
    structuredData: {
      conditions: [String],
      medications: [
        {
          name: { type: String, required: true },
          dosage: String,
          frequency: String,
          duration: String,
          purpose: String,
        },
      ],
      lifestyleAdvice: [String],
      dietRestrictions: [String],
      exercises: [String],
      followUp: String,
      abnormalFindings: [String],
      testResults: [
        {
          testName: String,
          value: String,
          normalRange: String,
          status: {
            type: String,
            enum: ['normal', 'high', 'low', 'abnormal'],
          },
        },
      ],
    },
    flags: {
      type: [String],
      default: [],
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    processingTime: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDocumentInsight>('DocumentInsight', DocumentInsightSchema);
