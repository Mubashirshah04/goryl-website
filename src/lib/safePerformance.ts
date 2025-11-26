/**
 * Safe Performance Tracing
 *
 * A wrapper around the Firebase Performance API that provides robust error handling
 * and prevents common issues with performance tracing.
 */

// Only import performance service on client side
const performanceService =
  typeof window !== "undefined"
    ? require("./performanceService").default
    : null;

// Check if we're in browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

// In-memory store for active traces
const activeTraces: Record<string, any> = {};

// Trace name constants
export const TRACE_NAMES = {
  PRODUCTS_LOAD: "load_products",
  PRODUCTS_SUBSCRIBE: "subscribe_products",
  PROFILE_LOAD: "load_profile",
  CART_OPERATIONS: "cart_operations",
  WISHLIST_OPERATIONS: "wishlist_operations",
  IMAGE_UPLOAD: "image_upload",
  CHECKOUT_PROCESS: "checkout_process",
};

/**
 * Safely starts a performance trace
 * @param traceName The name of the trace to start
 * @returns Trace instance or null if not available
 */
export const safeStartTrace = (traceName: string) => {
  // Skip if not in browser
  if (!isBrowser) return null;

  try {
    // Check if a trace with this name is already active
    if (activeTraces[traceName]) {
      console.log(`🔄 Trace "${traceName}" already exists, reusing...`);
      return activeTraces[traceName];
    }

    // Skip if performance service not available
    if (
      !performanceService ||
      typeof performanceService.startTrace !== "function"
    ) {
      console.warn("⚠️ Performance service not available");
      return null;
    }

    // Start a new trace with proper error handling
    const trace = performanceService.startTrace(traceName);

    if (trace) {
      // Store reference to the trace
      activeTraces[traceName] = trace;
      console.log(`✅ Safely started trace: ${traceName}`);
    } else {
      console.warn(`⚠️ Failed to create trace: ${traceName}`);
    }

    return trace;
  } catch (error) {
    console.warn(`⚠️ Error starting trace ${traceName}:`, error);
    return null;
  }
};

/**
 * Safely stops a performance trace
 * @param traceNameOrInstance The name of the trace or the trace instance to stop
 */
export const safeStopTrace = (traceNameOrInstance: string | any) => {
  // Skip if not in browser
  if (!isBrowser) return;

  try {
    // Skip if performance service not available
    if (
      !performanceService ||
      typeof performanceService.stopTrace !== "function"
    ) {
      console.warn("⚠️ Performance service not available");
      return;
    }

    // If given a string, look up the trace by name
    let traceToStop: any = null;
    let traceName: string = "";

    if (typeof traceNameOrInstance === "string") {
      traceName = traceNameOrInstance;
      traceToStop = activeTraces[traceName];

      if (!traceToStop) {
        console.log(`⚠️ No active trace found for: ${traceName}`);
        return;
      }
    } else if (traceNameOrInstance && typeof traceNameOrInstance === "object") {
      traceToStop = traceNameOrInstance;
      // Try to find the trace name from our registry
      for (const [name, instance] of Object.entries(activeTraces)) {
        if (instance === traceToStop) {
          traceName = name;
          break;
        }
      }
    } else {
      console.warn("⚠️ Invalid trace reference provided to safeStopTrace");
      return;
    }

    // Stop the trace with proper error handling
    performanceService.stopTrace(traceToStop);

    // Remove from active traces
    if (traceName) {
      delete activeTraces[traceName];
    }

    console.log(`✅ Safely stopped trace: ${traceName || "unknown"}`);
  } catch (error) {
    console.warn(`⚠️ Error stopping trace:`, error);
  }
};

/**
 * Log a performance event
 * @param eventName Name of the event
 * @param parameters Optional parameters for the event
 */
export const safeLogEvent = (eventName: string, parameters?: any) => {
  // Skip if not in browser
  if (!isBrowser) return;

  try {
    // Skip if performance service not available
    if (
      !performanceService ||
      typeof performanceService.logPerformanceEvent !== "function"
    ) {
      return;
    }

    performanceService.logPerformanceEvent(eventName, parameters);
  } catch (error) {
    console.warn(`⚠️ Error logging performance event ${eventName}:`, error);
  }
};

/**
 * Measures a function's execution time with automatic tracing
 * @param funcName Name to use for the trace
 * @param func Function to measure
 * @returns The result of the function
 */
export async function measureAsync<T>(
  funcName: string,
  func: () => Promise<T>,
): Promise<T> {
  const trace = safeStartTrace(`func_${funcName}`);
  try {
    const result = await func();
    safeStopTrace(trace);
    return result;
  } catch (error) {
    safeStopTrace(trace);
    throw error;
  }
}

/**
 * Safely measures execution time of a synchronous function
 * @param funcName Name to use for the trace
 * @param func Function to measure
 * @returns The result of the function
 */
export function measureSync<T>(funcName: string, func: () => T): T {
  const trace = safeStartTrace(`func_${funcName}`);
  try {
    const result = func();
    safeStopTrace(trace);
    return result;
  } catch (error) {
    safeStopTrace(trace);
    throw error;
  }
}

/**
 * Safely initializes performance monitoring
 */
export const safeInitialize = () => {
  // Skip if not in browser
  if (!isBrowser) return;

  try {
    // Skip if performance service not available
    if (
      !performanceService ||
      typeof performanceService.initializePerformance !== "function"
    ) {
      console.warn("⚠️ Performance service not available for initialization");
      return;
    }

    performanceService.initializePerformance();
    console.log("✅ Safely initialized performance monitoring");
  } catch (error) {
    console.warn("⚠️ Failed to initialize performance monitoring:", error);
  }
};

/**
 * Clears all active traces
 * Useful when navigating between pages or components
 */
export const clearAllTraces = () => {
  // Skip if not in browser
  if (!isBrowser) return;

  try {
    // Skip if performance service not available but still clear local registry
    const hasPerformanceService =
      performanceService && typeof performanceService.stopTrace === "function";

    // Stop all active traces
    Object.entries(activeTraces).forEach(([name, trace]) => {
      try {
        if (hasPerformanceService) {
          performanceService.stopTrace(trace);
          console.log(`🧹 Cleaned up trace: ${name}`);
        }
      } catch (e) {
        // Ignore errors when cleaning up
      }
    });

    // Clear the active traces object
    Object.keys(activeTraces).forEach((key) => {
      delete activeTraces[key];
    });
  } catch (error) {
    console.warn("⚠️ Error clearing traces:", error);
  }
};

// Export a default object for easy imports
const safePerformance = {
  initialize: safeInitialize,
  startTrace: safeStartTrace,
  stopTrace: safeStopTrace,
  logEvent: safeLogEvent,
  measureAsync,
  measureSync,
  clearAllTraces,
  TRACE_NAMES,
};

export default safePerformance;
