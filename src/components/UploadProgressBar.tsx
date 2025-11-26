'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';

interface UploadProgressBarProps {
  isVisible: boolean;
  progress: number; // 0-100
  status: 'uploading' | 'success' | 'error';
  message?: string;
  onClose?: () => void;
}

export function UploadProgressBar({
  isVisible,
  progress,
  status,
  message,
  onClose
}: UploadProgressBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 mt-4"
        >
          <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                status === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : status === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : status === 'error' ? (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                )}
              </div>

              {/* Progress Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium truncate ${
                    status === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : status === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {message || (status === 'success' ? 'Upload complete!' : status === 'error' ? 'Upload failed' : 'Uploading...')}
                  </p>
                  {status === 'uploading' && (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 ml-2">
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
                      status === 'success'
                        ? 'bg-green-500'
                        : status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                  />
                </div>
              </div>

              {/* Close Button (only show on success/error) */}
              {(status === 'success' || status === 'error') && onClose && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

