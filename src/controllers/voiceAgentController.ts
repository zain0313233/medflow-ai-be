import { Request, Response } from 'express';
import appointmentService from '../services/appointmentService';
import DoctorProfile from '../models/DoctorProfile';
import User from '../models/User';

class VoiceAgentController {
  // Get list of available doctors with their specializations
  async getDoctors(req: Request, res: Response) {
    try {
      const doctors = await User.find({ 
        role: 'doctor', 
        isActive: true,
        profileCompleted: true 
      }).select('firstName lastName email specialization');

      const doctorProfiles = await DoctorProfile.find({
        userId: { $in: doctors.map(d => d._id) }
      }).populate('userId', 'firstName lastName specialization');

      const availableDoctors = doctorProfiles.map(profile => ({
        id: (profile.userId as any)._id,
        name: `Dr. ${(profile.userId as any).firstName} ${(profile.userId as any).lastName}`,
        specialization: profile.specialization,
        workingDays: profile.workingDays,
        workingHours: profile.workingHours,
        consultationType: profile.consultationType,
        appointmentDuration: profile.appointmentDuration
      }));

      res.status(200).json({
        success: true,
        message: 'Available doctors retrieved successfully',
        data: availableDoctors
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get doctors'
      });
    }
  }

  // Get doctor by specialization
  async getDoctorsBySpecialization(req: Request, res: Response) {
    try {
      const { specialization } = req.params;

      const doctorProfiles = await DoctorProfile.find({
        specialization: { $regex: specialization, $options: 'i' }
      }).populate('userId', 'firstName lastName specialization isActive');

      const availableDoctors = doctorProfiles
        .filter(profile => (profile.userId as any).isActive)
        .map(profile => ({
          id: (profile.userId as any)._id,
          name: `Dr. ${(profile.userId as any).firstName} ${(profile.userId as any).lastName}`,
          specialization: profile.specialization,
          workingDays: profile.workingDays,
          workingHours: profile.workingHours,
          consultationType: profile.consultationType,
          appointmentDuration: profile.appointmentDuration
        }));

      res.status(200).json({
        success: true,
        message: `Doctors for ${specialization} retrieved successfully`,
        data: availableDoctors
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get doctors by specialization'
      });
    }
  }

  // Check availability for multiple doctors on a date
  async checkAvailability(req: Request, res: Response) {
    try {
      const { date, doctorIds } = req.body;

      if (!date || !doctorIds || !Array.isArray(doctorIds)) {
        return res.status(400).json({
          success: false,
          message: 'Date and doctorIds array are required'
        });
      }

      const availability = [];

      for (const doctorId of doctorIds) {
        try {
          const slots = await appointmentService.getAvailableSlots(doctorId, date);
          const doctor = await User.findById(doctorId).select('firstName lastName');
          
          availability.push({
            doctorId,
            doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown',
            date,
            availableSlots: slots.filter(slot => slot.available).map(slot => slot.time),
            totalSlots: slots.length,
            availableCount: slots.filter(slot => slot.available).length
          });
        } catch {
          availability.push({
            doctorId,
            doctorName: 'Unknown',
            date,
            availableSlots: [],
            totalSlots: 0,
            availableCount: 0,
            error: 'Failed to check availability'
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Availability checked successfully',
        data: availability
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check availability'
      });
    }
  }

  // Book appointment via voice agent
  async bookAppointment(req: Request, res: Response) {
    try {
      const {
        doctorId,
        appointmentDate,
        appointmentTime,
        patientName,
        patientPhone,
        patientEmail,
        consultationType = 'in-person',
        reasonForVisit,
        symptoms,
        voiceAgentData
      } = req.body;

      // Validate required fields
      if (!doctorId || !appointmentDate || !appointmentTime || !patientName || !patientPhone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: doctorId, appointmentDate, appointmentTime, patientName, patientPhone'
        });
      }

      // Get doctor info for response
      const doctor = await User.findById(doctorId).select('firstName lastName');
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const appointmentData = {
        doctorId,
        appointmentDate,
        appointmentTime,
        consultationType,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail?.trim(),
        reasonForVisit: reasonForVisit?.trim(),
        symptoms: symptoms?.trim(),
        voiceAgentBooking: true,
        voiceAgentData: {
          ...voiceAgentData,
          timestamp: new Date().toISOString()
        }
      };

      const appointment = await appointmentService.createAppointment(appointmentData);

      // Return simplified response for voice agent
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointmentId: appointment._id,
          confirmationNumber: appointment._id.toString().slice(-8).toUpperCase(),
          doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          patientName: appointment.patientName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          consultationType: appointment.consultationType,
          status: appointment.status,
          duration: appointment.duration
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to book appointment'
      });
    }
  }

  // Get appointment details by confirmation number
  async getAppointmentByConfirmation(req: Request, res: Response) {
    try {
      const { confirmationNumber } = req.params;

      if (!confirmationNumber || confirmationNumber.length !== 8) {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmation number'
        });
      }

      // Find appointment by last 8 characters of ID
      const appointments = await appointmentService.getAppointmentsByDoctor('');
      const appointment = appointments.find(apt => 
        apt._id.toString().slice(-8).toUpperCase() === confirmationNumber.toUpperCase()
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found with this confirmation number'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment found',
        data: {
          appointmentId: appointment._id,
          confirmationNumber: appointment._id.toString().slice(-8).toUpperCase(),
          doctorName: appointment.doctorId,
          patientName: appointment.patientName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          consultationType: appointment.consultationType,
          status: appointment.status,
          reasonForVisit: appointment.reasonForVisit,
          voiceAgentBooking: appointment.voiceAgentBooking
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get appointment'
      });
    }
  }

  // Cancel appointment via voice agent
  async cancelAppointment(req: Request, res: Response) {
    try {
      const { confirmationNumber } = req.params;
      const { reason } = req.body;

      if (!confirmationNumber || confirmationNumber.length !== 8) {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmation number'
        });
      }

      // Find appointment by confirmation number
      const appointments = await appointmentService.getAppointmentsByDoctor('');
      const appointment = appointments.find(apt => 
        apt._id.toString().slice(-8).toUpperCase() === confirmationNumber.toUpperCase()
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found with this confirmation number'
        });
      }

      const cancelledAppointment = await appointmentService.cancelAppointment(
        appointment._id.toString(),
        reason || 'Cancelled via voice agent'
      );

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: {
          appointmentId: cancelledAppointment._id,
          confirmationNumber: confirmationNumber.toUpperCase(),
          status: cancelledAppointment.status,
          patientName: cancelledAppointment.patientName,
          appointmentDate: cancelledAppointment.appointmentDate,
          appointmentTime: cancelledAppointment.appointmentTime
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to cancel appointment'
      });
    }
  }

  // Health check for voice agent
  async healthCheck(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        message: 'Voice agent API is healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
          getDoctors: 'GET /api/voice-agent/doctors',
          getDoctorsBySpecialization: 'GET /api/voice-agent/doctors/specialization/:specialization',
          checkAvailability: 'POST /api/voice-agent/availability',
          bookAppointment: 'POST /api/voice-agent/book',
          getAppointment: 'GET /api/voice-agent/appointment/:confirmationNumber',
          cancelAppointment: 'DELETE /api/voice-agent/appointment/:confirmationNumber'
        }
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Voice agent API health check failed'
      });
    }
  }
}

export default new VoiceAgentController();