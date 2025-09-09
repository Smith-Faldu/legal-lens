// API Client for Legal Lens - Centralized HTTP client with error handling
import axios, { AxiosResponse, AxiosError } from 'axios';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  gcsUri: string;
  fileName: string;
  message: string;
  success: boolean;
}

export interface AnalysisResponse {
  summary: string;
  documentId: string;
  extractedLength: number;
  success: boolean;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  uploadDate: string;
  summary: string;
  gcsUri: string;
  question?: string;
}

export interface HistoryResponse {
  history: HistoryItem[];
  success: boolean;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 300000, // 5 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.message);

    // Handle specific error cases
    if (error.response?.status === 413) {
      return Promise.reject(new Error('File too large. Please upload a smaller file.'));
    } else if (error.response?.status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait and try again.'));
    } else if (error.response && error.response.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    } else if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again with a smaller file.'));
    }

    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Upload file
  uploadFile: async (fileName: string, fileContentBase64: string): Promise<UploadResponse> => {
    const response = await apiClient.post('/upload', {
      fileName,
      fileContentBase64,
    });
    return response.data;
  },

  // Analyze document
  analyzeDocument: async (
    gcsUri: string,
    question: string,
    userId: string
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post('/analyze', {
      gcsUri,
      question,
      userId,
    });
    return response.data;
  },

  // Get user history
  getUserHistory: async (userId: string): Promise<HistoryResponse> => {
    const response = await apiClient.get(`/history/${userId}`);
    return response.data;
  },

  // Delete document (if implemented)
  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },
};

export default apiClient;