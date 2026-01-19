import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceCall extends Document {
  // Call Identity
  callId: string;
  agentId: string;
  
  // Call Outcome
  sessionOutcome: 'Successful' | 'Unsuccessful';
  callSuccessful: boolean;
  appointmentBooked: boolean;
  
  // Timing
  startTime: Date;
  endTime?: Date;
  duration: string; // "1:44" format
  durationSeconds: number;
  
  // Performance Metrics
  latency?: {
    llm?: { p50?: number; p90?: number; min?: number; max?: number };
    e2e?: { p50?: number; p90?: number; min?: number; max?: number };
    tts?: { p50?: number; p90?: number; min?: number; max?: number };
  };
  
  // User Experience
  userSentiment?: 'Positive' | 'Neutral' | 'Negative';
  disconnectionReason?: string;
  endReason?: string;
  
  // Cost
  callCost?: {
    totalCost: number;
    durationSeconds: number;
    breakdown?: Array<{
      product: string;
      cost: number;
      unitPrice?: number;
    }>;
  };
  
  // Content
  transcript?: string;
  callSummary?: string;
  recordingUrl?: string;
  recordingMultiChannelUrl?: string;
  publicLogUrl?: string;
  
  // Extracted Data (from custom_analysis_data)
  customAnalysisData?: {
    patient_name?: string;
    reason_for_visit?: string;
    preferred_doctor?: string;
    preferred_date?: string;
    preferred_time?: string;
    appointment_booked?: boolean;
    phone_number?: string;
  };
  
  // Patient Contact (source of truth)
  patientPhone?: string; // From call.from_number
  patientName?: string;  // From extraction
  
  // Reference
  appointmentId?: mongoose.Types.ObjectId;
  
  // Metadata
  channelType: 'web_call' | 'phone_call';
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

const VoiceCallSchema: Schema = new Schema(
  {
    // Call Identity
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    agentId: {
      type: String,
      required: true,
      index: true
    },
    
    // Call Outcome
    sessionOutcome: {
      type: String,
      enum: ['Successful', 'Unsuccessful'],
      default: 'Unsuccessful'
    },
    callSuccessful: {
      type: Boolean,
      default: false
    },
    appointmentBooked: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // Timing
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: String
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    
    // Performance Metrics
    latency: {
      llm: {
        p50: Number,
        p90: Number,
        min: Number,
        max: Number
      },
      e2e: {
        p50: Number,
        p90: Number,
        min: Number,
        max: Number
      },
      tts: {
        p50: Number,
        p90: Number,
        min: Number,
        max: Number
      }
    },
    
    // User Experience
    userSentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative']
    },
    disconnectionReason: {
      type: String
    },
    endReason: {
      type: String
    },
    
    // Cost
    callCost: {
      totalCost: Number,
      durationSeconds: Number,
      breakdown: [{
        product: String,
        cost: Number,
        unitPrice: Number
      }]
    },
    
    // Content
    transcript: {
      type: String
    },
    callSummary: {
      type: String
    },
    recordingUrl: {
      type: String
    },
    recordingMultiChannelUrl: {
      type: String
    },
    publicLogUrl: {
      type: String
    },
    
    // Extracted Data
    customAnalysisData: {
      patient_name: String,
      reason_for_visit: String,
      preferred_doctor: String,
      preferred_date: String,
      preferred_time: String,
      appointment_booked: Boolean,
      phone_number: String
    },
    
    // Patient Contact (source of truth)
    patientPhone: {
      type: String,
      index: true
    },
    patientName: {
      type: String,
      index: true
    },
    
    // Reference
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    
    // Metadata
    channelType: {
      type: String,
      enum: ['web_call', 'phone_call'],
      default: 'web_call'
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes for analytics queries
VoiceCallSchema.index({ createdAt: -1 });
VoiceCallSchema.index({ callSuccessful: 1, appointmentBooked: 1 });
VoiceCallSchema.index({ agentId: 1, createdAt: -1 });

export default mongoose.model<IVoiceCall>('VoiceCall', VoiceCallSchema);
