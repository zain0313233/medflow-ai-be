import { Request, Response } from 'express';
import appointmentService, { CreateAppointmentData } from '../services/appointmentService';

class AppointmentController {
  // Create new appointment
  async createAppointment(req: Request, res: Response) {
    try {
      const appointmentData: CreateAppointmentData = {
        ...req.body,
        patientId: req.body.patientId || req.user?.userId // Use authenticated user if no patientId provided
      };

      const appointment = await appointmentService.createAppointment(appointmentData);

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to create appointment'
      });
    }
  }

  // Create appointment via voice agent (no authentication required)
  async createVoiceAppointment(req: Request, res: Response) {
    try {
      const appointmentData: CreateAppointmentData = {
        ...req.body,
        voiceAgentBooking: true
      };

      // Validate required fields for voice booking
      if (!appointmentData.doctorId || !appointmentData.appointmentDate || 
          !appointmentData.appointmentTime || !appointmentData.patientName || 
          !appointmentData.patientPhone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: doctorId, appointmentDate, appointmentTime, patientName, patientPhone'
        });
      }

      const appointment = await appointmentService.createAppointment(appointmentData);

      res.status(201).json({
        success: true,
        message: 'Voice appointment booked successfully',
        data: {
          appointmentId: appointment._id,
          doctorName: appointment.doctorId,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          patientName: appointment.patientName,
          status: appointment.status
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to book voice appointment'
      });
    }
  }

  // Get available slots for a doctor
  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { doctorId, date } = req.params;

      if (!date || !doctorId) {
        return res.status(400).json({
          success: false,
          message: 'Doctor ID and date are required'
        });
      }

      const slots = await appointmentService.getAvailableSlots(doctorId, date);

      res.status(200).json({
        success: true,
        message: 'Available slots retrieved successfully',
        data: {
          doctorId,
          date,
          slots
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get available slots'
      });
    }
  }

  // Get appointments by doctor
  async getDoctorAppointments(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { date, status } = req.query;

      // Check if user is the doctor or has admin role
      if (req.user?.userId !== doctorId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const appointments = await appointmentService.getAppointmentsByDoctor(
        doctorId,
        date as string,
        status as string
      );

      res.status(200).json({
        success: true,
        message: 'Doctor appointments retrieved successfully',
        data: appointments
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get doctor appointments'
      });
    }
  }

  // Get my appointments (for authenticated doctor)
  async getMyAppointments(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { date, status } = req.query;

      const appointments = await appointmentService.getAppointmentsByDoctor(
        req.user.userId,
        date as string,
        status as string
      );

      res.status(200).json({
        success: true,
        message: 'My appointments retrieved successfully',
        data: appointments
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get appointments'
      });
    }
  }

  // Get appointments by patient
  async getPatientAppointments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { status } = req.query;

      // Check if user is the patient or has admin role
      if (req.user?.userId !== patientId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const appointments = await appointmentService.getAppointmentsByPatient(
        patientId,
        status as string
      );

      res.status(200).json({
        success: true,
        message: 'Patient appointments retrieved successfully',
        data: appointments
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get patient appointments'
      });
    }
  }

  // Get my patient appointments (for authenticated patient)
  async getMyPatientAppointments(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { status } = req.query;

      const appointments = await appointmentService.getAppointmentsByPatient(
        req.user.userId,
        status as string
      );

      res.status(200).json({
        success: true,
        message: 'My appointments retrieved successfully',
        data: appointments
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get appointments'
      });
    }
  }

  // Get appointment by ID
  async getAppointmentById(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;

      const appointment = await appointmentService.getAppointmentById(appointmentId);

      // Check if user has access to this appointment
      if (req.user?.userId !== appointment.patientId?.toString() && 
          req.user?.userId !== appointment.doctorId?.toString() && 
          req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment retrieved successfully',
        data: appointment
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get appointment'
      });
    }
  }

  // Update appointment status
  async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const appointment = await appointmentService.updateAppointmentStatus(
        appointmentId,
        status,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Appointment status updated successfully',
        data: appointment
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update appointment status'
      });
    }
  }

  // Cancel appointment
  async cancelAppointment(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;

      const appointment = await appointmentService.cancelAppointment(appointmentId, reason);

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to cancel appointment'
      });
    }
  }

  // Get all appointments (admin only)
  async getAllAppointments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, date } = req.query;
      
      const query: any = {};
      if (status) query.status = status;
      if (date) query.appointmentDate = new Date(date as string);

      const appointments = await appointmentService.getAppointmentsByDoctor('', date as string, status as string);

      res.status(200).json({
        success: true,
        message: 'All appointments retrieved successfully',
        data: appointments
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get appointments'
      });
    }
  }
}

export default new AppointmentController();