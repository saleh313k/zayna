<<<<<<< HEAD
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

=======
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

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
export default Loading;