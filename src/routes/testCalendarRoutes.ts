import express from 'express';
import testCalendarController from '../controllers/testCalendarController';

const router = express.Router();

// Test endpoint to send calendar invite
// POST /api/test/send-calendar-invite
// Body: { patientId: "696d1f59e52a37628d05bdf1" }
router.post('/send-calendar-invite', testCalendarController.sendCalendarInvite.bind(testCalendarController));

export default router;
