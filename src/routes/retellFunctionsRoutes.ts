import { Router } from 'express';
import retellFunctionsController from '../controllers/retellFunctionsController';

const router = Router();

/**
 * Retell Custom Functions Routes
 * These endpoints are called by Retell AI during live voice conversations
 * All routes are public (no auth middleware) but verify Retell signature
 */

// Health check
router.get('/health', retellFunctionsController.healthCheck.bind(retellFunctionsController));

// Custom Function 1: Check doctor availability
router.post(
  '/check-availability',
  retellFunctionsController.checkAvailability.bind(retellFunctionsController)
);

// Custom Function 2: Book appointment
router.post(
  '/book-appointment',
  retellFunctionsController.bookAppointment.bind(retellFunctionsController)
);

// Custom Function 3: Get available doctors
router.post(
  '/get-available-doctors',
  retellFunctionsController.getAvailableDoctors.bind(retellFunctionsController)
);

export default router;
