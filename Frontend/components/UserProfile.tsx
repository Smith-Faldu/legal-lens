// User Profile Component with enhanced functionality
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(user?.displayName || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleUpdateProfile = async (): Promise<void> => {
    if (!displayName.trim()) {
      setMessage('Display name cannot be empty');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateUserProfile(displayName.trim());
      setMessage('Profile updated successfully');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logout();
    } catch (error: any) {
      setMessage(error.message || 'Failed to logout');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleUpdateProfile();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setDisplayName(user?.displayName || '');
      setMessage('');
    }
  };

  // Update displayName when user changes
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {(user.displayName || user.email || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Display Name"
                disabled={loading}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading || !displayName.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(user.displayName || '');
                    setMessage('');
                  }}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">Press Enter to save, Escape to cancel</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg">{user.displayName || 'Anonymous User'}</h3>
              <p className="text-gray-600 text-sm">{user.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 text-sm hover:underline mt-1 focus:outline-none"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${
          message.includes('success') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message}</span>
            <button
              onClick={() => setMessage('')}
              className="text-xs hover:opacity-70 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default UserProfile;