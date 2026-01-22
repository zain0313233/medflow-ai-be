import { Router } from 'express';
import appointmentController from '../controllers/appointmentController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { appointmentBookingAuth } from '../middlewares/apiKeyMiddleware';
import { requireProfileCompletion } from '../middlewares/profileCompletionMiddleware';
import { 
  validateAppointment, 
  validateVoiceAppointment, 
  validateAppointmentStatus,
  validateDateParam,
  validateObjectId
} from '../validators/appointmentValidator';

const router = Router();

// Secured routes - Require API key (Retell/Voice Agent) OR Admin JWT

// Create appointment via voice agent - SECURED
router.post(
  '/voice-booking',
  appointmentBookingAuth,
  validateVoiceAppointment,
  appointmentController.createVoiceAppointment.bind(appointmentController)
);

// Get available slots for a doctor - SECURED
router.get(
  '/slots/:doctorId/:date',
  appointmentBookingAuth,
  validateObjectId('doctorId'),
  validateDateParam,
  appointmentController.getAvailableSlots.bind(appointmentController)
);

// Protected routes (authentication required)

// Create appointment (authenticated users)
router.post(
  '/',
  authMiddleware,
  validateAppointment,
  appointmentController.createAppointment.bind(appointmentController)
);

// Get my appointments (for doctors)
router.get(
  '/my-appointments',
  authMiddleware,
  requireProfileCompletion,
  roleMiddleware('doctor'),
  appointmentController.getMyAppointments.bind(appointmentController)
);

// Get my patient appointments (for patients)
router.get(
  '/my-patient-appointments',
  authMiddleware,
  roleMiddleware('patient'),
  appointmentController.getMyPatientAppointments.bind(appointmentController)
);

// Get appointment by ID
router.get(
  '/:appointmentId',
  authMiddleware,
  validateObjectId('appointmentId'),
  appointmentController.getAppointmentById.bind(appointmentController)
);

// Update appointment status
router.patch(
  '/:appointmentId/status',
  authMiddleware,
  validateObjectId('appointmentId'),
  validateAppointmentStatus,
  appointmentController.updateAppointmentStatus.bind(appointmentController)
);

// Cancel appointment
router.patch(
  '/:appointmentId/cancel',
  authMiddleware,
  validateObjectId('appointmentId'),
  appointmentController.cancelAppointment.bind(appointmentController)
);

// Get appointments by doctor (doctor or admin only)
router.get(
  '/doctor/:doctorId',
  authMiddleware,
  validateObjectId('doctorId'),
  appointmentController.getDoctorAppointments.bind(appointmentController)
);

// Get appointments by patient (patient or admin only)
router.get(
  '/patient/:patientId',
  authMiddleware,
  validateObjectId('patientId'),
  appointmentController.getPatientAppointments.bind(appointmentController)
);

// Admin only routes

// Get all appointments (admin only)
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware('admin'),
  appointmentController.getAllAppointments.bind(appointmentController)
);

export default router;