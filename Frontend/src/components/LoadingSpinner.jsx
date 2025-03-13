import React from "react";
import { LoaderCircle } from "lucide-react";


const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white/70  z-50 flex flex-col items-center justify-center gap-4">
      {/* Spinning Loader */}
      <LoaderCircle className="w-16 h-16 text-blue-500 animate-spin" />
      
      {/* Loading Text */}
      <p className="text-lg font-semibold text-gray-800">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
