import React from "react";

const LoadingSpinner = ({
  message = "Loading...",
  size = 96,
  primaryColor = "blue-500",
  secondaryColor = "purple-500",
}) => {
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-0 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Dual Spinning Rings */}
        <div className="relative">
          <div
            className={`w-${size / 4} h-${size / 4} border-8 border-${primaryColor} rounded-full animate-spin border-t-transparent`}
          ></div>
          <div
            className={`absolute top-0 left-0 w-${size / 4} h-${size / 4} border-8 border-${secondaryColor} rounded-full animate-spin border-t-transparent opacity-70`}
            style={{ animationDirection: "reverse" }}
          ></div>
        </div>

        {/* Loading Text */}
        <div
          role="status"
          aria-live="polite"
          className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
        >
          {message}
        </div>

        {/* Bouncing Dots */}
        <div className="flex space-x-2">
          {["blue-500", "purple-500", "pink-500"].map((color, index) => (
            <div
              key={index}
              className={`w-3 h-3 bg-${color} rounded-full animate-bounce`}
              style={{ animationDelay: `${index * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
