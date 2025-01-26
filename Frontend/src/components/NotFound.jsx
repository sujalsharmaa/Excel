import React from 'react';
import { HomeIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFound=()=> {
  const goBack = () => {
    window.history.back();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Text */}
        <div className="relative">
          <h1 className="text-9xl font-bold text-gray-200 animate-pulse">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-medium text-gray-800">Oops! Page Not Found</span>
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-6">
          <p className="text-gray-600 text-lg">
            The page you're looking for seems to have gone on an adventure without us.
          </p>
          
          {/* Illustration */}
          <div className="flex justify-center my-8">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-50 animate-ping" />
              <div className="relative flex items-center justify-center">
                <span className="text-8xl">🚀</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={goBack}
              className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 gap-2"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
            
            <button
              onClick={goHome}
              className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 gap-2"
            >
              <HomeIcon size={20} />
              Home Page
            </button>
          </div>
        </div>
        
        {/* Footer Message */}
        <p className="text-gray-500 mt-8">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}