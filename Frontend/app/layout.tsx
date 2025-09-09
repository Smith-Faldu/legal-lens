import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'  // ✅ Fix: Correct path to styles folder
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] })

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Legal Lens - AI-Powered Legal Document Analysis',
  description: 'Analyze legal documents with AI-powered insights and chat functionality',
  keywords: 'legal, document analysis, AI, PDF analysis, legal tech',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
