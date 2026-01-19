import { Router } from 'express';
import voiceAgentController from '../controllers/voiceAgentController';

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

export default router;