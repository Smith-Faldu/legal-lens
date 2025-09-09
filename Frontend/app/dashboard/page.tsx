'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import FileCard from '@/components/FileCard';
import { api } from '@/lib/apiClient';

interface HistoryItem {
  id: string;
  fileName: string;
  uploadDate: string;
  summary: string;
  gcsUri: string;
  question?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.getUserHistory(user!.uid);
      setHistory(response.history || []);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      setError('Failed to load document history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (item: HistoryItem) => {
    // Navigate to summary page with the document
    router.push(`/summary?gcsUri=${encodeURIComponent(item.gcsUri)}&fileName=${encodeURIComponent(item.fileName)}`);
  };

  const handleChatWithDocument = (item: HistoryItem) => {
    // Navigate to chat page with the document
    router.push(`/chat?gcsUri=${encodeURIComponent(item.gcsUri)}&fileName=${encodeURIComponent(item.fileName)}`);
  };

  const stats = {
    totalDocuments: history.length,
    documentsThisMonth: history.filter(item => {
      const uploadDate = new Date(item.uploadDate);
      const now = new Date();
      return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear();
    }).length,
    recentUploads: history.slice(0, 3)
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.displayName || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your legal documents and analysis history
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalDocuments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-6m0 0V7m0 6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.documentsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Analysis</p>
                  <p className="text-2xl font-semibold text-gray-900">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/upload')}
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center w-full">
                  <div className="text-3xl mb-2">📤</div>
                  <div className="font-medium text-gray-900">Upload Document</div>
                  <div className="text-sm text-gray-600">Upload a new legal document</div>
                </div>
              </button>

              <button
                onClick={() => router.push('/chat')}
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center w-full">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="font-medium text-gray-900">Start Chat</div>
                  <div className="text-sm text-gray-600">Chat with your documents</div>
                </div>
              </button>

              <button
                onClick={() => router.push('/summary')}
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center w-full">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-medium text-gray-900">View Summary</div>
                  <div className="text-sm text-gray-600">Get document insights</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
                {history.length > 6 && (
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading documents...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={fetchHistory}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first legal document to get started</p>
                  <button
                    onClick={() => router.push('/upload')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.slice(0, 6).map((item) => (
                    <div key={item.id} className="relative">
                      <FileCard
                        fileName={item.fileName}
                        uploadDate={item.uploadDate}
                        summary={item.summary}
                        onView={() => handleViewDocument(item)}
                      />
                      
                      {/* Action buttons overlay */}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => handleChatWithDocument(item)}
                          className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                          title="Chat with document"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
