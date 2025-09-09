// import ocrService from '../services/ocrService.js';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import dotenv from 'dotenv';

dotenv.config();

let documentAIClient;

/**
 * Extract text from documents using Google Document AI
 */
class OCRService {
  constructor() {
    this.processorName = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    // ✅ Fix: Use correct environment variable names
    this.processorName = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.DOCUMENT_AI_LOCATION}/processors/${process.env.DOCUMENT_AI_PROCESSOR_ID}`;
    this.initialized = true;
    console.log('✅ OCR Service initialized');
  }

  /**
   * Process document and extract text using Document AI
   */
  async extractText(gcsUri, mimeType = 'application/pdf') {
    this.initialize();

    try {
      if (!documentAIClient) {
        documentAIClient = new DocumentProcessorServiceClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,  // ✅ Fix: Use correct env var
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
      }

      console.log(`🔍 Processing document: ${gcsUri}`);

      const request = {
        name: this.processorName,
        document: {
          gcsDocument: {
            gcsUri: gcsUri,
            mimeType: mimeType,
          },
        },
      };

      const [result] = await documentAIClient.processDocument(request);
      const document = result.document;

      if (!document || !document.text) {
        throw new Error('No text extracted from document');
      }

      console.log(`✅ Extracted ${document.text.length} characters from document`);

      // Return both raw text and structured data
      return {
        text: document.text,
        pages: document.pages?.length || 0,
        entities: this.extractEntities(document),
        confidence: this.calculateConfidence(document),
        metadata: {
          processingTime: new Date().toISOString(),
          processorId: process.env.DOCUMENT_AI_PROCESSOR_ID,
          textLength: document.text.length
        }
      };

    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      
      // Return error info for debugging
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Extract entities from Document AI result
   */
  extractEntities(document) {
    if (!document.entities) return [];

    return document.entities.map(entity => ({
      type: entity.type,
      mentionText: entity.mentionText,
      confidence: entity.confidence,
      normalizedValue: entity.normalizedValue?.text
    }));
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(document) {
    if (!document.pages) return 0;

    let totalConfidence = 0;
    let elementCount = 0;

    document.pages.forEach(page => {
      if (page.tokens) {
        page.tokens.forEach(token => {
          if (token.detectedBreak && token.detectedBreak.confidence) {
            totalConfidence += token.detectedBreak.confidence;
            elementCount++;
          }
        });
      }
    });

    return elementCount > 0 ? totalConfidence / elementCount : 0.8; // Default confidence
  }

  /**
   * Determine MIME type from file extension
   */
  getMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff'
    };
    return mimeTypes[ext] || 'application/pdf';
  }
}

export default new OCRService();