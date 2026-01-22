import { Request, Response } from 'express';
import appointmentService from '../services/appointmentService';
import VoiceCall from '../models/VoiceCall';
import User from '../models/User';
import {
  parseRelativeDate,
  parseTime,
  formatPhoneNumber,
  formatDuration,
  extractPatientName,
  getChannelType,
  calculateCostSummary
} from '../utils/voiceAgentHelpers';

interface VoiceAgentWebhookData {
  event: 'appointment_request' | 'appointment_confirmation' | 'appointment_cancellation';
  callId: string;
  timestamp: string;
  agentId?: string; 
  patient: {
    name: string;
    phone: string;
    email?: string;
  };
  appointment: {
    doctorId?: string;
    doctorName?: string;
    specialization?: string;
    preferredDate?: string;
    preferredTime?: string;
    consultationType?: 'online' | 'in-person';
    reasonForVisit?: string;
    symptoms?: string;
  };
  conversation: {
    transcript: string;
    confidence: number;
    intent: string;
  };
  confirmationNumber?: string;
}

class WebhookController {
  // Main webhook endpoint for Retell AI voice agent
  async handleVoiceAgentWebhook(req: Request, res: Response) {
    try {
      console.log('📞 Retell Webhook Received');
      console.log('Event:', req.body.event);
      console.log('Full Payload:', JSON.stringify(req.body, null, 2));
      
      const { event, call } = req.body;
      
      // ✅ ALWAYS return 200 immediately to Retell (they need fast acknowledgment)
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received and processing',
        event: event,
        callId: call?.call_id
      });
      
      // Process async (won't block Retell's webhook)
      this.processRetellWebhook(event, call).catch(error => {
        console.error('❌ Async webhook processing error:', error);
      });

    } catch (error: any) {
      console.error('❌ Webhook Error:', error);
      // Still return 200 to Retell - don't let errors block them
      if (!res.headersSent) {
        res.status(200).json({ 
          success: true, 
          error: 'Processing failed but acknowledged' 
        });
      }
    }
  }

  // Process Retell webhook asynchronously
  private async processRetellWebhook(event: string, call: any) {
    try {
      // Save call record for ALL calls (successful or not)
      const voiceCall = await this.saveVoiceCallRecord(event, call);
      console.log(`✅ Voice call record saved: ${voiceCall._id} (Event: ${event})`);
      
      // Only create appointment if call was successful and booking confirmed
      if (event === 'call_analyzed' || event === 'call_ended') {
        const analysis = call?.call_analysis;
        const customData = analysis?.custom_analysis_data;
        
        console.log('📊 Custom Analysis Data:', JSON.stringify(customData, null, 2));
        
        if (customData?.appointment_booked === true) {
          console.log('📅 Appointment booking detected, creating appointment...');
          
          try {
            const appointment = await this.createAppointmentFromCall(call, voiceCall._id);
            
            // Update voice call with appointment reference
            voiceCall.appointmentId = appointment._id;
            await voiceCall.save();
            
            console.log(`✅ Appointment created and linked: ${appointment._id}`);
            console.log(`   Patient: ${appointment.patientName}`);
            console.log(`   Doctor: ${appointment.doctorName}`);
            console.log(`   Date: ${appointment.appointmentDate}`);
            console.log(`   Time: ${appointment.appointmentTime}`);
            
          } catch (appointmentError: any) {
            console.error('❌ Failed to create appointment:', appointmentError.message);
            console.error('   Call ID:', call?.call_id);
            console.error('   Custom Data:', customData);
            // Don't throw - we already saved the call record
          }
          
        } else {
          console.log(`ℹ️ No appointment booked in this call (appointment_booked: ${customData?.appointment_booked})`);
        }
      } else {
        console.log(`ℹ️ Event ${event} - skipping appointment check`);
      }
      
    } catch (error: any) {
      console.error('❌ Error processing Retell webhook:', error);
      console.error('   Event:', event);
      console.error('   Call ID:', call?.call_id);
      throw error;
    }
  }

  // Save voice call record to database (with upsert to handle duplicate webhooks)
  private async saveVoiceCallRecord(event: string, call: any) {
    try {
      const analysis = call?.call_analysis;
      const customData = analysis?.custom_analysis_data;
      
      // Extract phone number (prioritize from_number)
      const patientPhone = formatPhoneNumber(
        call?.from_number,
        customData?.phone_number
      );
      
      // Extract patient name
      const patientName = extractPatientName(customData?.patient_name);
      
      // Calculate duration
      const startTime = call?.start_timestamp ? new Date(call.start_timestamp) : new Date();
      const endTime = call?.end_timestamp ? new Date(call.end_timestamp) : new Date();
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const voiceCallData = {
        // Call Identity
        callId: call?.call_id || `call_${Date.now()}`,
        agentId: call?.agent_id || 'agent_8eec7ec5373d0b2d56347fd0e8',
        
        // Call Outcome
        sessionOutcome: analysis?.call_successful ? 'Successful' : 'Unsuccessful',
        callSuccessful: analysis?.call_successful || false,
        appointmentBooked: customData?.appointment_booked || false,
        
        // Timing
        startTime: startTime,
        endTime: endTime,
        duration: formatDuration(durationSeconds),
        durationSeconds: durationSeconds,
        
        // Performance Metrics
        latency: call?.latency,
        
        // User Experience
        userSentiment: analysis?.user_sentiment,
        disconnectionReason: call?.disconnection_reason,
        endReason: call?.end_reason,
        
        // Cost
        callCost: calculateCostSummary(call?.call_cost),
        
        // Content
        transcript: call?.transcript,
        callSummary: analysis?.call_summary,
        recordingUrl: call?.recording_url,
        recordingMultiChannelUrl: call?.recording_multi_channel_url,
        publicLogUrl: call?.public_log_url,
        
        // Extracted Data
        customAnalysisData: customData,
        
        // Patient Contact (source of truth)
        patientPhone: patientPhone,
        patientName: patientName,
        
        // Metadata
        channelType: getChannelType(call),
        metadata: call?.metadata
      };
      
      // ✅ Use findOneAndUpdate with upsert to handle duplicate webhooks
      // First webhook (call_ended) → creates record
      // Second webhook (call_analyzed) → updates with full data
      const voiceCall = await VoiceCall.findOneAndUpdate(
        { callId: call?.call_id },  // Find by callId
        voiceCallData,               // Update with new data
        { 
          upsert: true,              // Create if doesn't exist
          new: true,                 // Return updated document
          setDefaultsOnInsert: true  // Set defaults on insert
        }
      );
      
      console.log(`✅ Voice call ${voiceCall._id} saved/updated (${event})`);
      return voiceCall;
      
    } catch (error: any) {
      console.error('❌ Error saving voice call record:', error);
      throw error;
    }
  }

  // Create appointment from successful call
  private async createAppointmentFromCall(call: any, voiceCallId: any) {
    try {
      const analysis = call?.call_analysis;
      const customData = analysis?.custom_analysis_data;
      
      if (!customData) {
        throw new Error('No custom analysis data found in call');
      }
      
      // ✅ Extract patientId from metadata (from logged-in user)
      const patientId = call?.metadata?.patientId;
      
      if (!patientId) {
        throw new Error('Patient ID not found in call metadata. Patient must be logged in to book appointments.');
      }
      
      console.log('📋 Creating appointment from call data:');
      console.log('   Patient ID:', patientId);
      console.log('   Patient Name:', customData.patient_name);
      console.log('   Preferred Doctor:', customData.preferred_doctor);
      console.log('   Preferred Date:', customData.preferred_date);
      console.log('   Preferred Time:', customData.preferred_time);
      console.log('   Reason:', customData.reason_for_visit);
      
      // Get patient details from database
      const patient = await User.findById(patientId);
      if (!patient) {
        throw new Error(`Patient not found with ID: ${patientId}`);
      }
      
      console.log('✅ Patient found:', {
        id: patient._id,
        name: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        email: patient.email
      });
      
      // Extract and format data
      const patientPhone = formatPhoneNumber(
        patient.phone,  // ✅ Use phone from patient account
        call?.from_number || customData.phone_number
      );
      
      // Only include phone if it's valid (not "N/A")
      const validPhone = patientPhone !== 'N/A' ? patientPhone : undefined;
      
      const patientName = extractPatientName(
        customData.patient_name || `${patient.firstName} ${patient.lastName}`
      );
      
      // Parse date and time
      const appointmentDate = parseRelativeDate(customData.preferred_date);
      const appointmentTime = parseTime(customData.preferred_time);
      
      console.log('   Parsed Date:', appointmentDate);
      console.log('   Parsed Time:', appointmentTime);
      console.log('   Patient Phone:', validPhone || 'Not provided');
      
      // Prepare appointment data
      const appointmentData = {
        // Patient Info (from logged-in user)
        patientId: patientId,  // ✅ From metadata
        patientName: patientName,
        patientPhone: validPhone,  // ✅ Only if valid, otherwise undefined
        patientEmail: patient.email,
        
        // Doctor Info (from knowledge base for now)
        doctorName: customData.preferred_doctor || 'Dr. Sara',
        doctorId: '675b8e123456789012345678', // Default doctor ID for now
        
        // Appointment Details
        reasonForVisit: customData.reason_for_visit || 'General consultation',
        symptoms: customData.symptoms || customData.reason_for_visit,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        consultationType: 'in-person' as const,
        duration: 30,
        status: 'confirmed' as const,
        
        // Booking Source
        bookingSource: 'voice_agent' as const,
        voiceCallId: voiceCallId,
        voiceAgentBooking: true,
        voiceAgentData: {
          callId: call?.call_id,
          transcript: call?.transcript || analysis?.call_summary,
          confidence: 0.95,
          agentId: call?.agent_id,
          userSentiment: analysis?.user_sentiment,
          callSuccessful: analysis?.call_successful
        }
      };
      
      console.log('💾 Saving appointment to database...');
      
      // Create appointment
      const appointment = await appointmentService.createAppointment(appointmentData);
      
      console.log('✅ Appointment created successfully:', {
        id: appointment._id,
        patient: patientName,
        patientId: patientId,
        doctor: appointmentData.doctorName,
        date: appointmentDate,
        time: appointmentTime,
        status: appointment.status
      });
      
      return appointment;
      
    } catch (error: any) {
      console.error('❌ Error creating appointment from call:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  // Handle appointment booking request
  private async handleAppointmentRequest(webhookData: VoiceAgentWebhookData) {
    try {
      const { patient, appointment, conversation, callId } = webhookData;

      // Validate required fields for booking
      if (!patient.name || !patient.phone) {
        throw new Error('Patient name and phone are required');
      }

      if (!appointment.doctorId || !appointment.preferredDate || !appointment.preferredTime) {
        throw new Error('Doctor ID, preferred date, and time are required');
      }

      // Create appointment
      const appointmentData = {
        doctorId: appointment.doctorId,
        appointmentDate: appointment.preferredDate,
        appointmentTime: appointment.preferredTime,
        consultationType: appointment.consultationType || 'in-person',
        patientName: patient.name.trim(),
        patientPhone: patient.phone.trim(),
        patientEmail: patient.email?.trim(),
        reasonForVisit: appointment.reasonForVisit?.trim(),
        symptoms: appointment.symptoms?.trim(),
        voiceAgentBooking: true,
        voiceAgentData: {
          callId,
          transcript: conversation.transcript,
          confidence: conversation.confidence,
          intent: conversation.intent,
          timestamp: webhookData.timestamp,
          agentId: webhookData.agentId || 'agent_8eec7ec5373d0b2d56347fd0e8'
        }
      };

      const createdAppointment = await appointmentService.createAppointment(appointmentData);

      console.log('✅ Appointment created via webhook:', createdAppointment._id);

      return {
        appointmentId: createdAppointment._id,
        confirmationNumber: createdAppointment._id.toString().slice(-8).toUpperCase(),
        status: createdAppointment.status,
        appointmentDate: createdAppointment.appointmentDate,
        appointmentTime: createdAppointment.appointmentTime,
        patientName: createdAppointment.patientName,
        doctorName: createdAppointment.doctorId
      };

    } catch (error: any) {
      console.error('❌ Appointment request error:', error);
      throw error;
    }
  }

  // Handle appointment confirmation
  private async handleAppointmentConfirmation(webhookData: VoiceAgentWebhookData) {
    try {
      const { confirmationNumber } = webhookData;

      if (!confirmationNumber) {
        throw new Error('Confirmation number is required');
      }

      // Find appointment by confirmation number (last 8 chars of ID)
      const appointments = await appointmentService.getAppointmentsByDoctor('');
      const appointment = appointments.find(apt => 
        apt._id.toString().slice(-8).toUpperCase() === confirmationNumber.toUpperCase()
      );

      if (!appointment) {
        throw new Error('Appointment not found with this confirmation number');
      }

      // Update appointment status to confirmed
      const updatedAppointment = await appointmentService.updateAppointmentStatus(
        appointment._id.toString(),
        'confirmed',
        'Confirmed via voice agent'
      );

      console.log('✅ Appointment confirmed via webhook:', appointment._id);

      return {
        appointmentId: updatedAppointment._id,
        confirmationNumber: confirmationNumber.toUpperCase(),
        status: updatedAppointment.status,
        patientName: updatedAppointment.patientName
      };

    } catch (error: any) {
      console.error('❌ Appointment confirmation error:', error);
      throw error;
    }
  }

  // Handle appointment cancellation
  private async handleAppointmentCancellation(webhookData: VoiceAgentWebhookData) {
    try {
      const { confirmationNumber, conversation } = webhookData;

      if (!confirmationNumber) {
        throw new Error('Confirmation number is required');
      }

      // Find appointment by confirmation number
      const appointments = await appointmentService.getAppointmentsByDoctor('');
      const appointment = appointments.find(apt => 
        apt._id.toString().slice(-8).toUpperCase() === confirmationNumber.toUpperCase()
      );

      if (!appointment) {
        throw new Error('Appointment not found with this confirmation number');
      }

      // Cancel appointment
      const cancelledAppointment = await appointmentService.cancelAppointment(
        appointment._id.toString(),
        `Cancelled via voice agent: ${conversation?.transcript || 'No reason provided'}`
      );

      console.log('✅ Appointment cancelled via webhook:', appointment._id);

      return {
        appointmentId: cancelledAppointment._id,
        confirmationNumber: confirmationNumber.toUpperCase(),
        status: cancelledAppointment.status,
        patientName: cancelledAppointment.patientName
      };

    } catch (error: any) {
      console.error('❌ Appointment cancellation error:', error);
      throw error;
    }
  }

  // Webhook for receiving appointment data from voice agent
  async receiveAppointmentData(req: Request, res: Response) {
    try {
      console.log('📋 Appointment Data Received:', JSON.stringify(req.body, null, 2));
      
      const appointmentData = req.body;

      // Store the raw appointment data for processing
      // You can save this to a separate collection or process immediately
      
      res.status(200).json({
        success: true,
        message: 'Appointment data received successfully',
        timestamp: new Date().toISOString(),
        receivedData: {
          callId: appointmentData.callId,
          patientName: appointmentData.patientName,
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime
        }
      });

    } catch (error: any) {
      console.error('❌ Appointment data reception error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to receive appointment data'
      });
    }
  }

  // Health check for webhook
  async webhookHealthCheck(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        message: 'Webhook endpoint is healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
          voiceAgentWebhook: 'POST /api/webhook/voice-agent',
          appointmentData: 'POST /api/webhook/appointment-data',
          healthCheck: 'GET /api/webhook/health'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Webhook health check failed'
      });
    }
  }

  // Test webhook endpoint
  async testWebhook(req: Request, res: Response) {
    try {
      console.log('🧪 Test Webhook Called:', JSON.stringify(req.body, null, 2));
      
      res.status(200).json({
        success: true,
        message: 'Test webhook received successfully',
        timestamp: new Date().toISOString(),
        receivedData: req.body,
        headers: req.headers
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Test webhook failed'
      });
    }
  }
}

export default new WebhookController();