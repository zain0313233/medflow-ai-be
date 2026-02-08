import appointmentReminderService from './appointmentReminderService';

/**
 * Cron Job Service
 * Manages scheduled tasks like appointment reminders
 * 
 * Uses simple setInterval instead of node-cron (no extra dependency needed)
 */
class CronJobService {
  private reminderInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start all cron jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Cron jobs already running');
      return;
    }

    console.log('🚀 Starting cron jobs...');
    
    // Run appointment reminder check every hour
    this.startAppointmentReminderJob();
    
    this.isRunning = true;
    console.log('✅ Cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Cron jobs not running');
      return;
    }

    console.log('🛑 Stopping cron jobs...');
    
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    
    this.isRunning = false;
    console.log('✅ Cron jobs stopped');
  }

  /**
   * Appointment reminder job - runs every hour
   */
  private startAppointmentReminderJob(): void {
    console.log('📅 Starting appointment reminder job (runs every hour)');
    
    // Run immediately on startup
    this.runReminderJob();
    
    // Then run every hour (3600000 ms = 1 hour)
    this.reminderInterval = setInterval(() => {
      this.runReminderJob();
    }, 3600000); // 1 hour
    
    console.log('✅ Appointment reminder job scheduled');
  }

  /**
   * Execute the reminder job
   */
  private async runReminderJob(): Promise<void> {
    try {
      const now = new Date();
      console.log(`\n⏰ Running appointment reminder job at ${now.toISOString()}`);
      
      await appointmentReminderService.sendUpcomingReminders();
      
      console.log(`✅ Reminder job completed at ${new Date().toISOString()}\n`);
    } catch (error: any) {
      console.error('❌ Error in reminder job:', error.message);
    }
  }

  /**
   * Manually trigger reminder job (for testing)
   */
  async triggerReminderJob(): Promise<void> {
    console.log('🔧 Manually triggering reminder job...');
    await this.runReminderJob();
  }

  /**
   * Get cron job status
   */
  getStatus(): { isRunning: boolean; jobs: any[] } {
    return {
      isRunning: this.isRunning,
      jobs: [
        {
          name: 'Appointment Reminders',
          schedule: 'Every hour',
          active: this.reminderInterval !== null,
          description: 'Sends email reminders 24 hours before appointments'
        }
      ]
    };
  }
}

export default new CronJobService();
