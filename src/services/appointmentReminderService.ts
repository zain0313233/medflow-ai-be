import Appointment from '../models/Appointment';
import emailService from './emailService';

/**
 * Appointment Reminder Service
 * Sends email reminders 24 hours before appointments
 */
class AppointmentReminderService {
  
  /**
   * Check and send reminders for appointments happening in 24 hours
   * This should be called by a cron job every hour
   */
  async sendUpcomingReminders(): Promise<void> {
    try {
      console.log('⏰ Checking for appointments needing reminders...');
      
      // Calculate time window: 23-25 hours from now
      // (gives 2-hour window to catch appointments even if cron runs slightly off)
      const now = new Date();
      const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      
      // Find confirmed appointments in the next 24 hours that haven't been reminded
      const appointments = await Appointment.find({
        status: 'confirmed',
        appointmentDate: {
          $gte: twentyThreeHoursFromNow,
          $lte: twentyFiveHoursFromNow
        },
        patientEmail: { $exists: true, $nin: [null, ''] },
        reminderSent: { $ne: true } // Only send if reminder not already sent
      });
      
      console.log(`📊 Found ${appointments.length} appointments needing reminders`);
      
      if (appointments.length === 0) {
        console.log('✅ No reminders to send at this time');
        return;
      }
      
      // Send reminders
      let successCount = 0;
      let failCount = 0;
      
      for (const appointment of appointments) {
        try {
          console.log(`📧 Sending reminder for appointment ${appointment._id}`);
          console.log(`   Patient: ${appointment.patientName}`);
          console.log(`   Email: ${appointment.patientEmail}`);
          console.log(`   Date: ${appointment.appointmentDate}`);
          console.log(`   Time: ${appointment.appointmentTime}`);
          
          // Generate confirmation number if not exists
          const confirmationNumber = appointment.confirmationNumber || 
            `NOVA-${appointment.appointmentDate.toISOString().split('T')[0].replace(/-/g, '')}-${appointment._id.toString().slice(-3).toUpperCase()}`;
          
          // Send reminder email
          const sent = await emailService.sendAppointmentReminder({
            patientName: appointment.patientName || 'Patient',
            patientEmail: appointment.patientEmail!,
            doctorName: appointment.doctorName || 'Doctor',
            appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
            appointmentTime: appointment.appointmentTime,
            reasonForVisit: appointment.reasonForVisit || 'Consultation',
            consultationType: appointment.consultationType,
            confirmationNumber: confirmationNumber,
            clinicAddress: 'Nova Health Clinic, Main Street',
            clinicPhone: '+1234567890'
          });
          
          if (sent) {
            // Mark reminder as sent
            appointment.reminderSent = true;
            appointment.reminderSentAt = new Date();
            await appointment.save();
            
            successCount++;
            console.log(`✅ Reminder sent successfully for ${appointment._id}`);
          } else {
            failCount++;
            console.log(`❌ Failed to send reminder for ${appointment._id}`);
          }
          
        } catch (error: any) {
          failCount++;
          console.error(`❌ Error sending reminder for ${appointment._id}:`, error.message);
        }
      }
      
      console.log(`\n📊 Reminder Summary:`);
      console.log(`   ✅ Sent: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📧 Total: ${appointments.length}\n`);
      
    } catch (error: any) {
      console.error('❌ Error in sendUpcomingReminders:', error.message);
      throw error;
    }
  }
  
  /**
   * Manual trigger for testing
   * Send reminder for a specific appointment
   */
  async sendReminderForAppointment(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        console.log('❌ Appointment not found');
        return false;
      }
      
      if (!appointment.patientEmail) {
        console.log('❌ No patient email found');
        return false;
      }
      
      console.log(`📧 Sending test reminder for appointment ${appointmentId}`);
      
      const confirmationNumber = appointment.confirmationNumber || 
        `NOVA-${appointment.appointmentDate.toISOString().split('T')[0].replace(/-/g, '')}-${appointment._id.toString().slice(-3).toUpperCase()}`;
      
      const sent = await emailService.sendAppointmentReminder({
        patientName: appointment.patientName || 'Patient',
        patientEmail: appointment.patientEmail!,
        doctorName: appointment.doctorName || 'Doctor',
        appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
        appointmentTime: appointment.appointmentTime,
        reasonForVisit: appointment.reasonForVisit || 'Consultation',
        consultationType: appointment.consultationType,
        confirmationNumber: confirmationNumber,
        clinicAddress: 'Nova Health Clinic, Main Street',
        clinicPhone: '+1234567890'
      });
      
      if (sent) {
        appointment.reminderSent = true;
        appointment.reminderSentAt = new Date();
        await appointment.save();
        console.log('✅ Test reminder sent successfully');
      }
      
      return sent;
      
    } catch (error: any) {
      console.error('❌ Error sending test reminder:', error.message);
      return false;
    }
  }
  
  /**
   * Get statistics about reminders
   */
  async getReminderStats(): Promise<any> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const upcomingAppointments = await Appointment.countDocuments({
        status: 'confirmed',
        appointmentDate: {
          $gte: now,
          $lte: tomorrow
        }
      });
      
      const remindersSent = await Appointment.countDocuments({
        status: 'confirmed',
        reminderSent: true,
        appointmentDate: {
          $gte: now,
          $lte: tomorrow
        }
      });
      
      const remindersPending = upcomingAppointments - remindersSent;
      
      return {
        upcomingAppointments,
        remindersSent,
        remindersPending,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('❌ Error getting reminder stats:', error.message);
      throw error;
    }
  }
}

export default new AppointmentReminderService();
