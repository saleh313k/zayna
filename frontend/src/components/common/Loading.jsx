// ============================================
// src/components/common/Loading.jsx
// ============================================
import React from 'react';

const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <div className="spinner"></div>
    </div>
  );
};

export default Loading;