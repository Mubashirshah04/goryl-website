'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Upload, Play, Pause, Square, RotateCcw, Volume2, VolumeX, Settings, Sparkles, Heart, Star, Zap } from 'lucide-react';
import './video-styles.css';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob) => void;
  onClose: () => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<'15s' | '1m' | '3m'>('15s');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxDuration = {
    '15s': 15,
    '1m': 60,
    '3m': 180
  };

  const filters = [
    { id: 'none', name: 'Original', icon: '📷' },
    { id: 'beauty', name: 'Beauty', icon: '✨' },
    { id: 'vintage', name: 'Vintage', icon: '📸' },
    { id: 'dramatic', name: 'Dramatic', icon: '🎭' },
    { id: 'warm', name: 'Warm', icon: '🌅' },
    { id: 'cool', name: 'Cool', icon: '❄️' },
    { id: 'blackwhite', name: 'B&W', icon: '⚫' },
    { id: 'sepia', name: 'Sepia', icon: '🤎' }
  ];

  const sounds = [
    { id: 'trending1', name: 'Trending Sound 1', duration: '0:15' },
    { id: 'trending2', name: 'Trending Sound 2', duration: '0:30' },
    { id: 'trending3', name: 'Trending Sound 3', duration: '0:45' },
    { id: 'trending4', name: 'Trending Sound 4', duration: '1:00' },
    { id: 'trending5', name: 'Trending Sound 5', duration: '1:15' }
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      onVideoRecorded(videoBlob);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);

    // Start timer
    intervalRef.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= maxDuration[selectedDuration]) {
          stopRecording();
        }
        return newDuration;
      });
    }, 1000);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration[selectedDuration]) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const applyFilter = (filterId: string) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    video.style.filter = getFilterStyle(filterId);
  };

  const getFilterStyle = (filterId: string) => {
    switch (filterId) {
      case 'beauty':
        return 'brightness(1.2) contrast(1.1) saturate(1.3)';
      case 'vintage':
        return 'sepia(0.8) contrast(1.2) brightness(1.1)';
      case 'dramatic':
        return 'contrast(1.5) brightness(0.9) saturate(1.4)';
      case 'warm':
        return 'hue-rotate(20deg) saturate(1.2) brightness(1.1)';
      case 'cool':
        return 'hue-rotate(-20deg) saturate(1.1) brightness(1.05)';
      case 'blackwhite':
        return 'grayscale(100%) contrast(1.2)';
      case 'sepia':
        return 'sepia(100%) contrast(1.1)';
      default:
        return 'none';
    }
  };

  useEffect(() => {
    applyFilter(selectedFilter);
  }, [selectedFilter]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {(['15s', '1m', '3m'] as const).map((dur) => (
              <button
                key={dur}
                onClick={() => setSelectedDuration(dur)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDuration === dur
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSounds(!showSounds)}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: getFilterStyle(selectedFilter) }}
        />
        
        {/* Recording Overlay */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              {formatTime(duration)} / {selectedDuration}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {isRecording && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="w-full bg-white/20 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all duration-1000"
                style={{
                  width: `${(duration / maxDuration[selectedDuration]) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex space-x-4 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white'
                }`}
              >
                <span className="text-2xl">{filter.icon}</span>
                <span className="text-xs font-medium">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sounds Panel */}
      {showSounds && (
        <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                className="w-full flex items-center justify-between p-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
              >
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4" />
                  <span className="font-medium">{sound.name}</span>
                </div>
                <span className="text-sm text-gray-300">{sound.duration}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 p-6 bg-black/50 backdrop-blur-sm">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <Play className="w-8 h-8 text-white" />
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              {isPaused ? (
                <Play className="w-6 h-6 text-white" />
              ) : (
                <Pause className="w-6 h-6 text-white" />
              )}
            </button>
            
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Square className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoRecorder;
