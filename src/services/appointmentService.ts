import Appointment, { IAppointment } from '../models/Appointment';
import DoctorProfile from '../models/DoctorProfile';
import User from '../models/User';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export interface CreateAppointmentData {
  patientId?: string;
  doctorId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  consultationType: 'online' | 'in-person';
  reasonForVisit?: string;
  symptoms?: string;
  patientPhone?: string;
  patientName?: string;
  patientEmail?: string;
  voiceAgentBooking?: boolean;
  voiceAgentData?: {
    callId?: string;
    transcript?: string;
    confidence?: number;
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
      // Validate doctor exists and is active
      const doctor = await User.findById(appointmentData.doctorId);
      if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
        throw new NotFoundError('Doctor not found or inactive');
      }

      // Get doctor profile for availability check
      const doctorProfile = await DoctorProfile.findOne({ userId: appointmentData.doctorId });
      if (!doctorProfile) {
        throw new NotFoundError('Doctor profile not found');
      }

      // Validate appointment date and time
      const appointmentDate = new Date(appointmentData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new ValidationError('Cannot book appointment in the past');
      }

      // Check if doctor is available on this day
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (!doctorProfile.workingDays.includes(dayOfWeek)) {
        throw new ValidationError(`Doctor is not available on ${dayOfWeek}`);
      }

      // Check if time is within working hours
      const isTimeAvailable = await this.isTimeSlotAvailable(
        appointmentData.doctorId,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        doctorProfile
      );

      if (!isTimeAvailable.available) {
        throw new ValidationError(`Time slot not available: ${isTimeAvailable.reason}`);
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
        duration: doctorProfile.appointmentDuration || 30,
        status: 'pending'
      });

      await appointment.save();

      // Populate doctor and patient info
      await appointment.populate([
        { path: 'doctorId', select: 'firstName lastName email specialization' },
        { path: 'patientId', select: 'firstName lastName email phone' }
      ]);

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
      const endTimeInMinutes = endHours * 60 + endMinutes;

      if (timeInMinutes < startTimeInMinutes || timeInMinutes >= endTimeInMinutes) {
        return { 
          available: false, 
          reason: `Outside working hours (${doctorProfile.workingHours.start} - ${doctorProfile.workingHours.end})` 
        };
      }

      // Check break times
      for (const breakTime of doctorProfile.breakTimes || []) {
        const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
        const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);
        
        const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
        const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;

        if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
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
        return { available: false, reason: 'Time slot already booked' };
      }

      return { available: true };
    } catch (error: any) {
      return { available: false, reason: 'Error checking availability' };
    }
  }

  // Get available slots for a doctor on a specific date
  async getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlot[]> {
    try {
      const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
      if (!doctorProfile) {
        throw new NotFoundError('Doctor profile not found');
      }

      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'short' });

      if (!doctorProfile.workingDays.includes(dayOfWeek)) {
        return [];
      }

      const slots: AvailableSlot[] = [];
      const duration = doctorProfile.appointmentDuration || 30;
      
      const [startHours, startMinutes] = doctorProfile.workingHours.start.split(':').map(Number);
      const [endHours, endMinutes] = doctorProfile.workingHours.end.split(':').map(Number);
      
      let currentTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;

      while (currentTime < endTime) {
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const availability = await this.isTimeSlotAvailable(doctorId, date, timeString, doctorProfile);
        
        slots.push({
          time: timeString,
          available: availability.available,
          reason: availability.reason
        });

        currentTime += duration;
      }

      return slots;
    } catch (error: any) {
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
}

export default new AppointmentService();