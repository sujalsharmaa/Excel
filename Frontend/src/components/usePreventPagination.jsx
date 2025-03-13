import { useEffect } from "react";
import { useSpreadsheetStore } from "@/Store/useStore.js";

const usePreventNavigation = () => {
  const { isUploading } = useSpreadsheetStore();

  // Define handlers outside useEffect to avoid redefinition
  const preventNavigation = (event) => {
    if (isUploading) {
      event.preventDefault();
      event.returnValue = "File upload in progress. Are you sure you want to leave?";
    }
  };

  const handlePopState = (event) => {
    if (isUploading) {
      event.preventDefault();
      alert("File is still uploading. Please wait!");
      window.history.pushState(null, "", window.location.href);
    }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", preventNavigation);
    window.addEventListener("popstate", handlePopState);

    if (isUploading) {
      window.history.pushState(null, "", window.location.href);
    }

    return () => {
      window.removeEventListener("beforeunload", preventNavigation);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isUploading]);

};

export default usePreventNavigation;
