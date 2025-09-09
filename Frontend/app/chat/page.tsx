'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatBox from '@/components/ChatBox';
import { api } from '@/lib/apiClient';

interface DocumentInfo {
  fileName: string;
  gcsUri: string;
  analysisId?: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: string}>>([]);

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

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!documentInfo || !user) {
      throw new Error('Document or user information missing');
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.analyzeDocument(
        documentInfo.gcsUri,
        message,
        user.uid
      );

      if (!response.summary) {
        throw new Error('Analysis failed');
      }

      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        question: message,
        answer: response.summary
      }]);

      return response.summary;

    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getInitialMessage = () => {
    if (!documentInfo) return undefined;
    
    return `Hello! I'm ready to help you analyze "${documentInfo.fileName}". 

You can ask me questions like:
• What is this document about?
• Who are the parties involved?
• What are the key terms and conditions?
• Are there any important dates or deadlines?
• What are the main obligations?
• Are there any potential risks?

What would you like to know about this document?`;
  };

  const navigateToSummary = () => {
    if (documentInfo) {
      const params = new URLSearchParams({
        gcsUri: documentInfo.gcsUri,
        fileName: documentInfo.fileName,
      });
      if (documentInfo.analysisId) {
        params.set('analysisId', documentInfo.analysisId);
      }
      router.push(`/summary?${params.toString()}`);
    }
  };

  if (!documentInfo) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Document Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a document to start chatting. You can upload a new document or choose from your existing documents.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/upload')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload New Document
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Choose from Dashboard
              </button>
            </div>
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
                <div className="text-3xl">💬</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Document Chat</h1>
                  <p className="text-gray-600 mt-1">
                    Chatting with: <span className="font-medium">{documentInfo.fileName}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={navigateToSummary}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Summary</span>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-red-400">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="bg-white rounded-lg shadow-sm h-[600px]">
            <ChatBox
              onSend={handleSendMessage}
              isLoading={loading}
              initialMessage={getInitialMessage()}
            />
          </div>

          {/* Conversation Summary */}
          {conversationHistory.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Summary</h3>
              <div className="space-y-4">
                {conversationHistory.slice(-3).map((item, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-medium text-gray-900 text-sm mb-1">Q: {item.question}</p>
                    <p className="text-gray-600 text-sm">{item.answer.substring(0, 150)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Questions */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                'What is this document about?', 
                'Who are the parties involved?', 
                'What are the key terms and conditions?', 
                'Are there any important dates or deadlines?', 
                'What are the main obligations?', 
                'Are there any potential risks?'
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  disabled={loading}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
