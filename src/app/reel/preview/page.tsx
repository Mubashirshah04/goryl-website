'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Music, Share } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReelPreviewData {
  videoUrl: string;
  caption: string;
  soundId?: string;
  soundName?: string;
  filter?: string;
  tags: string[];
  category: string;
  thumbnail?: string;
}

function PreviewContent() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ReelPreviewData>({
    videoUrl: '',
    caption: '',
    tags: [],
    category: '',
    soundName: 'Original Sound'
  });

  const handleUpdatePreview = (updates: Partial<ReelPreviewData>) => {
    setPreviewData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!previewData.caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setIsLoading(true);
    try {
      toast.success('Reel published successfully!');
      router.push('/videos');
    } catch (error) {
      console.error('Error publishing reel:', error);
      toast.error('Failed to publish reel');
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewData.videoUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No Video Selected</h1>
          <p className="text-lg mb-6">Please go back and select a video to preview</p>
          <button
            onClick={() => router.back()}
            className="bg-white text-purple-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">Preview Reel</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="bg-gray-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="bg-pink-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="relative">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[9/16] max-w-sm mx-auto">
              <video
                ref={videoRef}
                src={previewData.videoUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      videoRef.current?.pause();
                    } else {
                      videoRef.current?.play();
                    }
                  }}
                  className="bg-black bg-opacity-50 rounded-full p-4 text-white hover:bg-opacity-70 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Mute/Unmute Button */}
              <button
                onClick={() => {
                  if (isMuted) {
                    videoRef.current!.muted = false;
                    setIsMuted(false);
                  } else {
                    videoRef.current!.muted = true;
                    setIsMuted(true);
                  }
                }}
                className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Reel Details */}
          <div className="space-y-6">
            {/* Caption */}
            <div>
              <label className="block text-white font-semibold mb-2">Caption</label>
              <textarea
                value={previewData.caption}
                onChange={(e) => handleUpdatePreview({ caption: e.target.value })}
                placeholder="Write a caption for your reel..."
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl p-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={4}
              />
            </div>

            {/* Sound */}
            <div>
              <label className="block text-white font-semibold mb-2">Sound</label>
              <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Music className="w-5 h-5 text-pink-400" />
                  <span className="text-white">{previewData.soundName || 'Original Sound'}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white font-semibold mb-2">Tags</label>
              <input
                type="text"
                value={previewData.tags.join(', ')}
                onChange={(e) => handleUpdatePreview({ tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                placeholder="Add tags separated by commas..."
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl p-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white font-semibold mb-2">Category</label>
              <select
                value={previewData.category}
                onChange={(e) => handleUpdatePreview({ category: e.target.value })}
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select Category</option>
                <option value="comedy">Comedy</option>
                <option value="dance">Dance</option>
                <option value="music">Music</option>
                <option value="education">Education</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="fashion">Fashion</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReelPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}