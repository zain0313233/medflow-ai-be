import { Request, Response } from 'express';
import crypto from 'crypto';
import appointmentService from '../services/appointmentService';
import DoctorProfile from '../models/DoctorProfile';
import User from '../models/User';

/**
 * Retell Custom Functions Controller
 * Handles real-time function calls from Retell AI voice agent
 * All endpoints verify Retell signature for security
 */
class RetellFunctionsController {
  
  /**
   * Verify Retell signature for security
   * Retell signs all requests with HMAC-SHA256
   */
  private verifyRetellSignature(req: Request): boolean {
    const signature = req.headers['x-retell-signature'] as string;
    const apiKey = process.env.RETELL_API_KEY;

    if (!signature || !apiKey) {
      return false;
    }

    try {
      const body = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', apiKey);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Custom Function 1: check_availability
   * Check doctor availability for a specific date and optionally time
   * Called by agent before suggesting appointment times
   */
  async checkAvailability(req: Request, res: Response) {
    try {
      // Log incoming request for debugging
      console.log('📞 check_availability called');
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      // Verify Retell signature (skip in development)
      if (process.env.NODE_ENV === 'production') {
        if (!this.verifyRetellSignature(req)) {
          return res.status(401).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      }

      // Retell sends parameters in req.body.args, not directly in req.body
      const args = req.body.args || req.body;
      const { doctor_id, specialization, date, time } = args;

      // Log what we received
      console.log('Extracted values:', { doctor_id, specialization, date, time });

      // Validate required fields - check for null, undefined, or empty string
      if (!date || date === null || date === 'null' || date === '') {
        console.log('❌ Validation error: Date is required');
        console.log('Received date value:', date, 'Type:', typeof date);
        return res.status(400).json({
          success: false,
          message: 'Date is required. Please provide a date in YYYY-MM-DD format.',
          available: false,
          error: 'missing_date',
          debug: {
            received_date: date,
            date_type: typeof date,
            full_body: req.body
          }
        });
      }

      // Parse and validate date
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        console.log('❌ Validation error: Invalid date format:', date);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format.',
          available: false,
          error: 'invalid_date_format',
          received_date: date
        });
      }

      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        console.log('⚠️ Date is in the past:', date);
        return res.status(200).json({
          success: true,
          available: false,
          message: 'Cannot book appointments in the past. Please choose a future date.',
          alternative_slots: []
        });
      }

      console.log('✅ Date validation passed:', date);

      let availableSlots: string[] = [];
      let doctorInfo: any = null;

      // Case 1: Specific doctor requested
      if (doctor_id) {
        console.log('🔍 Checking availability for specific doctor:', doctor_id);
        
        const doctor = await User.findById(doctor_id);
        if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
          console.log('❌ Doctor not found or unavailable:', doctor_id);
          return res.status(200).json({
            success: true,
            available: false,
            message: 'Doctor not found or unavailable. Please choose another doctor.',
            alternative_slots: []
          });
        }

        doctorInfo = {
          id: doctor._id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specialization
        };

        console.log('✅ Doctor found:', doctorInfo.name);

        // Get available slots for this doctor
        try {
          const slots = await appointmentService.getAvailableSlots(doctor_id, date);
          availableSlots = slots
            .filter(slot => slot.available)
            .map(slot => slot.time)
            .slice(0, 5); // Return max 5 slots
          
          console.log(`✅ Found ${availableSlots.length} available slots`);
        } catch (error: any) {
          console.error('❌ Error getting slots:', error.message);
          return res.status(200).json({
            success: true,
            available: false,
            message: 'Unable to check availability at this time. Please try again.',
            alternative_slots: []
          });
        }
      }
      // Case 2: Search by specialization
      else if (specialization) {
        console.log('🔍 Checking availability by specialization:', specialization);
        
        const doctorProfiles = await DoctorProfile.find({
          specialization: { $regex: specialization, $options: 'i' }
        }).populate('userId', 'firstName lastName isActive');

        const activeDoctors = doctorProfiles.filter(
          profile => (profile.userId as any).isActive
        );

        console.log(`✅ Found ${activeDoctors.length} doctors for ${specialization}`);

        if (activeDoctors.length === 0) {
          return res.status(200).json({
            success: true,
            available: false,
            message: `No doctors available for ${specialization}. Please try another specialization.`,
            alternative_slots: []
          });
        }

        // Get slots from first available doctor
        const firstDoctor = activeDoctors[0];
        const doctorUser = firstDoctor.userId as any;
        
        doctorInfo = {
          id: doctorUser._id,
          name: `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`,
          specialization: firstDoctor.specialization
        };

        console.log('✅ Using doctor:', doctorInfo.name);

        const slots = await appointmentService.getAvailableSlots(
          doctorUser._id.toString(),
          date
        );
        availableSlots = slots
          .filter(slot => slot.available)
          .map(slot => slot.time)
          .slice(0, 5);
        
        console.log(`✅ Found ${availableSlots.length} available slots`);
      }
      // Case 3: No specific doctor or specialization - get any available
      else {
        console.log('🔍 Checking availability for any doctor');
        
        const doctors = await User.find({
          role: 'doctor',
          isActive: true,
          profileCompleted: true
        }).limit(3);

        console.log(`✅ Found ${doctors.length} active doctors`);

        for (const doctor of doctors) {
          const slots = await appointmentService.getAvailableSlots(
            doctor._id.toString(),
            date
          );
          const available = slots.filter(slot => slot.available);
          
          if (available.length > 0) {
            doctorInfo = {
              id: doctor._id,
              name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              specialization: doctor.specialization
            };
            availableSlots = available.map(slot => slot.time).slice(0, 5);
            console.log(`✅ Found ${availableSlots.length} slots with ${doctorInfo.name}`);
            break;
          }
        }
      }

      // Check if specific time was requested
      if (time && availableSlots.includes(time)) {
        console.log(`✅ Requested time ${time} is available`);
        return res.status(200).json({
          success: true,
          available: true,
          message: `${time} is available with ${doctorInfo?.name || 'the doctor'}`,
          doctor: doctorInfo,
          requested_time: time,
          alternative_slots: availableSlots.filter(t => t !== time)
        });
      }

      // Return available slots
      if (availableSlots.length > 0) {
        console.log(`✅ Returning ${availableSlots.length} available slots`);
        return res.status(200).json({
          success: true,
          available: true,
          message: `Found ${availableSlots.length} available time slots`,
          doctor: doctorInfo,
          available_slots: availableSlots,
          date: date
        });
      }

      // No slots available
      console.log('⚠️ No available slots found');
      return res.status(200).json({
        success: true,
        available: false,
        message: 'No available slots on this date. Please try another date or doctor.',
        alternative_slots: [],
        suggestion: 'Please try another date or doctor'
      });

    } catch (error: any) {
      console.error('❌ Check availability error:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check availability. Please try again.',
        error: error.message,
        available: false
      });
    }
  }

  /**
   * Custom Function 2: book_appointment
   * Book an appointment after patient confirms all details
   * Called by agent only after explicit patient confirmation
   */
  async bookAppointment(req: Request, res: Response) {
    try {
      // Verify Retell signature (skip in development)
      if (process.env.NODE_ENV === 'production') {
        if (!this.verifyRetellSignature(req)) {
          return res.status(401).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      }

      // Retell sends parameters in req.body.args, not directly in req.body
      const args = req.body.args || req.body;
      const {
        patient_name,
        phone_number,
        doctor_id,
        date,
        time,
        reason
      } = args;
      
      // Extract call_id and metadata from request (Retell includes this)
      const callId = req.body.call_id || req.body.callId;
      const metadata = req.body.metadata || {};
      const patientId = metadata.patientId; // ✅ Get patientId from metadata
      
      console.log('📞 book_appointment called');
      console.log('   Call ID:', callId);
      console.log('   Patient ID from metadata:', patientId);
      console.log('   Patient Name:', patient_name);
      console.log('   Phone:', phone_number);

      // Validate required fields
      if (!patient_name || !phone_number || !doctor_id || !date || !time || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          required: ['patient_name', 'phone_number', 'doctor_id', 'date', 'time', 'reason']
        });
      }

      // Validate doctor exists
      const doctor = await User.findById(doctor_id);
      if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Doctor not found or unavailable',
          booking_status: 'failed'
        });
      }

      // Check if slot is still available
      const slots = await appointmentService.getAvailableSlots(doctor_id, date);
      const requestedSlot = slots.find(slot => slot.time === time);
      
      if (!requestedSlot || !requestedSlot.available) {
        return res.status(200).json({
          success: false,
          message: 'This time slot is no longer available',
          booking_status: 'failed',
          alternative_slots: slots
            .filter(slot => slot.available)
            .map(slot => slot.time)
            .slice(0, 3)
        });
      }

      // ✅ Get patient email if patientId exists
      let patientEmail;
      if (patientId) {
        const patient = await User.findById(patientId);
        if (patient && patient.email) {
          patientEmail = patient.email;
          console.log('   Patient Email:', patientEmail);
        }
      }

      // Create appointment
      const appointmentData = {
        doctorId: doctor_id,
        appointmentDate: date,
        appointmentTime: time,
        consultationType: 'in-person' as const,
        patientName: patient_name.trim(),
        patientPhone: phone_number.trim(),
        patientEmail: patientEmail, // ✅ Add patient email
        patientId: patientId, // ✅ Add patient ID
        reasonForVisit: reason.trim(),
        bookingSource: 'voice_agent' as const,
        voiceAgentBooking: true,
        status: 'confirmed' as const,
        voiceAgentData: {
          callId: callId,  // Save call ID so webhook can find this appointment
          timestamp: new Date().toISOString()
        }
      };

      const appointment = await appointmentService.createAppointment(appointmentData);

      // Generate confirmation number
      const confirmationNumber = `NOVA-${date.replace(/-/g, '')}-${appointment._id.toString().slice(-3).toUpperCase()}`;

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        booking_status: 'success',
        confirmation_number: confirmationNumber,
        appointment_details: {
          patient_name: appointment.patientName,
          doctor_name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          reason: appointment.reasonForVisit,
          phone: appointment.patientPhone
        }
      });

    } catch (error: any) {
      console.error('Book appointment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to book appointment',
        booking_status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Custom Function 3: get_available_doctors
   * Get list of available doctors with their specializations
   * Called when patient doesn't have a preference
   */
  async getAvailableDoctors(req: Request, res: Response) {
    try {
      // Verify Retell signature (skip in development)
      if (process.env.NODE_ENV === 'production') {
        if (!this.verifyRetellSignature(req)) {
          return res.status(401).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      }

      // Retell sends parameters in req.body.args, not directly in req.body
      const args = req.body.args || req.body;
      const { specialization, date } = args;

      let query: any = {
        role: 'doctor',
        isActive: true,
        profileCompleted: true
      };

      // Filter by specialization if provided
      if (specialization) {
        query.specialization = { $regex: specialization, $options: 'i' };
      }

      const doctors = await User.find(query).select('firstName lastName specialization');

      if (doctors.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No doctors available',
          doctors: []
        });
      }

      // Get doctor profiles with schedules
      const doctorProfiles = await DoctorProfile.find({
        userId: { $in: doctors.map(d => d._id) }
      });

      const availableDoctors = await Promise.all(
        doctors.map(async (doctor) => {
          const profile = doctorProfiles.find(
            p => p.userId.toString() === doctor._id.toString()
          );

          let nextAvailableSlot = null;

          // If date provided, check availability for that date
          if (date && profile) {
            const slots = await appointmentService.getAvailableSlots(
              doctor._id.toString(),
              date
            );
            const available = slots.filter(slot => slot.available);
            if (available.length > 0) {
              nextAvailableSlot = available[0].time;
            }
          }

          return {
            id: doctor._id,
            name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialization || 'General Practice',
            working_days: profile?.workingDays || [],
            consultation_type: profile?.consultationType || 'both',
            next_available_slot: nextAvailableSlot
          };
        })
      );

      res.status(200).json({
        success: true,
        message: `Found ${availableDoctors.length} available doctors`,
        doctors: availableDoctors,
        total: availableDoctors.length
      });

    } catch (error: any) {
      console.error('Get available doctors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available doctors',
        error: error.message,
        doctors: []
      });
    }
  }

  /**
   * Health check endpoint for Retell functions
   */
  async healthCheck(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        message: 'Retell custom functions API is healthy',
        timestamp: new Date().toISOString(),
        functions: {
          check_availability: 'POST /api/retell/check-availability',
          book_appointment: 'POST /api/retell/book-appointment',
          get_available_doctors: 'POST /api/retell/get-available-doctors'
        }
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Health check failed'
      });
    }
  }
}

export default new RetellFunctionsController();
