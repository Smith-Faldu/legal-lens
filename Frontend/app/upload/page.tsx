// Enhanced upload page with drag-and-drop and progress tracking
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/apiClient';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF or image file (PNG, JPG, GIF)';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    return null;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setAnalyzing(false);
    setProgress(10);
    setError('');

    try {
      // Convert file to base64
      setProgress(20);
      const base64Content = await convertFileToBase64(selectedFile);
      
      // Upload file
      setProgress(40);
      const uploadResponse = await api.uploadFile(selectedFile.name, base64Content);
      
      if (!uploadResponse.gcsUri) {
        throw new Error('Upload failed');
      }

      setProgress(60);
      setUploading(false);
      setAnalyzing(true);

      // Analyze document
      const analysisResponse = await api.analyzeDocument(
        uploadResponse.gcsUri,
        'Provide a comprehensive summary of this document',
        user.uid
      );

      setProgress(100);
      
      if (analysisResponse) {
        // Navigate to summary page
        router.push(`/summary?gcsUri=${encodeURIComponent(uploadResponse.gcsUri)}&fileName=${encodeURIComponent(selectedFile.name)}`);
      } else {
        throw new Error('Analysis failed');
      }

    } catch (error: any) {
      console.error('Upload/Analysis error:', error);
      setError(error.message || 'An error occurred during upload or analysis');
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const handleUploadOnly = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setProgress(10);
    setError('');

    try {
      const base64Content = await convertFileToBase64(selectedFile);
      setProgress(50);
      
      const uploadResponse = await api.uploadFile(selectedFile.name, base64Content);
      
      if (!uploadResponse.gcsUri) {
        throw new Error('Upload failed');
      }

      setProgress(100);
      
      // Navigate to dashboard or show success
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setError('');
    setProgress(0);
    setUploading(false);
    setAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isProcessing = uploading || analyzing;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
            <p className="text-gray-600 mt-2">
              Upload your legal document for AI-powered analysis
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Drop your document here
                </h3>
                <p className="text-gray-600 mb-6">
                  Or click to browse and select a file
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isProcessing}
                >
                  Choose File
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Supported formats: PDF, PNG, JPG, GIF</p>
                  <p>Maximum size: 50MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected File Info */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">
                        {selectedFile.type === 'application/pdf' ? '📄' : '🖼️'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                    </div>
                    
                    {!isProcessing && (
                      <button
                        onClick={resetUpload}
                        className="text-gray-400 hover:text-gray-600"
                        title="Remove file"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Processing...'}
                      </span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

                {/* Action Buttons */}
                {!isProcessing && !error && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleUploadAndAnalyze}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📊 Upload & Analyze
                    </button>
                    
                    <button
                      onClick={handleUploadOnly}
                      className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      📤 Upload Only
                    </button>
                  </div>
                )}

                {/* Processing Status */}
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">
                        {uploading ? 'Uploading your document...' : 'Analyzing with AI...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">What happens next?</h3>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Your document is securely stored in Google Cloud</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🤖</span>
                <span>AI analyzes your document for key insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💬</span>
                <span>You can chat with your document and ask questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📊</span>
                <span>View comprehensive summaries and analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
