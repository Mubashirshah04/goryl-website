"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Import safePerformance only on client side
const safePerformance =
  typeof window !== "undefined"
    ? require("@/lib/safePerformance").default
    : null;

/**
 * TraceCleanup Component
 *
 * This component adds event listeners to clean up any active performance
 * traces when the user navigates away from the site or closes the browser.
 *
 * It should be placed at the root layout to ensure it's always present.
 */
// Only render this component on the client side
function TraceCleanup() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect will only run on the client
    setIsClient(true);
  }, []);

  // Only run the main effect if we're on the client side
  useEffect(() => {
    if (!isClient || !safePerformance) return;

    try {
      // Handle cleanup when page is about to unload
      const handleBeforeUnload = () => {
        if (
          safePerformance &&
          typeof safePerformance.clearAllTraces === "function"
        ) {
          safePerformance.clearAllTraces();
        }
      };

      // Handle cleanup when focus is lost (tab switching)
      const handleVisibilityChange = () => {
        if (document && document.visibilityState === "hidden") {
          if (
            safePerformance &&
            typeof safePerformance.clearAllTraces === "function"
          ) {
            safePerformance.clearAllTraces();
          }
        }
      };

      // Add event listeners safely
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", handleBeforeUnload);
      }

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }

      // Run clearAllTraces on mount to clean up any lingering traces
      if (
        safePerformance &&
        typeof safePerformance.clearAllTraces === "function"
      ) {
        safePerformance.clearAllTraces();
      }

      // Clean up event listeners when component unmounts
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        }

        if (typeof document !== "undefined") {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
        }

        if (
          safePerformance &&
          typeof safePerformance.clearAllTraces === "function"
        ) {
          safePerformance.clearAllTraces();
        }
      };
    } catch (error) {
      console.warn("Error in TraceCleanup:", error);
    }
  }, [isClient]);

  // This component doesn't render anything visible
  return null;
}

// Use dynamic import with SSR disabled to ensure it only runs on client
export default dynamic(() => Promise.resolve(TraceCleanup), {
  ssr: false,
});
