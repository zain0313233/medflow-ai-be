import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import doctorStatusService from '../services/doctorStatusService';
import sseService from '../services/sseService';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * POST /api/doctor-status/running-late
 * Mark doctor as running late
 * Access: Doctor, Admin
 */
router.post('/running-late', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { doctorId, delayMinutes, reason } = req.body;
    const updatedBy = (req as any).user.userId;
    
    // Validate input
    if (!doctorId || !delayMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and delay minutes are required'
      });
    }
    
    if (delayMinutes < 1 || delayMinutes > 240) {
      return res.status(400).json({
        success: false,
        message: 'Delay must be between 1 and 240 minutes'
      });
    }
    
    // Check authorization (only doctor themselves or admin)
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;
    
    if (userRole !== 'admin' && userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own status'
      });
    }
    
    console.log(`⏰ Doctor ${doctorId} marking as ${delayMinutes} min late (by ${updatedBy})`);
    
    const result = await doctorStatusService.markRunningLate(
      doctorId,
      delayMinutes,
      reason,
      updatedBy
    );
    
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Mark running late error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark doctor as running late'
    });
  }
});

/**
 * POST /api/doctor-status/clear-delay
 * Clear delay - doctor back on schedule
 * Access: Doctor, Admin
 */
router.post('/clear-delay', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.body;
    const clearedBy = (req as any).user.userId;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }
    
    // Check authorization
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;
    
    if (userRole !== 'admin' && userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own status'
      });
    }
    
    console.log(`✅ Clearing delay for doctor ${doctorId} (by ${clearedBy})`);
    
    const result = await doctorStatusService.clearDelay(doctorId, clearedBy);
    
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Clear delay error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear delay'
    });
  }
});

/**
 * GET /api/doctor-status/:doctorId/today
 * Get current doctor status for today
 * Access: Public (patients need to see this)
 */
router.get('/:doctorId/today', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    const result = await doctorStatusService.getTodayStatus(doctorId);
    
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Get doctor status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor status'
    });
  }
});

/**
 * GET /api/doctor-status/appointment/:appointmentId
 * Get appointment status (for patient)
 * Access: Authenticated
 */
router.get('/appointment/:appointmentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    
    const result = await doctorStatusService.getAppointmentStatus(appointmentId);
    
    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Get appointment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get appointment status'
    });
  }
});

/**
 * GET /api/doctor-status/sse/connect
 * SSE endpoint for real-time notifications
 * Access: Authenticated (token via query param for EventSource compatibility)
 */
router.get('/sse/connect', async (req: Request, res: Response) => {
  try {
    // EventSource can't send custom headers, so accept token from query param
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }
    
    // Verify token manually
    let decoded: { userId: string; email: string; role: string };
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; email: string; role: string };
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    const userId = decoded.userId;
    
    console.log(`📡 SSE connection request from user: ${userId}`);
    
    // Add client to SSE service
    sseService.addClient(userId, res);
    
    // Connection will stay open until client disconnects
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to establish SSE connection';
    console.error('SSE connection error:', error);
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * GET /api/doctor-status/sse/stats
 * Get SSE connection statistics
 * Access: Admin
 */
router.get('/sse/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const stats = sseService.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('Get SSE stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get SSE stats'
    });
  }
});

export default router;
