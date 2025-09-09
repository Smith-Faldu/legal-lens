import { Storage } from '@google-cloud/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import dotenv from 'dotenv';

dotenv.config();

let storage;
let documentAIClient;

export const initializeGoogleClients = async () => {
  try {
    console.log('🔄 Initializing Google Cloud clients...');

    // Initialize Google Cloud Storage
    if (!storage) {
      storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });
      console.log('✅ Google Cloud Storage client initialized');
    }

    // Initialize Document AI client
    if (!documentAIClient) {
      documentAIClient = new DocumentProcessorServiceClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });
      console.log('✅ Document AI client initialized');
    }

    console.log('✅ All Google Cloud clients initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Google Cloud clients initialization failed:', error);
    throw error;
  }
};

export const getStorage = () => {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return storage;
};

export const getDocumentAIClient = () => {
  if (!documentAIClient) {
    documentAIClient = new DocumentProcessorServiceClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return documentAIClient;
};

export const getProjectId = () => {
  return process.env.GOOGLE_CLOUD_PROJECT_ID;
};
