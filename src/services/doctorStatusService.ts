import DoctorStatus from '../models/DoctorStatus';
import Appointment from '../models/Appointment';
import emailService from './emailService';
import sseService from './sseService';

/**
 * Doctor Status Service
 * Manages doctor delays and notifies affected patients
 */
class DoctorStatusService {
  
  /**
   * Mark doctor as running late
   * Affects all remaining appointments for today
   */
  async markRunningLate(
    doctorId: string,
    delayMinutes: number,
    reason: string | undefined,
    updatedBy: string
  ): Promise<any> {
    try {
      console.log(`⏰ Marking doctor ${doctorId} as running ${delayMinutes} minutes late`);
      
      // Get today's date (start and end)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get current time
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`📅 Finding appointments for today after ${currentTime}`);
      
      // Find all remaining appointments for today
      const affectedAppointments = await Appointment.find({
        doctorId: doctorId,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow
        },
        appointmentTime: { $gte: currentTime },
        status: { $in: ['pending', 'confirmed'] }
      }).sort({ appointmentTime: 1 });
      
      console.log(`📊 Found ${affectedAppointments.length} appointments to update`);
      
      if (affectedAppointments.length === 0) {
        return {
          success: false,
          message: 'No remaining appointments found for today',
          affectedCount: 0
        };
      }
      
      // Update each appointment with new estimated time
      const appointmentIds: string[] = [];
      let emailCount = 0;
      
      for (const appointment of affectedAppointments) {
        // Calculate new estimated time
        const [hours, minutes] = appointment.appointmentTime.split(':');
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + delayMinutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const estimatedTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        
        // Update appointment
        appointment.estimatedTime = estimatedTime;
        appointment.delayMinutes = delayMinutes;
        appointment.delayNotified = true;
        appointment.delayNotifiedAt = new Date();
        await appointment.save();
        
        appointmentIds.push(appointment._id.toString());
        
        console.log(`✅ Updated appointment ${appointment._id}: ${appointment.appointmentTime} → ${estimatedTime}`);
        
        // Send SSE notification if patient is connected
        if (appointment.patientId) {
          sseService.sendDelayNotification(appointment.patientId.toString(), {
            appointmentId: appointment._id.toString(),
            doctorName: appointment.doctorName || 'Doctor',
            originalTime: appointment.appointmentTime,
            estimatedTime: estimatedTime,
            delayMinutes: delayMinutes,
            reason: reason
          });
        }
        
        // Send email notification if patient has email
        if (appointment.patientEmail) {
          try {
            await emailService.sendDelayNotification({
              patientName: appointment.patientName || 'Patient',
              patientEmail: appointment.patientEmail,
              doctorName: appointment.doctorName || 'Doctor',
              appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
              appointmentTime: appointment.appointmentTime,
              reasonForVisit: appointment.reasonForVisit || 'Consultation',
              consultationType: appointment.consultationType,
              confirmationNumber: appointment.confirmationNumber || '',
              clinicAddress: 'Nova Health Clinic, Main Street',
              clinicPhone: '+1234567890',
              originalTime: appointment.appointmentTime,
              estimatedTime: estimatedTime,
              delayMinutes: delayMinutes,
              reason: reason
            });
            emailCount++;
            console.log(`📧 Email sent to ${appointment.patientEmail}`);
          } catch (emailError: any) {
            console.error(`❌ Failed to send email to ${appointment.patientEmail}:`, emailError.message);
          }
        }
      }
      
      // Create or update doctor status record
      const doctorStatus = await DoctorStatus.findOneAndUpdate(
        {
          doctorId: doctorId,
          date: today
        },
        {
          status: 'running-late',
          delayMinutes: delayMinutes,
          reason: reason,
          updatedBy: updatedBy,
          affectedAppointments: appointmentIds,
          notificationsSent: {
            inApp: affectedAppointments.length,
            email: emailCount
          },
          clearedAt: undefined,
          clearedBy: undefined
        },
        {
          upsert: true,
          new: true
        }
      );
      
      console.log(`✅ Doctor status updated: ${doctorStatus._id}`);
      console.log(`📊 Notifications sent: ${affectedAppointments.length} in-app, ${emailCount} email`);
      
      return {
        success: true,
        message: `${affectedAppointments.length} appointments updated`,
        affectedCount: affectedAppointments.length,
        notifications: {
          inApp: affectedAppointments.length,
          email: emailCount
        },
        statusId: doctorStatus._id
      };
      
    } catch (error: any) {
      console.error('❌ Error marking doctor as running late:', error.message);
      throw error;
    }
  }
  
  /**
   * Clear delay - doctor back on schedule
   */
  async clearDelay(doctorId: string, clearedBy: string): Promise<any> {
    try {
      console.log(`✅ Clearing delay for doctor ${doctorId}`);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find today's status
      const doctorStatus = await DoctorStatus.findOne({
        doctorId: doctorId,
        date: today,
        status: 'running-late'
      });
      
      if (!doctorStatus) {
        return {
          success: false,
          message: 'No active delay found for this doctor today'
        };
      }
      
      // Update status to on-time
      doctorStatus.status = 'on-time';
      doctorStatus.delayMinutes = 0;
      doctorStatus.clearedAt = new Date();
      doctorStatus.clearedBy = clearedBy as any;
      await doctorStatus.save();
      
      // Reset delay on remaining appointments
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const result = await Appointment.updateMany(
        {
          doctorId: doctorId,
          appointmentDate: {
            $gte: today,
            $lt: tomorrow
          },
          appointmentTime: { $gte: currentTime },
          status: { $in: ['pending', 'confirmed'] }
        },
        {
          $set: {
            estimatedTime: undefined,
            delayMinutes: 0
          }
        }
      );
      
      console.log(`✅ Delay cleared, ${result.modifiedCount} appointments reset`);
      
      return {
        success: true,
        message: 'Delay cleared successfully',
        appointmentsReset: result.modifiedCount
      };
      
    } catch (error: any) {
      console.error('❌ Error clearing delay:', error.message);
      throw error;
    }
  }
  
  /**
   * Get current doctor status for today
   */
  async getTodayStatus(doctorId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const status = await DoctorStatus.findOne({
        doctorId: doctorId,
        date: today
      }).sort({ updatedAt: -1 });
      
      if (!status || status.status === 'on-time') {
        return {
          success: true,
          data: {
            status: 'on-time',
            delayMinutes: 0,
            reason: null,
            updatedAt: null
          }
        };
      }
      
      return {
        success: true,
        data: {
          status: status.status,
          delayMinutes: status.delayMinutes,
          reason: status.reason,
          updatedAt: status.updatedAt,
          affectedAppointments: status.affectedAppointments.length,
          notificationsSent: status.notificationsSent
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error getting doctor status:', error.message);
      throw error;
    }
  }
  
  /**
   * Get appointment status (for patient)
   */
  async getAppointmentStatus(appointmentId: string): Promise<any> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }
      
      return {
        success: true,
        data: {
          originalTime: appointment.appointmentTime,
          estimatedTime: appointment.estimatedTime || appointment.appointmentTime,
          delayMinutes: appointment.delayMinutes || 0,
          hasDelay: (appointment.delayMinutes || 0) > 0,
          status: appointment.status
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error getting appointment status:', error.message);
      throw error;
    }
  }
}

export default new DoctorStatusService();
