import multer from "multer";
import { getStorage } from "../config/googleClients.js";  // ✅ Fix import
import ocrService from "../services/ocrService.js";       // ✅ Fix: default import, not named
import { analyzeWithGemini } from "../services/geminiService.js";
import { saveDocumentData } from "../services/firestoreService.js";  // ✅ Fix: function exists
import { v4 as uuidv4 } from 'uuid';  // ✅ Fix: correct import

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
});

// Upload and process document
export const uploadDocument = async (req, res) => {
  try {
    console.log("Upload request received");
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded",
        message: "Please upload a file"
      });
    }

    const userId = req.user.uid;
    const file = req.file;
    const fileName = file.originalname || `document_${Date.now()}.pdf`;
    
    console.log(`Processing file: ${fileName} for user: ${userId}`);

    // Step 1: Upload to Google Cloud Storage
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("GOOGLE_CLOUD_STORAGE_BUCKET environment variable not set");
    }

    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const gcsFileName = `documents/${userId}/${Date.now()}_${fileName}`;
    const fileUpload = bucket.file(gcsFileName);

    // Upload file to GCS
    await new Promise((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: fileName,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      stream.on("error", (error) => {
        console.error("GCS upload error:", error);
        reject(new Error(`Failed to upload file to GCS: ${error.message}`));
      });

      stream.on("finish", () => {
        console.log(`File uploaded to GCS: ${gcsFileName}`);
        resolve();
      });

      stream.end(file.buffer);
    });

    // Step 2: Extract text using OCR service
    const gcsUri = `gs://${bucketName}/${gcsFileName}`;
    console.log(`Extracting text from: ${gcsUri}`);
    
    const extractedData = await ocrService.extractText(gcsUri, file.mimetype);  // ✅ Fix: use ocrService.extractText
    
    if (!extractedData || !extractedData.text || extractedData.text.trim().length === 0) {
      throw new Error("No text could be extracted from the document");
    }

    console.log(`Text extracted successfully (${extractedData.text.length} characters)`);

    // Step 3: Generate AI analysis
    console.log("Generating AI analysis...");
    
    const analysisPrompt = `Please analyze the following legal document and provide:
1. A summary of the document
2. Risk level assessment (Low/Medium/High)
3. Key risk factors
4. Important terms and conditions
5. Obligations for each party
6. Rights for each party
7. Fee structure
8. Termination clauses
9. Important dates and deadlines
10. Recommendations

Document content:
${extractedData.text}

Please format the response as a structured analysis.`;

    const rawAnalysis = await analyzeWithGemini(analysisPrompt);
    
    // Step 4: Save to Firestore
    const documentId = uuidv4();
    const documentData = {
      userId,
      fileName,
      gcsUri,
      gcsFileName,
      status: "completed",
      fileSize: file.size,
      mimeType: file.mimetype,
      extractedText: extractedData.text,
      analysis: rawAnalysis,
      confidence: extractedData.confidence || 0,
      entities: extractedData.entities || []
    };

    await saveDocumentData(documentId, documentData);  // ✅ Fix: use correct function
    console.log(`Document saved with ID: ${documentId}`);

    // Step 5: Return response
    res.json({
      success: true,
      documentId,
      fileName,
      gcsUri,
      analysis: rawAnalysis,
      metadata: {
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        textLength: extractedData.text.length,
        confidence: extractedData.confidence,
      },
    });

  } catch (error) {
    console.error("Upload error:", error);
    
    res.status(500).json({
      success: false,
      error: "Document upload and analysis failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const getUploadStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({ 
        success: false,
        error: "Document ID is required" 
      });
    }

    res.json({
      success: true,
      documentId,
      status: "completed",
      message: "Document processing completed",
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check upload status",
      message: error.message,
    });
  }
};

// ✅ Fix: Add the missing uploadFile function that uploadRoutes.js expects
export const uploadFile = async (req, res) => {
  return uploadDocument(req, res);  // Use the same logic
};

// ✅ Fix: Add the missing getSignedUrl function that uploadRoutes.js expects
export const getSignedUrl = async (req, res) => {
  try {
    const { gcsUri } = req.body;
    const userId = req.user?.uid;

    if (!gcsUri || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing gcsUri or userId'
      });
    }

    const { getSignedUrl: getGCSSignedUrl } = await import('../services/googleCloud.js');
    const signedUrl = await getGCSSignedUrl(gcsUri, 'read');

    res.json({
      success: true,
      signedUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    });

  } catch (error) {
    console.error('Signed URL generation failed:', error);
    res.status(500).json({
      success: false,
      error: `Failed to generate signed URL: ${error.message}`
    });
  }
};

export { upload };
