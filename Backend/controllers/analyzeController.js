import { analyzeWithGemini, chatWithGemini } from '../services/geminiService.js';
import { getDocumentData } from '../services/firestoreService.js';
import { saveAnalysisData, getAnalysisData, getUserAnalyses, deleteAnalysisData } from '../services/firestoreService.js';
import { v4 as uuidv4 } from 'uuid';
import ocrService from '../services/ocrService.js';

export const analyzeDocument = async (req, res) => {
  try {
    const user = req.user;
    const { documentId, gcsUri, question = '' } = req.body;

    if (!gcsUri && !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID or GCS URI is required'
      });
    }

    let documentData = null;
    let extractedText = '';

    // Get document data if documentId is provided
    if (documentId) {
      documentData = await getDocumentData(documentId);
      
      if (!documentData) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check if user owns the document
      if (documentData.userId !== user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      extractedText = documentData.extractedText || '';
    }

    // If no extracted text and we have gcsUri, try to extract
    if (!extractedText && gcsUri) {
      try {
        const extractedData = await ocrService.extractText(gcsUri);
        extractedText = extractedData.text;
      } catch (error) {
        console.warn('Text extraction failed:', error);
      }
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        error: 'No text content available for analysis'
      });
    }

    // Create analysis prompt
    const prompt = question 
      ? `Please answer the following question about this document: "${question}"\n\nDocument content:\n${extractedText}`
      : `Please provide a comprehensive analysis of this legal document. Include key points, parties involved, important dates, obligations, and potential risks.\n\nDocument content:\n${extractedText}`;

    // Analyze with Gemini AI
    const analysis = await analyzeWithGemini(prompt);

    // Save analysis to Firestore
    const analysisId = uuidv4();
    const analysisData = {
      id: analysisId,
      documentId: documentId || null,
      gcsUri: gcsUri || documentData?.gcsUri,
      question,
      analysis,
      summary: analysis, // For backward compatibility
      extractedLength: extractedText.length,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    await saveAnalysisData(analysisId, analysisData);

    res.status(200).json({
      success: true,
      message: 'Document analyzed successfully',
      analysisId,
      summary: analysis,
      analysis,
      extractedLength: extractedText.length,
      documentId: documentId || null,
      gcsUri: gcsUri || documentData?.gcsUri
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const user = req.user;
    const { documentId, gcsUri, message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!gcsUri && !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID or GCS URI is required'
      });
    }

    let documentData = null;
    let extractedText = '';

    // Get document data if documentId is provided
    if (documentId) {
      documentData = await getDocumentData(documentId);
      
      if (!documentData) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check if user owns the document
      if (documentData.userId !== user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      extractedText = documentData.extractedText || '';
    }

    // If no extracted text and we have gcsUri, try to extract
    if (!extractedText && gcsUri) {
      try {
        const extractedData = await ocrService.extractText(gcsUri);
        extractedText = extractedData.text;
      } catch (error) {
        console.warn('Text extraction failed:', error);
      }
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        error: 'No text content available for chat'
      });
    }

    // Build conversation context
    let conversationContext = `Document content:\n${extractedText}\n\n`;
    
    if (conversationHistory.length > 0) {
      conversationContext += 'Previous conversation:\n';
      conversationHistory.forEach((item, index) => {
        conversationContext += `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}\n\n`;
      });
    }

    conversationContext += `Current question: ${message}\n\nPlease provide a helpful and accurate response based on the document content and conversation history.`;

    // Get response from Gemini AI
    const response = await chatWithGemini(conversationContext);

    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      response,
      summary: response // For backward compatibility
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Chat failed'
    });
  }
};

export const getAnalysis = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const analysis = await getAnalysisData(id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // Check if user owns the analysis
    if (analysis.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
};

export const getAnalysisHistory = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, documentId } = req.query;

    const analyses = await getUserAnalyses(user.uid, {
      page: parseInt(page),
      limit: parseInt(limit),
      documentId
    });

    res.status(200).json({
      success: true,
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: analyses.length
      }
    });

  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    });
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const analysis = await getAnalysisData(id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // Check if user owns the analysis
    if (analysis.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await deleteAnalysisData(id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis'
    });
  }
};
