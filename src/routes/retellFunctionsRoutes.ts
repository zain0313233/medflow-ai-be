import { Router } from 'express';
import retellFunctionsController from '../controllers/retellFunctionsController';
import { retellAuth } from '../middlewares/apiKeyMiddleware';

const router = Router();

/**
 * Retell Custom Functions Routes
 * These endpoints are called by Retell AI during live voice conversations
 * All routes require API key authentication and signature verification
 */

// Health check - no auth needed
router.get('/health', retellFunctionsController.healthCheck.bind(retellFunctionsController));

// Custom Function 1: Check doctor availability - requires Retell auth
router.post(
  '/check-availability',
  retellAuth,
  retellFunctionsController.checkAvailability.bind(retellFunctionsController)
);

// Custom Function 2: Book appointment - requires Retell auth
router.post(
  '/book-appointment',
  retellAuth,
  retellFunctionsController.bookAppointment.bind(retellFunctionsController)
);

// Custom Function 3: Get available doctors - requires Retell auth
router.post(
  '/get-available-doctors',
  retellAuth,
  retellFunctionsController.getAvailableDoctors.bind(retellFunctionsController)
);

export default router;
