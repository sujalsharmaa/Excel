import React from "react";
import { HomeIcon, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/useStore";

export const NotFound = () => {
  const navigate = useNavigate();

  const { logout, isLoading } = useAuthStore();

  const goBack = () => {
    // fallback to home if no history exists
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const goHome = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        
        {/* 404 Heading */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[180px] font-extrabold text-gray-200 animate-pulse select-none">
            404
          </h1>

          <div className="relative inset-0 flex items-center justify-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Oops! Page Not Found
            </h2>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
            The page you're looking for may have been removed,
            renamed, or is temporarily unavailable.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            <button
              onClick={goBack}
              className="flex items-center gap-2 rounded-xl bg-gray-800 px-6 py-3 text-white transition-all duration-200 hover:bg-gray-700 hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>

            <button
              onClick={goHome}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-white transition-all duration-200 hover:bg-blue-600 hover:scale-105 active:scale-95"
            >
              <HomeIcon size={20} />
              Home Page
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut size={20} />

              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="pt-6 text-sm text-gray-500">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
};

