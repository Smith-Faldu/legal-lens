// Landing page with improved design and call-to-action
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="text-6xl mb-6">⚖️</div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Legal <span className="text-blue-600">Lens</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered legal document analysis with intelligent chat capabilities. 
            Upload, analyze, and interact with your legal documents like never before.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features for Legal Professionals
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to analyze and understand your legal documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Advanced AI analyzes your documents to extract key insights, identify important clauses, 
              and provide comprehensive summaries.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Interactive Chat</h3>
            <p className="text-gray-600">
              Ask questions about your documents and get instant, intelligent responses. 
              Chat naturally with your legal documents.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Private</h3>
            <p className="text-gray-600">
              Your documents are securely stored and processed with enterprise-grade security. 
              Your data privacy is our priority.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Legal Lens Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Document</h3>
              <p className="text-gray-600">
                Upload your legal documents in PDF format. Our system supports various document types.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your document, extracting key information and generating insights.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat & Explore</h3>
              <p className="text-gray-600">
                Ask questions, get summaries, and explore your document through intelligent conversation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Legal Document Analysis?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join legal professionals who trust Legal Lens for intelligent document analysis
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
          >
            Start Analyzing Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold">Legal Lens</span>
          </div>
          <p className="text-gray-400">
            © 2024 Legal Lens. All rights reserved. AI-powered legal document analysis.
          </p>
        </div>
      </footer>
    </div>
  );
}
