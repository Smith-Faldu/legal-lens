import express from "express";
import { 
  analyzeDocument,
  getAnalysis,
  getAnalysisHistory,
  deleteAnalysis,
  chatWithDocument 
} from '../controllers/analyzeController.js';
import { 
  validateAnalysisRequest, 
  validateChatRequest, 
  validateAnalysisId,
  validatePagination 
} from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js'; // Add import

const router = express.Router();

// Analysis routes (protected)
router.post('/analyze', authMiddleware, validateAnalysisRequest, analyzeDocument);
router.post('/chat', authMiddleware, validateChatRequest, chatWithDocument);
router.get('/history', authMiddleware, validatePagination, getAnalysisHistory);
router.get('/:id', authMiddleware, validateAnalysisId, getAnalysis);
router.delete('/:id', authMiddleware, validateAnalysisId, deleteAnalysis);

// Health check for analyze service
router.get("/health", (req, res) => {
  res.json({
    status: "Analyze service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /analyze": "Analyze document",
      "POST /chat": "Chat with document",
      "GET /history": "Get analysis history",
      "GET /:id": "Get specific analysis",
      "DELETE /:id": "Delete analysis",
      "GET /health": "Health check"
    }
  });
});

export default router;
