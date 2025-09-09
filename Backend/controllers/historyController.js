import { getUserDocuments } from "../services/firestoreService.js";

// Get all documents for a user (history)
export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.uid; // Get from authenticated user

    console.log(`Fetching history for user: ${userId}`);
    
    const documents = await getUserDocuments(userId);
    
    // Format documents for frontend (summary cards)
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      summary: doc.summary,
      riskLevel: doc.riskLevel,
      riskFactors: doc.riskFactors || [],
      keyTerms: doc.keyTerms || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      status: doc.status || "completed",
      fileSize: doc.fileSize,
      // Include preview of important information
      preview: {
        obligations: doc.obligations?.slice(0, 3) || [],
        rights: doc.rights?.slice(0, 3) || [],
        importantDates: doc.importantDates?.slice(0, 2) || [],
      }
    }));

    console.log(`Found ${formattedDocuments.length} documents for user ${userId}`);

    res.json({
      success: true,
      userId,
      documents: formattedDocuments,
      totalCount: formattedDocuments.length,
      message: `Retrieved ${formattedDocuments.length} documents`,
    });

  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch user history",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get documents with filtering and pagination
export const getFilteredHistory = async (req, res) => {
  try {
    const userId = req.user.uid; // Get from authenticated user
    const { 
      riskLevel, 
      limit = 20, 
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    console.log(`Fetching filtered history for user: ${userId}`, { riskLevel, limit, offset });

    let documents = await getUserDocuments(userId);
    
    // Apply risk level filter
    if (riskLevel && riskLevel !== "ALL") {
      documents = documents.filter(doc => 
        doc.riskLevel && doc.riskLevel.toUpperCase() === riskLevel.toUpperCase()
      );
    }

    // Apply sorting
    documents.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalCount = documents.length;
    const paginatedDocuments = documents.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    // Format documents for frontend
    const formattedDocuments = paginatedDocuments.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      summary: doc.summary,
      riskLevel: doc.riskLevel,
      riskFactors: doc.riskFactors || [],
      keyTerms: doc.keyTerms || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      status: doc.status || "completed",
      fileSize: doc.fileSize,
      preview: {
        obligations: doc.obligations?.slice(0, 3) || [],
        rights: doc.rights?.slice(0, 3) || [],
        importantDates: doc.importantDates?.slice(0, 2) || [],
      }
    }));

    console.log(`Returning ${formattedDocuments.length} documents (${totalCount} total)`);

    res.json({
      success: true,
      userId,
      documents: formattedDocuments,
      pagination: {
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount,
      },
      filters: {
        riskLevel: riskLevel || "ALL",
        sortBy,
        sortOrder,
      },
      message: `Retrieved ${formattedDocuments.length} documents`,
    });

  } catch (error) {
    console.error("Filtered history fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch filtered history",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get document statistics for a user
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.uid; // Get from authenticated user

    console.log(`Fetching stats for user: ${userId}`);
    
    const documents = await getUserDocuments(userId);
    
    // Calculate statistics
    const stats = {
      totalDocuments: documents.length,
      riskLevels: {
        HIGH: documents.filter(doc => doc.riskLevel === "HIGH").length,
        MEDIUM: documents.filter(doc => doc.riskLevel === "MEDIUM").length,
        LOW: documents.filter(doc => doc.riskLevel === "LOW").length,
        UNKNOWN: documents.filter(doc => !doc.riskLevel || doc.riskLevel === "UNKNOWN").length,
      },
      totalFileSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
      averageFileSize: documents.length > 0 
        ? Math.round(documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0) / documents.length)
        : 0,
      oldestDocument: documents.length > 0 
        ? documents[documents.length - 1].createdAt 
        : null,
      newestDocument: documents.length > 0 
        ? documents[0].createdAt 
        : null,
    };

    console.log(`Stats calculated for user ${userId}:`, stats);

    res.json({
      success: true,
      userId,
      stats,
      message: "Statistics retrieved successfully",
    });

  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch user statistics",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Check your historyController.js file for available exports
// It might look something like this:

export const getHistory = async (req, res) => { /* ... */ };
export const getAnalysisById = async (req, res) => { /* ... */ };
export const deleteAnalysis = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Add your delete logic here
    // For example, using Firestore:
    const { deleteAnalysisData, getAnalysisData } = await import('../services/firestoreService.js');
    
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
