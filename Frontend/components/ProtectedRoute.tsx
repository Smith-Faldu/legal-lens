// Protected Route Component - Unified authentication guard
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  fallback
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle redirect logic in useEffect to avoid hydration issues
  useEffect(() => {
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true);
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, isRedirecting]);

  // Custom fallback loading component
  const LoadingComponent = fallback || (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  // Show loading spinner while checking authentication
  if (loading) {
    return <>{LoadingComponent}</>;
  }

  // Return loading while redirecting to prevent flash of content
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecting to login...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;