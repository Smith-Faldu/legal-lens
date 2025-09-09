import express from "express";
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  downloadDocument
} from '../controllers/documentController.js';
import { validateFileUpload } from '../middleware/validation.js';  // ✅ Change validateFile to validateFileUpload
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed.'));
    }
  }
});

// Upload document
router.post('/upload', authMiddleware, upload.single('document'), validateFileUpload, uploadDocument);  // ✅ Change validateFile to validateFileUpload

// Get all documents
router.get('/', getDocuments);

// Delete document
router.delete('/:id', deleteDocument);

// Download document
router.get('/:id/download', downloadDocument);

export default router;
