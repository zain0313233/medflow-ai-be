import { Router } from 'express';
import staffController from '../controllers/staffController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { validateStaffProfile } from '../validators/staffValidator';

const router = Router();

// Create or update staff profile (staff only)
router.post(
  '/profile',
  authMiddleware,
  roleMiddleware('staff'),
  validateStaffProfile,
  staffController.createOrUpdateProfile.bind(staffController)
);

// Get my profile (staff only)
router.get(
  '/profile/me',
  authMiddleware,
  roleMiddleware('staff'),
  staffController.getMyProfile.bind(staffController)
);

// Get staff profile by user ID (anyone can view)
router.get(
  '/profile/:id',
  staffController.getProfileById.bind(staffController)
);

// Get all staff profiles (anyone can view)
router.get(
  '/profiles',
  staffController.getAllProfiles.bind(staffController)
);

// Get staff by supervisor doctor ID (anyone can view)
router.get(
  '/doctor/:doctorId/staff',
  staffController.getStaffByDoctor.bind(staffController)
);

// Update profile (staff only)
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware('staff'),
  validateStaffProfile,
  staffController.updateProfile.bind(staffController)
);

// Delete profile (staff only)
router.delete(
  '/profile',
  authMiddleware,
  roleMiddleware('staff'),
  staffController.deleteProfile.bind(staffController)
);

// Check profile completion (staff only)
router.get(
  '/profile/status/check',
  authMiddleware,
  roleMiddleware('staff'),
  staffController.checkProfileCompletion.bind(staffController)
);

export default router;
