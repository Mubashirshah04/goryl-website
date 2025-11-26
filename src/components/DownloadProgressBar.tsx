'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2 } from 'lucide-react';

interface DownloadProgressBarProps {
  isVisible: boolean;
  progress: number; // 0-100
  fileName?: string;
  onComplete?: () => void;
}

export function DownloadProgressBar({
  isVisible,
  progress,
  fileName = 'video',
  onComplete
}: DownloadProgressBarProps) {
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 2000); // Show complete message for 2 seconds
    }
  }, [progress, isComplete, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[110] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isComplete 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              )}
            </div>

            {/* Progress Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium truncate ${
                  isComplete 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {isComplete ? 'Downloaded to Gallery' : `Downloading ${fileName}...`}
                </p>
                {!isComplete && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isComplete 
                      ? 'bg-green-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

