import React from 'react';
import { LockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PermissionDenied = () => {
    const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 p-6">
      <div className="max-w-lg w-full bg-white shadow-2xl rounded-2xl p-8 text-center">
        <LockIcon className="text-red-500 mx-auto mb-4" size={48} />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Permission Denied</h1>
        <p className="text-gray-600 mb-6">
          You are not authorized to open this file. Please contact the Admin to grant permission.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mx-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 hover:scale-105 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-transform">
          Home
        </button>
        <button
          onClick={() => navigate(-1)}
          className="bg-gradient-to-r from-green-700 via-green-500 to-teal-500 hover:scale-105 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-transform">
          Retry
        </button>
      </div>
    </div>
  );
};

export default PermissionDenied;
