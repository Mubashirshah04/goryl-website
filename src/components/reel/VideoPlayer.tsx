'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  isPlaying: boolean;
  isMuted: boolean;
  filter: string;
  onPlay: () => void;
  onPause: () => void;
  onMute: () => void;
  onUnmute: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isPlaying,
  isMuted,
  filter,
  onPlay,
  onPause,
  onMute,
  onUnmute
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply filter styles
  const getFilterStyle = (filterName: string) => {
    switch (filterName) {
      case 'none':
        return 'none';
      case 'brightness':
        return 'brightness(1.2)';
      case 'contrast':
        return 'contrast(1.3)';
      case 'saturate':
        return 'saturate(1.4)';
      case 'warm':
        return 'hue-rotate(20deg) saturate(1.2) brightness(1.1)';
      case 'cool':
        return 'hue-rotate(-20deg) saturate(1.1) brightness(1.05)';
      case 'vintage':
        return 'sepia(0.8) contrast(1.2) brightness(1.1)';
      case 'dramatic':
        return 'contrast(1.5) brightness(0.9) saturate(1.4)';
      case 'blackwhite':
        return 'grayscale(100%) contrast(1.2)';
      case 'sepia':
        return 'sepia(100%) contrast(1.1)';
      case 'neon':
        return 'brightness(1.3) contrast(1.4) saturate(1.8) hue-rotate(90deg)';
      case 'sunset':
        return 'hue-rotate(30deg) saturate(1.4) brightness(1.2)';
      case 'ocean':
        return 'hue-rotate(180deg) saturate(1.3) brightness(1.1)';
      case 'forest':
        return 'hue-rotate(120deg) saturate(1.2) brightness(1.05)';
      case 'golden':
        return 'hue-rotate(45deg) saturate(1.3) brightness(1.15)';
      case 'pink':
        return 'hue-rotate(320deg) saturate(1.4) brightness(1.2)';
      case 'blue':
        return 'hue-rotate(240deg) saturate(1.3) brightness(1.1)';
      case 'green':
        return 'hue-rotate(90deg) saturate(1.2) brightness(1.05)';
      default:
        return 'none';
    }
  };

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle mute/unmute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle video load
  const handleLoadedData = () => {
    setIsLoaded(true);
    if (isPlaying) {
      videoRef.current?.play().catch(console.error);
    }
  };

  // Handle video end - loop
  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        preload="auto"
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        onPlay={onPlay}
        onPause={onPause}
        className="w-full h-full object-cover"
        style={{
          filter: getFilterStyle(filter),
          transform: 'scaleX(-1)' // Mirror effect like TikTok
        }}
      />
      
      {/* Background blur effect */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none"
        style={{
          background: `linear-gradient(45deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)`
        }}
      />
    </div>
  );
};

export default VideoPlayer;


