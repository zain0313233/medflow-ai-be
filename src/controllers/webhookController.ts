import { Request, Response } from 'express';
import appointmentService from '../services/appointmentService';

interface VoiceAgentWebhookData {
  event: 'appointment_request' | 'appointment_confirmation' | 'appointment_cancellation';
  callId: string;
  timestamp: string;
  agentId?: string; // Your agent ID: agent_41b2fe861b141729747b0c151d
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
  // Main webhook endpoint for voice agent
  async handleVoiceAgentWebhook(req: Request, res: Response) {
    try {
      console.log('📞 Voice Agent Webhook Received:', JSON.stringify(req.body, null, 2));
      
      const webhookData: VoiceAgentWebhookData = req.body;
      
      // Validate webhook data
      if (!webhookData.event || !webhookData.callId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: event, callId'
        });
      }

      // Log agent ID if provided
      if (webhookData.agentId) {
        console.log(`🤖 Request from Agent ID: ${webhookData.agentId}`);
      }

      let result;
      
      switch (webhookData.event) {
        case 'appointment_request':
          result = await this.handleAppointmentRequest(webhookData);
          break;
          
        case 'appointment_confirmation':
          result = await this.handleAppointmentConfirmation(webhookData);
          break;
          
        case 'appointment_cancellation':
          result = await this.handleAppointmentCancellation(webhookData);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown event type: ${webhookData.event}`
          });
      }

      res.status(200).json({
        success: true,
        message: `Webhook processed successfully for event: ${webhookData.event}`,
        agentId: webhookData.agentId,
        data: result
      });

    } catch (error: any) {
      console.error('❌ Webhook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Webhook processing failed',
        callId: req.body.callId,
        agentId: req.body.agentId
      });
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
          agentId: webhookData.agentId || 'agent_41b2fe861b141729747b0c151d'
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