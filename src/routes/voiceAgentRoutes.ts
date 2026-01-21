import { Router } from 'express';
import voiceAgentController from '../controllers/voiceAgentController';
import retellFunctionsController from '../controllers/retellFunctionsController';

const router = Router();

// Health check
router.get('/health', voiceAgentController.healthCheck.bind(voiceAgentController));

// Get all available doctors
router.get('/doctors', voiceAgentController.getDoctors.bind(voiceAgentController));

// Get doctors by specialization
router.get('/doctors/specialization/:specialization', voiceAgentController.getDoctorsBySpecialization.bind(voiceAgentController));

// Check availability for multiple doctors
router.post('/availability', voiceAgentController.checkAvailability.bind(voiceAgentController));

// Book appointment
router.post('/book', voiceAgentController.bookAppointment.bind(voiceAgentController));

// Get appointment by confirmation number
router.get('/appointment/:confirmationNumber', voiceAgentController.getAppointmentByConfirmation.bind(voiceAgentController));

// Cancel appointment by confirmation number
router.delete('/appointment/:confirmationNumber', voiceAgentController.cancelAppointment.bind(voiceAgentController));

// ===== Retell Custom Functions (Alias routes for backward compatibility) =====
// These are the same as /api/retell/* but accessible at /api/voice-agent/*

// Custom Function 1: Check doctor availability
router.post(
  '/check-availability',
  retellFunctionsController.checkAvailability.bind(retellFunctionsController)
);

// Custom Function 2: Book appointment with confirmation
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