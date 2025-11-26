'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VideoEditor from '@/components/video/VideoEditor';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Upload, Video } from 'lucide-react';

function VideoEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get video URL from search params
    const url = searchParams.get('video');
    const blob = searchParams.get('blob');
    
    if (url) {
      setVideoUrl(decodeURIComponent(url));
      setIsLoading(false);
    } else if (blob) {
      // Handle blob URLs
      setVideoUrl(decodeURIComponent(blob));
      setIsLoading(false);
    } else {
      // No video URL provided, redirect back to upload
      toast.error('No video found to edit');
      router.push('/upload/reel');
    }
  }, [searchParams, router]);

  const handleSave = async (editData: any) => {
    try {
      setIsLoading(true);
      
      // Here you would typically:
      // 1. Apply the filters and text overlays to the video
      // 2. Upload the edited video to your storage
      // 3. Save the reel data to your database
      
      console.log('Saving edited video with data:', editData);
      
      // For now, we'll simulate the save process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Reel saved successfully!');
      
      // Redirect to the reel preview or user's profile
      router.push('/reel/preview?id=' + Date.now());
      
    } catch (error) {
      console.error('Error saving reel:', error);
      toast.error('Failed to save reel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/upload/reel');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Video className="w-16 h-16 text-gray-400 mx-auto" />
          <div className="text-white text-xl">No video found</div>
          <button
            onClick={() => router.push('/upload/reel')}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full text-white font-medium transition-colors"
          >
            Upload Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoEditor
      videoUrl={videoUrl}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

export default function VideoEditorPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    }>
      <VideoEditorContent />
    </Suspense>
  );
}