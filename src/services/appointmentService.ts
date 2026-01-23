import Appointment, { IAppointment } from '../models/Appointment';
import DoctorProfile from '../models/DoctorProfile';
import User from '../models/User';
import { NotFoundError, ValidationError } from '../utils/errors';
import googleCalendarService from './googleCalendarService';

export interface CreateAppointmentData {
  patientId?: string;
  doctorId: string;
  doctorName?: string; // For voice bookings (from knowledge base)
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  consultationType: 'online' | 'in-person';
  reasonForVisit?: string;
  symptoms?: string;
  duration?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  patientPhone?: string;
  patientName?: string;
  patientEmail?: string;
  bookingSource?: 'web' | 'voice_agent' | 'phone' | 'admin';
  voiceCallId?: any;
  voiceAgentBooking?: boolean;
  voiceAgentData?: {
    callId?: string;
    transcript?: string;
    confidence?: number;
    agentId?: string;
    userSentiment?: string;
    callSuccessful?: boolean;
  };
}

export interface AvailableSlot {
  time: string;
  available: boolean;
  reason?: string;
}

class AppointmentService {
  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentData): Promise<IAppointment> {
    try {
      let doctorProfile = null;
      
      // ✅ Phase 1: Skip doctor validation for voice agent bookings (doctors are in knowledge base)
      // Phase 2: Will validate against real doctor DB
      if (!appointmentData.voiceAgentBooking) {
        // Validate doctor exists and is active (only for non-voice bookings)
        const doctor = await User.findById(appointmentData.doctorId);
        if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
          throw new NotFoundError('Doctor not found or inactive');
        }

        // Get doctor profile for availability check
        doctorProfile = await DoctorProfile.findOne({ userId: appointmentData.doctorId });
        if (!doctorProfile) {
          throw new NotFoundError('Doctor profile not found');
        }

        // Check if doctor is available on this day
        const appointmentDate = new Date(appointmentData.appointmentDate);
        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (!doctorProfile.workingDays.includes(dayOfWeek)) {
          throw new ValidationError(`Doctor is not available on ${dayOfWeek}`);
        }
      } else {
        console.log('ℹ️ Voice agent booking - skipping doctor validation (Phase 1)');
      }

      // Validate appointment date and time
      const appointmentDate = new Date(appointmentData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new ValidationError('Cannot book appointment in the past');
      }

      // Check if time is within working hours (only for non-voice bookings)
      if (!appointmentData.voiceAgentBooking && doctorProfile) {
        const isTimeAvailable = await this.isTimeSlotAvailable(
          appointmentData.doctorId,
          appointmentData.appointmentDate,
          appointmentData.appointmentTime,
          doctorProfile
        );

        if (!isTimeAvailable.available) {
          throw new ValidationError(`Time slot not available: ${isTimeAvailable.reason}`);
        }
      }

      // If patientId is provided, validate patient exists
      if (appointmentData.patientId) {
        const patient = await User.findById(appointmentData.patientId);
        if (!patient || !patient.isActive) {
          throw new NotFoundError('Patient not found or inactive');
        }
      }

      // Create appointment
      const appointment = new Appointment({
        ...appointmentData,
        appointmentDate,
        duration: appointmentData.duration || doctorProfile?.appointmentDuration || 30,
        status: appointmentData.status || 'pending'
      });

      await appointment.save();

      // Populate doctor and patient info (only if not voice booking)
      if (!appointmentData.voiceAgentBooking) {
        await appointment.populate([
          { path: 'doctorId', select: 'firstName lastName email specialization' },
          { path: 'patientId', select: 'firstName lastName email phone' }
        ]);
        
        // 🆕 Create Google Calendar event for non-voice bookings (they have complete data)
        await this.createCalendarEventForAppointment(appointment);
      }
      // Note: Voice agent bookings will get calendar event after webhook updates with patientId

      return appointment;
    } catch (error: any) {
      throw error;
    }
  }

  // Check if time slot is available
  async isTimeSlotAvailable(
    doctorId: string,
    date: string,
    time: string,
    doctorProfile?: any
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      if (!doctorProfile) {
        doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
        if (!doctorProfile) {
          return { available: false, reason: 'Doctor profile not found' };
        }
      }

      // Check working hours
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      const [startHours, startMinutes] = doctorProfile.workingHours.start.split(':').map(Number);
      const [endHours, endMinutes] = doctorProfile.workingHours.end.split(':').map(Number);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      let endTimeInMinutes = endHours * 60 + endMinutes;

      // Handle overnight shifts
      const isOvernightShift = endTimeInMinutes <= startTimeInMinutes;
      if (isOvernightShift) {
        // For overnight shifts, check if time is either:
        // 1. After start time (same day), OR
        // 2. Before end time (next day, represented as time < end)
        const isInShift = timeInMinutes >= startTimeInMinutes || timeInMinutes < endTimeInMinutes;
        if (!isInShift) {
          console.log(`  ❌ ${time} - Outside overnight shift hours`);
          return { 
            available: false, 
            reason: `Outside working hours (${doctorProfile.workingHours.start} - ${doctorProfile.workingHours.end})` 
          };
        }
      } else {
        // Normal shift (same day)
        if (timeInMinutes < startTimeInMinutes || timeInMinutes >= endTimeInMinutes) {
          console.log(`  ❌ ${time} - Outside working hours`);
          return { 
            available: false, 
            reason: `Outside working hours (${doctorProfile.workingHours.start} - ${doctorProfile.workingHours.end})` 
          };
        }
      }

      // Check break times
      for (const breakTime of doctorProfile.breakTimes || []) {
        const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
        const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);
        
        const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
        const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;

        // Only check break times that are within the working hours
        // Skip invalid break times (like 00:00 - 13:00 for a 09:00 - 15:00 shift)
        const isBreakInWorkingHours = isOvernightShift 
          ? (breakStartInMinutes >= startTimeInMinutes || breakStartInMinutes < endTimeInMinutes)
          : (breakStartInMinutes >= startTimeInMinutes && breakStartInMinutes < endTimeInMinutes);

        if (isBreakInWorkingHours && timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
          console.log(`  ❌ ${time} - During break time (${breakTime.start} - ${breakTime.end})`);
          return { 
            available: false, 
            reason: `During break time (${breakTime.start} - ${breakTime.end})` 
          };
        }
      }

      // Check for existing appointments
      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate: new Date(date),
        appointmentTime: time,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingAppointment) {
        console.log(`  ❌ ${time} - Already booked`);
        return { available: false, reason: 'Time slot already booked' };
      }

      console.log(`  ✅ ${time} - Available`);
      return { available: true };
    } catch (error: any) {
      console.error(`  ❌ ${time} - Error:`, error.message);
      return { available: false, reason: 'Error checking availability' };
    }
  }

  // Get available slots for a doctor on a specific date
  async getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlot[]> {
    try {
      console.log(`\n🔍 getAvailableSlots called for doctor ${doctorId} on ${date}`);
      
      const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
      if (!doctorProfile) {
        throw new NotFoundError('Doctor profile not found');
      }

      console.log(`📋 Doctor profile found:`, {
        workingHours: doctorProfile.workingHours,
        workingDays: doctorProfile.workingDays,
        breakTimes: doctorProfile.breakTimes,
        appointmentDuration: doctorProfile.appointmentDuration
      });

      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log(`📅 Day of week: ${dayOfWeek}`);
      console.log(`📅 Working days: ${doctorProfile.workingDays.join(', ')}`);

      if (!doctorProfile.workingDays.includes(dayOfWeek)) {
        console.log(`❌ Doctor not working on ${dayOfWeek}`);
        return [];
      }

      const slots: AvailableSlot[] = [];
      const duration = doctorProfile.appointmentDuration || 30;
      
      const [startHours, startMinutes] = doctorProfile.workingHours.start.split(':').map(Number);
      const [endHours, endMinutes] = doctorProfile.workingHours.end.split(':').map(Number);
      
      let currentTime = startHours * 60 + startMinutes;
      let endTime = endHours * 60 + endMinutes;

      console.log(`⏰ Start time: ${startHours}:${startMinutes} (${currentTime} minutes)`);
      console.log(`⏰ End time: ${endHours}:${endMinutes} (${endTime} minutes)`);

      // Handle overnight shifts (e.g., 15:00 to 01:00)
      // If end time is less than start time, it means shift goes to next day
      const isOvernightShift = endTime <= currentTime;
      if (isOvernightShift) {
        console.log(`🌙 Overnight shift detected`);
        endTime += 24 * 60; // Add 24 hours to end time
        console.log(`⏰ Adjusted end time: ${endTime} minutes`);
      }

      console.log(`🔄 Generating slots from ${currentTime} to ${endTime} (${duration} min intervals)`);

      let slotCount = 0;
      while (currentTime < endTime) {
        // Convert back to 24-hour format for overnight shifts
        let hours = Math.floor(currentTime / 60) % 24;
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const availability = await this.isTimeSlotAvailable(doctorId, date, timeString, doctorProfile);
        
        slots.push({
          time: timeString,
          available: availability.available,
          reason: availability.reason
        });

        if (availability.available) {
          slotCount++;
        }

        currentTime += duration;
      }

      console.log(`✅ Generated ${slots.length} total slots, ${slotCount} available`);
      return slots;
    } catch (error: any) {
      console.error(`❌ Error in getAvailableSlots:`, error);
      throw error;
    }
  }

  // Get appointments by doctor
  async getAppointmentsByDoctor(
    doctorId: string,
    date?: string,
    status?: string
  ): Promise<IAppointment[]> {
    try {
      const query: any = { doctorId };
      
      if (date) {
        query.appointmentDate = new Date(date);
      }
      
      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName email specialization')
        .sort({ appointmentDate: 1, appointmentTime: 1 });

      return appointments;
    } catch (error: any) {
      throw error;
    }
  }

  // Get appointments by patient
  async getAppointmentsByPatient(
    patientId: string,
    status?: string
  ): Promise<IAppointment[]> {
    try {
      const query: any = { patientId };
      
      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName email specialization')
        .sort({ appointmentDate: 1, appointmentTime: 1 });

      return appointments;
    } catch (error: any) {
      throw error;
    }
  }

  // Update appointment status
  async updateAppointmentStatus(
    appointmentId: string,
    status: string,
    notes?: string
  ): Promise<IAppointment> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      appointment.status = status as any;
      if (notes) {
        appointment.notes = notes;
      }

      await appointment.save();
      
      await appointment.populate([
        { path: 'doctorId', select: 'firstName lastName email specialization' },
        { path: 'patientId', select: 'firstName lastName email phone' }
      ]);

      return appointment;
    } catch (error: any) {
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId: string): Promise<IAppointment> {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName email specialization');

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      return appointment;
    } catch (error: any) {
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: string, reason?: string): Promise<IAppointment> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        throw new ValidationError('Cannot cancel completed or already cancelled appointment');
      }

      appointment.status = 'cancelled';
      if (reason) {
        appointment.notes = `Cancelled: ${reason}`;
      }

      await appointment.save();
      
      await appointment.populate([
        { path: 'doctorId', select: 'firstName lastName email specialization' },
        { path: 'patientId', select: 'firstName lastName email phone' }
      ]);

      return appointment;
    } catch (error: any) {
      throw error;
    }
  }

  // 🆕 Create Google Calendar event for appointment
  private async createCalendarEventForAppointment(appointment: IAppointment): Promise<void> {
    try {
      // Get patient email
      let patientEmail = appointment.patientEmail;
      
      // If patientId exists, get email from patient profile
      if (appointment.patientId && !patientEmail) {
        const patient = await User.findById(appointment.patientId);
        if (patient && patient.email) {
          patientEmail = patient.email;
        }
      }

      // Skip if no patient email
      if (!patientEmail) {
        console.log('⚠️ No patient email found, skipping calendar event creation');
        return;
      }

      // Get doctor profile
      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (!doctorProfile) {
        console.log('⚠️ Doctor profile not found, skipping calendar event');
        return;
      }

      // Get doctor email
      const doctor = await User.findById(appointment.doctorId);
      if (!doctor || !doctor.email) {
        console.log('⚠️ Doctor email not found, skipping calendar event');
        return;
      }

      // Create calendar event
      const result = await googleCalendarService.createAppointmentEvent(doctorProfile, {
        patientName: appointment.patientName || 'Patient',
        patientEmail,
        doctorName: appointment.doctorName || doctor.firstName + ' ' + doctor.lastName,
        doctorEmail: doctor.email,
        appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
        appointmentTime: appointment.appointmentTime,
        duration: appointment.duration || 30,
        reasonForVisit: appointment.reasonForVisit || 'General consultation',
        consultationType: appointment.consultationType,
      });

      if (result.success) {
        console.log('✅ Calendar event created successfully');
        console.log('📅 Google Meet link:', result.meetLink);
        
        // Optionally save the meet link and event ID to appointment
        appointment.notes = appointment.notes 
          ? `${appointment.notes}\n\nGoogle Meet: ${result.meetLink}`
          : `Google Meet: ${result.meetLink}`;
        await appointment.save();
      } else {
        console.log('⚠️ Failed to create calendar event:', result.error);
      }
    } catch (error: any) {
      console.error('❌ Error creating calendar event:', error.message);
      // Don't throw error - calendar creation is optional
    }
  }
}

export default new AppointmentService();