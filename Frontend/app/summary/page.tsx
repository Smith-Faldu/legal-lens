// Enhanced summary page with detailed analysis display
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/apiClient';

interface AnalysisData {
  summary: string;
  documentId: string;
  extractedLength: number;
  keyPoints?: string[];
  parties?: string[];
  dates?: string[];
  risks?: string[];
  obligations?: string[];
}

interface DocumentInfo {
  fileName: string;
  gcsUri: string;
  analysisId?: string;
}

export default function SummaryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // Get document info from URL params
  useEffect(() => {
    const gcsUri = searchParams.get('gcsUri');
    const fileName = searchParams.get('fileName');
    const analysisId = searchParams.get('analysisId');

    if (gcsUri && fileName) {
      setDocumentInfo({
        gcsUri: decodeURIComponent(gcsUri),
        fileName: decodeURIComponent(fileName),
        analysisId: analysisId || undefined
      });
    }
  }, [searchParams]);

  // Fetch analysis data
  useEffect(() => {
    if (documentInfo && user) {
      fetchAnalysis();
    }
  }, [documentInfo, user]);

  const fetchAnalysis = async () => {
    if (!documentInfo || !user) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.analyzeDocument(
        documentInfo.gcsUri,
        'Provide a comprehensive summary of this document', // Default summary question
        user.uid
      );

      if (!response || !response.summary) {
        throw new Error('Analysis failed');
      }

      // Parse the analysis data (assuming the API returns structured data)
      const analysisData: AnalysisData = {
        summary: response.summary,
        documentId: response.documentId || '',
        extractedLength: response.extractedLength || 0,
        // These would ideally come from the API, but we'll simulate them
        keyPoints: extractKeyPoints(response.summary),
        parties: extractParties(response.summary),
        dates: extractDates(response.summary),
        risks: extractRisks(response.summary),
        obligations: extractObligations(response.summary)
      };

      setAnalysisData(analysisData);

    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze document');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract structured data from summary
  const extractKeyPoints = (summary: string): string[] => {
    // Simple extraction logic - in a real app, this would be more sophisticated
    const sentences = summary.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  };

  const extractParties = (summary: string): string[] => {
    const partyRegex = /\b([A-Z][a-z]+ (?:Inc|LLC|Corp|Company|Ltd)\.?)\b/g;
    const matches = summary.match(partyRegex) || [];
    return [...new Set(matches)].slice(0, 5);
  };

  const extractDates = (summary: string): string[] => {
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
    const matches = summary.match(dateRegex) || [];
    return [...new Set(matches)].slice(0, 5);
  };

  const extractRisks = (summary: string): string[] => {
    const riskWords = ['risk', 'liability', 'penalty', 'breach', 'default', 'termination'];
    const sentences = summary.split('.').filter(s => 
      riskWords.some(word => s.toLowerCase().includes(word))
    );
    return sentences.slice(0, 3).map(s => s.trim());
  };

  const extractObligations = (summary: string): string[] => {
    const obligationWords = ['must', 'shall', 'required', 'obligation', 'duty', 'responsible'];
    const sentences = summary.split('.').filter(s => 
      obligationWords.some(word => s.toLowerCase().includes(word))
    );
    return sentences.slice(0, 3).map(s => s.trim());
  };

  const navigateToChat = () => {
    if (documentInfo) {
      const params = new URLSearchParams({
        gcsUri: documentInfo.gcsUri,
        fileName: documentInfo.fileName,
      });
      if (documentInfo.analysisId) {
        params.set('analysisId', documentInfo.analysisId);
      }
      router.push(`/chat?${params.toString()}`);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📄' },
    { id: 'keypoints', label: 'Key Points', icon: '🔑' },
    { id: 'parties', label: 'Parties', icon: '👥' },
    { id: 'dates', label: 'Important Dates', icon: '📅' },
    { id: 'risks', label: 'Risks', icon: '⚠️' },
    { id: 'obligations', label: 'Obligations', icon: '📋' }
  ];

  if (!documentInfo) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Document Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a document to view its summary and analysis.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📊</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Document Analysis</h1>
                  <p className="text-gray-600 mt-1">
                    Analysis for: <span className="font-medium">{documentInfo.fileName}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={navigateToChat}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat with Document</span>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your document...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex">
                <div className="text-red-400">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={fetchAnalysis}
                    className="text-sm text-red-600 hover:text-red-500 mt-2 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Content */}
          {analysisData && !loading && (
            <>
              {/* Document Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📄</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Document Length</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analysisData.extractedLength.toLocaleString()} chars
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🔍</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Analysis Status</p>
                      <p className="text-2xl font-bold text-green-600">Complete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">⏱️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Summary Tab */}
                  {activeTab === 'summary' && (
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Document Summary</h3>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {analysisData.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Points Tab */}
                  {activeTab === 'keypoints' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Key Points</h3>
                      {analysisData.keyPoints && analysisData.keyPoints.length > 0 ? (
                        <ul className="space-y-3">
                          {analysisData.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No key points identified.</p>
                      )}
                    </div>
                  )}

                  {/* Parties Tab */}
                  {activeTab === 'parties' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Parties Involved</h3>
                      {analysisData.parties && analysisData.parties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analysisData.parties.map((party, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">👤</span>
                                <span className="font-medium text-gray-900">{party}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No parties identified.</p>
                      )}
                    </div>
                  )}

                  {/* Dates Tab */}
                  {activeTab === 'dates' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Important Dates</h3>
                      {analysisData.dates && analysisData.dates.length > 0 ? (
                        <div className="space-y-3">
                          {analysisData.dates.map((date, index) => (
                            <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                              <span className="text-lg">📅</span>
                              <span className="font-medium text-gray-900">{date}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No important dates identified.</p>
                      )}
                    </div>
                  )}

                  {/* Risks Tab */}
                  {activeTab === 'risks' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Potential Risks</h3>
                      {analysisData.risks && analysisData.risks.length > 0 ? (
                        <div className="space-y-3">
                          {analysisData.risks.map((risk, index) => (
                            <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                              <div className="flex items-start space-x-2">
                                <span className="text-red-500 mt-1">⚠️</span>
                                <span className="text-red-800">{risk}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No specific risks identified.</p>
                      )}
                    </div>
                  )}

                  {/* Obligations Tab */}
                  {activeTab === 'obligations' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Obligations & Duties</h3>
                      {analysisData.obligations && analysisData.obligations.length > 0 ? (
                        <div className="space-y-3">
                          {analysisData.obligations.map((obligation, index) => (
                            <div key={index} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                              <div className="flex items-start space-x-2">
                                <span className="text-yellow-600 mt-1">📋</span>
                                <span className="text-yellow-800">{obligation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No specific obligations identified.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
