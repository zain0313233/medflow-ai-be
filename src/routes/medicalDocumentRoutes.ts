import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  upload,
  uploadDocument,
  getDocument,
  getMyDocuments,
  getPatientDocuments,
  downloadDocument,
  deleteDocument,
} from '../controllers/medicalDocumentController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/medical-documents/upload
 * @desc    Upload a medical document
 * @access  Private (Patient, Doctor, Staff)
 */
router.post('/upload', upload.single('file'), uploadDocument);

/**
 * @route   GET /api/medical-documents/my-documents
 * @desc    Get all documents for current user
 * @access  Private (Patient)
 */
router.get('/my-documents', getMyDocuments);

/**
 * @route   GET /api/medical-documents/patient/:patientId
 * @desc    Get all documents for a specific patient
 * @access  Private (Doctor, Staff)
 */
router.get('/patient/:patientId', getPatientDocuments);

/**
 * @route   GET /api/medical-documents/:id
 * @desc    Get document by ID with AI insights
 * @access  Private
 */
router.get('/:id', getDocument);

/**
 * @route   GET /api/medical-documents/:id/download
 * @desc    Download document file
 * @access  Private
 */
router.get('/:id/download', downloadDocument);

/**
 * @route   DELETE /api/medical-documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete('/:id', deleteDocument);

export default router;
