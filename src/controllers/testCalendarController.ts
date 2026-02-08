import { Request, Response } from 'express';
import User from '../models/User';
import Appointment from '../models/Appointment';
import DoctorProfile from '../models/DoctorProfile';
import googleCalendarService from '../services/googleCalendarService';

class TestCalendarController {
  /**
   * Test endpoint to send calendar invite for a patient's latest appointment
   * POST /api/test/send-calendar-invite
   * Body: { patientId: "696d1f59e52a37628d05bdf1" }
   */
  async sendCalendarInvite(req: Request, res: Response) {
    try {
      const { patientId } = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'patientId is required'
        });
      }

      console.log('\n🧪 TEST: Sending calendar invite for patient:', patientId);

      // 1. Get patient details
      const patient = await User.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      console.log('✅ Patient found:', {
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone
      });

      if (!patient.email) {
        return res.status(400).json({
          success: false,
          message: 'Patient has no email address'
        });
      }

      // 2. Get patient's latest appointment
      const appointment = await Appointment.findOne({
        patientId: patientId,
        status: { $in: ['confirmed', 'pending'] },
        appointmentDate: { $gte: new Date() } // Future appointments only
      })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .limit(1);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'No upcoming appointments found for this patient'
        });
      }

      console.log('✅ Appointment found:', {
        id: appointment._id,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        doctor: appointment.doctorId
      });

      // 3. Get doctor details
      const doctor = await User.findById(appointment.doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      console.log('✅ Doctor found:', {
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        email: doctor.email
      });

      // 4. Get doctor profile
      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      console.log('✅ Doctor profile found:', {
        googleCalendarId: doctorProfile.googleCalendarId,
        googleCalendarEnabled: doctorProfile.googleCalendarEnabled
      });

      // 5. Check if calendar is enabled
      if (!doctorProfile.googleCalendarEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Doctor has not enabled Google Calendar integration',
          details: {
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            googleCalendarEnabled: false
          }
        });
      }

      if (!doctorProfile.googleCalendarId) {
        return res.status(400).json({
          success: false,
          message: 'Doctor has not configured Google Calendar ID',
          details: {
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            googleCalendarId: null
          }
        });
      }

      // 6. Create calendar event
      console.log('📅 Creating Google Calendar event...');

      const result = await googleCalendarService.createAppointmentEvent(doctorProfile, {
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        doctorEmail: doctor.email,
        appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
        appointmentTime: appointment.appointmentTime,
        duration: appointment.duration || 30,
        reasonForVisit: appointment.reasonForVisit || 'General consultation',
        consultationType: appointment.consultationType,
      });

      if (result.success) {
        console.log('✅ Calendar event created successfully!');
        console.log('📅 Google Meet link:', result.meetLink);

        // Save meet link to appointment
        appointment.notes = appointment.notes 
          ? `${appointment.notes}\n\nGoogle Meet: ${result.meetLink}`
          : `Google Meet: ${result.meetLink}`;
        await appointment.save();

        return res.status(200).json({
          success: true,
          message: 'Calendar invite sent successfully!',
          data: {
            patient: {
              name: `${patient.firstName} ${patient.lastName}`,
              email: patient.email
            },
            doctor: {
              name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              email: doctor.email
            },
            appointment: {
              id: appointment._id,
              date: appointment.appointmentDate,
              time: appointment.appointmentTime,
              reason: appointment.reasonForVisit
            },
            calendar: {
              meetLink: result.meetLink,
              eventId: result.eventId
            }
          }
        });
      } else {
        console.log('❌ Failed to create calendar event:', result.error);

        return res.status(500).json({
          success: false,
          message: 'Failed to create calendar event',
          error: result.error,
          details: {
            doctorCalendarId: doctorProfile.googleCalendarId,
            doctorCalendarEnabled: doctorProfile.googleCalendarEnabled
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Test calendar invite error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send calendar invite',
        error: error.message
      });
    }
  }
}

export default new TestCalendarController();
