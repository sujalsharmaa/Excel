import { useState, useEffect } from "react";
import axios from "axios";

const useUploadFile = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isUploading) {
        event.preventDefault();
        event.returnValue = "File upload in progress. Are you sure you want to leave?";
      }
    };

    const handlePopState = (event) => {
      if (isUploading) {
        event.preventDefault();
        window.history.pushState(null, null, window.location.href);
        alert("File is still uploading. Please wait!");
      }
    };

    if (isUploading) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isUploading]);

  const handleUploadToS3AndLoadFile = async (event) => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];

    try {
      setIsUploading(true); // Start Upload Lock
      setUploadProgress(0);

      // Get a presigned URL from backend
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/uploadToS3AndLoadFile`,
        { filename: file.name, fileType: file.type },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      const { presignedUrl, fileName } = response.data;

      // Upload to S3 with Progress Tracking
      await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      console.log("✅ File uploaded successfully to S3:", fileName);
      setIsUploading(false); // Remove Lock
      window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${fileName}`;
    } catch (err) {
      console.error("❌ Error uploading file to S3:", err);
      setIsUploading(false); // Allow Navigation Again
    }
  };

  return { handleUploadToS3AndLoadFile, uploadProgress, isUploading };
};

export default useUploadFile;
