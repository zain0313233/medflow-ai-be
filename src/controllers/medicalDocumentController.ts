import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import MedicalDocument from '../models/MedicalDocument';
import DocumentInsight from '../models/DocumentInsight';
import {
  processMedicalDocument,
  getDocumentWithInsights,
  getUserDocuments,
} from '../services/medicalDocumentService';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/medical-documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only PDF and images
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
});

/**
 * Upload medical document
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const { type, title, description, appointmentId } = req.body;
    const file = req.file;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!type || !title) {
      return res.status(400).json({ message: 'Type and title are required' });
    }

    // Create document record
    const document = await MedicalDocument.create({
      userId: req.body.patientId || userId, // Allow doctor/staff to upload for patient
      appointmentId: appointmentId || undefined,
      type,
      title,
      description,
      fileUrl: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId,
      uploadedByRole: userRole,
      status: 'pending',
    });

    // Process document with AI in background (don't wait)
    processMedicalDocument(document._id.toString())
      .then(() => {
        console.log(`Document ${document._id} processed successfully`);
      })
      .catch((error) => {
        console.error(`Failed to process document ${document._id}:`, error);
      });

    res.status(201).json({
      message: 'Document uploaded successfully. AI processing started.',
      document: {
        id: document._id,
        type: document.type,
        title: document.title,
        fileName: document.fileName,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload document' });
  }
}

/**
 * Get document by ID with AI insights
 */
export async function getDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const { document, insight } = await getDocumentWithInsights(id);

    // Check access permission
    if (userRole === 'patient' && document.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      document: {
        id: document._id,
        type: document.type,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        status: document.status,
        uploadedBy: document.uploadedBy,
        uploadedByRole: document.uploadedByRole,
        createdAt: document.createdAt,
      },
      insight: insight
        ? {
            summary: insight.aiSummary,
            structuredData: insight.structuredData,
            flags: insight.flags,
            confidence: insight.confidence,
            processingTime: insight.processingTime,
            disclaimer:
              'This is an AI-generated summary for informational purposes only. It does not replace medical advice. Always follow your doctor\'s instructions.',
          }
        : null,
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ message: error.message || 'Failed to get document' });
  }
}

/**
 * Get all documents for current user
 */
export async function getMyDocuments(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { type } = req.query;

    const documents = await getUserDocuments(userId, type as string);

    res.json({
      count: documents.length,
      documents: documents.map((doc) => ({
        id: doc._id,
        type: doc.type,
        title: doc.title,
        description: doc.description,
        fileName: doc.fileName,
        status: doc.status,
        createdAt: doc.createdAt,
        hasSummary: !!doc.insight,
        summary: doc.insight?.aiSummary || null,
      })),
    });
  } catch (error: any) {
    console.error('Get my documents error:', error);
    res.status(500).json({ message: error.message || 'Failed to get documents' });
  }
}

/**
 * Get documents for a specific patient (doctor/staff only)
 */
export async function getPatientDocuments(req: Request, res: Response) {
  try {
    const { patientId } = req.params;
    const { type } = req.query;
    const userRole = (req as any).user.role;

    // Only doctors and staff can access patient documents
    if (userRole !== 'doctor' && userRole !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await getUserDocuments(patientId, type as string);

    res.json({
      count: documents.length,
      documents: documents.map((doc) => ({
        id: doc._id,
        type: doc.type,
        title: doc.title,
        description: doc.description,
        fileName: doc.fileName,
        status: doc.status,
        createdAt: doc.createdAt,
        hasSummary: !!doc.insight,
        summary: doc.insight?.aiSummary || null,
      })),
    });
  } catch (error: any) {
    console.error('Get patient documents error:', error);
    res.status(500).json({ message: error.message || 'Failed to get documents' });
  }
}

/**
 * Download document file
 */
export async function downloadDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const document = await MedicalDocument.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permission
    if (userRole === 'patient' && document.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.fileUrl)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(document.fileUrl, document.fileName);
  } catch (error: any) {
    console.error('Download document error:', error);
    res.status(500).json({ message: error.message || 'Failed to download document' });
  }
}

/**
 * Delete document
 */
export async function deleteDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const document = await MedicalDocument.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission (only uploader or doctor can delete)
    if (
      userRole === 'patient' &&
      document.uploadedBy.toString() !== userId &&
      document.userId.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from disk
    if (fs.existsSync(document.fileUrl)) {
      fs.unlinkSync(document.fileUrl);
    }

    // Delete insight
    await DocumentInsight.deleteOne({ documentId: document._id });

    // Delete document
    await document.deleteOne();

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete document' });
  }
}
