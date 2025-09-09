import express from "express";
import { 
  getAnalysisHistory,
  getAnalysis, 
  deleteAnalysis
} from "../controllers/analyzeController.js";  // Use analyzeController.js instead
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Get analysis history
router.get("/", optionalAuth, getAnalysisHistory);

// Get specific analysis
router.get("/:id", optionalAuth, getAnalysis);

// Delete specific analysis
router.delete("/:id", optionalAuth, deleteAnalysis);

// Health check for history service
router.get("/health", (req, res) => {
  res.json({
    status: "History service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      "GET /": "Get analysis history for authenticated user",
      "GET /:id": "Get specific analysis",
      "DELETE /:id": "Delete specific analysis",
      "GET /health": "Health check"
    }
  });
});

export default router;
