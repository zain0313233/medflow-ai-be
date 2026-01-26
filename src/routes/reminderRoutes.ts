import { Router, Request, Response } from 'express';
import appointmentReminderService from '../services/appointmentReminderService';
import cronJobService from '../services/cronJobService';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/reminders/stats
 * Get reminder statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await appointmentReminderService.getReminderStats();
    
    res.status(200).json({
      success: true,
      message: 'Reminder statistics retrieved',
      data: stats
    });
  } catch (error: any) {
    console.error('Get reminder stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reminder statistics'
    });
  }
});

/**
 * POST /api/reminders/trigger
 * Manually trigger reminder job (for testing)
 */
router.post('/trigger', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🔧 Manual reminder trigger requested');
    
    await cronJobService.triggerReminderJob();
    
    res.status(200).json({
      success: true,
      message: 'Reminder job triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Trigger reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger reminder job'
    });
  }
});

/**
 * POST /api/reminders/test/:appointmentId
 * Send test reminder for specific appointment
 */
router.post('/test/:appointmentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    
    console.log(`🔧 Test reminder requested for appointment: ${appointmentId}`);
    
    const sent = await appointmentReminderService.sendReminderForAppointment(appointmentId);
    
    if (sent) {
      res.status(200).json({
        success: true,
        message: 'Test reminder sent successfully',
        appointmentId: appointmentId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test reminder'
      });
    }
  } catch (error: any) {
    console.error('Test reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test reminder'
    });
  }
});

/**
 * GET /api/reminders/cron-status
 * Get cron job status
 */
router.get('/cron-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = cronJobService.getStatus();
    
    res.status(200).json({
      success: true,
      message: 'Cron job status retrieved',
      data: status
    });
  } catch (error: any) {
    console.error('Get cron status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cron status'
    });
  }
});

export default router;
