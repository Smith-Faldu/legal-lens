import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

let storage;
let bucket;

export const initializeGoogleCloud = async () => {
  try {
    // Initialize Google Cloud Storage
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

    // Test bucket access
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      throw new Error(`Bucket ${process.env.GOOGLE_CLOUD_STORAGE_BUCKET} does not exist`);
    }

    console.log('☁️ Google Cloud Storage initialized successfully');
    console.log('📦 Bucket:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
    return true;

  } catch (error) {
    console.error('❌ Google Cloud initialization failed:', error);
    throw error;
  }
};

export const uploadToGCS = async (fileBuffer, fileName, mimeType) => {
  try {
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }

    // Generate unique filename to avoid conflicts
    const uniqueFileName = `${Date.now()}_${uuidv4()}_${fileName}`;
    const file = bucket.file(uniqueFileName);

    // Create a write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      },
      resumable: false
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make the file publicly readable (optional)
          // await file.makePublic();
          
          const gcsUri = `gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${uniqueFileName}`;
          console.log('✅ File uploaded successfully:', gcsUri);
          resolve(gcsUri);
        } catch (error) {
          reject(error);
        }
      });

      stream.end(fileBuffer);
    });

  } catch (error) {
    console.error('Upload to GCS error:', error);
    throw error;
  }
};

export const downloadFromGCS = async (gcsUri) => {
  try {
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }

    // Extract filename from GCS URI
    const fileName = gcsUri.replace(`gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`, '');
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found in storage');
    }

    // Download file
    const [fileBuffer] = await file.download();
    return fileBuffer;

  } catch (error) {
    console.error('Download from GCS error:', error);
    throw error;
  }
};

export const deleteFromGCS = async (gcsUri) => {
  try {
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }

    // Extract filename from GCS URI
    const fileName = gcsUri.replace(`gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`, '');
    const file = bucket.file(fileName);

    // Delete file
    await file.delete();
    console.log('🗑️ File deleted successfully:', gcsUri);
    return true;

  } catch (error) {
    console.error('Delete from GCS error:', error);
    throw error;
  }
};

export const getSignedUrl = async (gcsUri, action = 'read', expires = Date.now() + 15 * 60 * 1000) => {
  try {
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }

    // Extract filename from GCS URI
    const fileName = gcsUri.replace(`gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`, '');
    const file = bucket.file(fileName);

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action,
      expires
    });

    return signedUrl;

  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
};

export const getFileMetadata = async (gcsUri) => {
  try {
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }

    // Extract filename from GCS URI
    const fileName = gcsUri.replace(`gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`, '');
    const file = bucket.file(fileName);

    // Get file metadata
    const [metadata] = await file.getMetadata();
    return metadata;

  } catch (error) {
    console.error('Get file metadata error:', error);
    throw error;
  }
};

export { storage, bucket };