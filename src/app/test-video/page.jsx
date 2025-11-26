'use client';

import React, { useState } from 'react';
import VideoRecorder from '@/components/video/VideoRecorder';
import VideoEditor from '@/components/video/VideoEditor';

export default function TestVideoPage() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);

  const handleVideoRecorded = (videoBlob) => {
    console.log('✅ Video recorded:', videoBlob);
    setRecordedVideo(videoBlob);
    setShowRecorder(false);
    setShowEditor(true);
  };

  const handleVideoEdited = (editedBlob) => {
    console.log('✅ Video edited:', editedBlob);
    setRecordedVideo(editedBlob);
    setShowEditor(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Components Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Video Recorder</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Test the TikTok-style video recorder</p>
            <button
              onClick={() => setShowRecorder(true)}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700"
            >
              Open Video Recorder
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Video Editor</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Test the video editor (requires recorded video)</p>
            <button
              onClick={() => setShowEditor(true)}
              disabled={!recordedVideo}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Open Video Editor
            </button>
          </div>
        </div>

        {recordedVideo && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recorded Video</h3>
            <video
              src={URL.createObjectURL(recordedVideo)}
              controls
              className="w-full max-w-md rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Size: {(recordedVideo.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {/* Video Recorder Modal */}
      {showRecorder && (
        <VideoRecorder
          onVideoRecorded={handleVideoRecorded}
          onClose={() => setShowRecorder(false)}
        />
      )}

      {/* Video Editor Modal */}
      {showEditor && recordedVideo && (
        <VideoEditor
          videoBlob={recordedVideo}
          onSave={handleVideoEdited}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
