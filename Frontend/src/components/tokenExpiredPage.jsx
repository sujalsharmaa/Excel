import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function TokenInvalidPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl text-center backdrop-blur-sm">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500 animate-pulse" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Token Invalid or Expired
        </h1>
        <p className="mt-2 text-gray-600">
          The link you followed is either invalid or has expired.<br />
          Please request a new verification link.
        </p>
        <Link 
          to="/"
          className="mt-6 inline-block rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}