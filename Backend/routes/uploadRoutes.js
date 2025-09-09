import express from "express";
import { uploadFile, getSignedUrl } from "../controllers/uploadController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Upload PDF document (requires authentication)
router.post("/", optionalAuth, uploadFile);

// Get signed URL for file access
router.post("/signed-url", optionalAuth, getSignedUrl);

// Health check for upload service
router.get("/health", (req, res) => {
  res.json({
    status: "Upload service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /": "Upload PDF document",
      "POST /signed-url": "Get signed URL for file access",
      "GET /health": "Health check"
    }
  });
});

export default router;
