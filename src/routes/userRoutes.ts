import { Router } from 'express';
import userController from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { 
  validateSignup, 
  validateLogin, 
  validateChangePassword, 
  validateUpdateProfile, 
  validatePasswordReset, 
  validateEmail 
} from '../validators/userValidator';

const router = Router();

// Public routes
router.post('/signup', validateSignup, userController.signup.bind(userController));
router.post('/login', validateLogin, userController.login.bind(userController));
router.post('/request-password-reset', validateEmail, userController.requestPasswordReset.bind(userController));
router.post('/reset-password', validatePasswordReset, userController.resetPassword.bind(userController));
router.post('/verify-email', userController.verifyEmail.bind(userController));

// Protected routes - User
router.get('/profile', authMiddleware, userController.getProfile.bind(userController));
router.put('/profile', authMiddleware, validateUpdateProfile, userController.updateProfile.bind(userController));
router.post('/change-password', authMiddleware, validateChangePassword, userController.changePassword.bind(userController));
router.post('/deactivate', authMiddleware, userController.deactivateAccount.bind(userController));

// Protected routes - Admin only
router.get('/all', authMiddleware, roleMiddleware('admin'), userController.getAllUsers.bind(userController));
router.get('/:id', authMiddleware, roleMiddleware('admin'), userController.getUserById.bind(userController));
router.delete('/:id', authMiddleware, roleMiddleware('admin'), userController.deleteUser.bind(userController));
router.get('/role/:role', authMiddleware, roleMiddleware('admin'), userController.getUsersByRole.bind(userController));

export default router;
