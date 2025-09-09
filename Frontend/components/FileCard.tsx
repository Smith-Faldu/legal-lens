// File Card Component for displaying document items
'use client';

import React from 'react';

interface FileCardProps {
  fileName: string;
  uploadDate: string;
  summary: string;
  onView?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  fileName,
  uploadDate,
  summary,
  onView,
  onDelete,
  loading = false
}) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return '📄';
      case 'docx':
      case 'doc': return '📝';
      default: return '📎';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      loading ? 'opacity-50 pointer-events-none' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(fileName)}</span>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-xs" title={fileName}>
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(uploadDate)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={onView}
              disabled={loading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="View document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Delete document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 line-clamp-3">
        {summary}
      </div>
      
      {loading && (
        <div className="flex items-center justify-center mt-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default FileCard;
