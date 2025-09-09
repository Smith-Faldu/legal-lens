import express from 'express';
import ocrService from '../services/ocrService.js';
import { 
  getDocumentData,        // ✅ This exists (not getDocumentById)
  saveDocumentData,       // ✅ This exists
  deleteDocumentData,     // ✅ This exists
  getUserDocuments,       // ✅ This exists
  updateDocumentData,     // ✅ This exists
  saveDocumentHistory      // ✅ This exists
} from "../services/firestoreService.js";
import { uploadToGCS, deleteFromGCS, getSignedUrl } from '../services/googleCloud.js';
import { v4 as uuidv4 } from 'uuid';

// Upload a new document
export const uploadDocument = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Generate unique document ID
    const documentId = uuidv4();

    // Upload to Google Cloud Storage
    const gcsUri = await uploadToGCS(file.buffer, file.originalname, file.mimetype);

    // Extract text using OCR service
    const extractedData = await ocrService.extractText(gcsUri, file.mimetype);

    // Save document data
    const documentData = {
      userId: user.uid,
      fileName: file.originalname,
      gcsUri,
      extractedText: extractedData.text,
      metadata: extractedData.metadata || {},
      mimeType: file.mimetype,
      fileSize: file.size
    };

    await saveDocumentData(documentId, documentData);
    await saveDocumentHistory(user.uid, documentData); // Save to history

    res.status(200).json({
      success: true,
      documentId,
      fileName: file.originalname,
      extractedText: extractedData.text,
      metadata: extractedData.metadata
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document'
    });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const documents = await getUserDocuments(user.uid, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      order
    });

    res.status(200).json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: documents.length
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
};

// Get a single document by ID with full analysis
export const getDocument = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const document = await getDocumentData(id);  // ✅ Use getDocumentData instead of getDocumentById
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user owns the document
    if (document.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
};

// Delete a document (soft delete by updating status)
export const deleteDocument = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Get document to check ownership
    const document = await getDocumentData(id);  // ✅ Use getDocumentData
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (document.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Delete from storage and database
    await deleteFromGCS(document.gcsUri);
    await deleteDocumentData(id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const document = await getDocumentData(id);  // ✅ Use getDocumentData
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (document.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Generate signed URL for download
    const downloadUrl = await getSignedUrl(document.gcsUri, 'read');

    res.status(200).json({
      success: true,
      downloadUrl,
      fileName: document.fileName
    });

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download link'
    });
  }
};
