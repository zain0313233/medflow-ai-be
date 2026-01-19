import { Router } from 'express';
import doctorController from '../controllers/doctorController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { validateDoctorProfile } from '../validators/doctorValidator';

const router = Router();

// Create or update doctor profile (doctor only)
router.post(
  '/profile',
  authMiddleware,
  roleMiddleware('doctor'),
  validateDoctorProfile,
  doctorController.createOrUpdateProfile.bind(doctorController)
);

// Get my profile (doctor only)
router.get(
  '/profile/me',
  authMiddleware,
  roleMiddleware('doctor'),
  doctorController.getMyProfile.bind(doctorController)
);

// Get doctor profile by user ID (anyone can view)
router.get(
  '/profile/:id',
  doctorController.getProfileById.bind(doctorController)
);

// Get all doctor profiles (anyone can view)
router.get(
  '/profiles',
  doctorController.getAllProfiles.bind(doctorController)
);

// Update profile (doctor only)
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware('doctor'),
  validateDoctorProfile,
  doctorController.updateProfile.bind(doctorController)
);

// Delete profile (doctor only)
router.delete(
  '/profile',
  authMiddleware,
  roleMiddleware('doctor'),
  doctorController.deleteProfile.bind(doctorController)
);

// Check profile completion (doctor only)
router.get(
  '/profile/status/check',
  authMiddleware,
  roleMiddleware('doctor'),
  doctorController.checkProfileCompletion.bind(doctorController)
);

export default router;
