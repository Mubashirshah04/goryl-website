'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, Square, X, RotateCcw, FlipHorizontal2, Sparkles, Timer, Edit3 } from 'lucide-react';
import './video-styles.css';

interface DirectVideoRecorderProps {
  onVideoComplete: (videoBlob: Blob) => void;
  onClose: () => void;
  onNext?: () => void;
}

const DirectVideoRecorder: React.FC<DirectVideoRecorderProps> = ({ onVideoComplete, onClose, onNext }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<'15s' | '1m' | '3m'>('15s');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [selectedLayout, setSelectedLayout] = useState('full');
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);
  const [showTrimPanel, setShowTrimPanel] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [showAddMediaPanel, setShowAddMediaPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxDuration = {
    '15s': 600, // 10 minutes
    '1m': 60,   // 60 seconds
    '3m': 15    // 15 seconds
  };

  const filters = [
    { id: 'none', name: 'Original', icon: '📷' },
    { id: 'beauty', name: 'Beauty', icon: '✨' },
    { id: 'vintage', name: 'Vintage', icon: '📸' },
    { id: 'dramatic', name: 'Dramatic', icon: '🎭' },
    { id: 'warm', name: 'Warm', icon: '🌅' },
    { id: 'cool', name: 'Cool', icon: '❄️' },
    { id: 'blackwhite', name: 'B&W', icon: '⚫' },
    { id: 'sepia', name: 'Sepia', icon: '🤎' },
    { id: 'neon', name: 'Neon', icon: '💜' },
    { id: 'sunset', name: 'Sunset', icon: '🌇' },
    { id: 'ocean', name: 'Ocean', icon: '🌊' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'golden', name: 'Golden', icon: '🏆' },
    { id: 'pink', name: 'Pink', icon: '🌸' },
    { id: 'blue', name: 'Blue', icon: '💙' },
    { id: 'green', name: 'Green', icon: '💚' }
  ];

  const speedOptions = [
    { value: 0.3, label: '0.3x', icon: '🐌' },
    { value: 0.5, label: '0.5x', icon: '🚶' },
    { value: 1, label: '1x', icon: '🏃' },
    { value: 2, label: '2x', icon: '🚀' },
    { value: 3, label: '3x', icon: '⚡' }
  ];

  const layoutOptions = [
    { id: 'full', name: 'Full', icon: '📱' },
    { id: 'square', name: 'Square', icon: '⬜' },
    { id: 'vertical', name: 'Vertical', icon: '📏' },
    { id: 'horizontal', name: 'Horizontal', icon: '📐' }
  ];

  const timerOptions = [3, 5, 10, 15, 30, 60];


  useEffect(() => {
    startCamera(isFrontCamera ? 'user' : 'environment');
    return () => {
      stopCamera();
    };
  }, [isFrontCamera]);

  // Apply mirror effect when camera changes
  useEffect(() => {
    if (videoRef.current) {
      if (isFrontCamera) {
        videoRef.current.style.transform = 'scaleX(-1)';
      } else {
        videoRef.current.style.transform = 'scaleX(1)';
      }
    }
  }, [isFrontCamera]);

  const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Fix camera mirror for front camera
        if (facingMode === 'user') {
          videoRef.current.style.transform = 'scaleX(-1)';
        } else {
          videoRef.current.style.transform = 'scaleX(1)';
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const flipCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    startCamera(!isFrontCamera ? 'environment' : 'user');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setRecordedVideo(file);
      setRecordingComplete(true);
    }
  };



  // Timer functionality
  const startTimer = (seconds: number = 3) => {
    setShowTimer(true);
    setTimer(seconds);
    
    const countdown = setInterval(() => {
      setTimer(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(countdown);
          setShowTimer(false);
          // Start recording after a small delay
          setTimeout(() => {
            startRecording();
          }, 200);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const showTimerOptions = () => {
    setShowTimer(!showTimer);
  };

  const selectTimer = (seconds: number) => {
    setShowTimer(false);
    startTimer(seconds);
  };

  // Trim functionality
  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoPause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };


  // Auto-play video when recordingComplete is true
  useEffect(() => {
    if (recordingComplete && recordedVideo) {
      setVideoLoading(false); // Don't show loading, let video handle it
      setVideoError(false);
    }
  }, [recordingComplete, recordedVideo]);

  const applyTrim = () => {
    if (videoRef.current && recordedVideo) {
      const startTime = (trimStart / 100) * videoDuration;
      const endTime = (trimEnd / 100) * videoDuration;
      
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }, (endTime - startTime) * 1000);
    }
  };

  const handleTrimChange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  };


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const videoStream = streamRef.current;
    const mediaRecorder = new MediaRecorder(videoStream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedVideo(videoBlob);
      setRecordingComplete(true);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = getFilterStyle(selectedFilter);
    }
  }, [selectedFilter]);

  if (recordingComplete) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header with Back and Close */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button 
            onClick={() => {
              setRecordingComplete(false);
              setRecordedVideo(null);
              startCamera(isFrontCamera ? 'user' : 'environment');
            }}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {recordedVideo ? (
            videoError ? (
              <div className="flex flex-col items-center justify-center text-white text-lg space-y-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span>Video failed to load</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setVideoError(false);
                      if (videoRef.current) {
                        videoRef.current.load();
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      console.log('Video blob:', recordedVideo);
                      console.log('Video URL:', URL.createObjectURL(recordedVideo));
                      console.log('Video ref:', videoRef.current);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Debug
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={videoRef}
                  src={URL.createObjectURL(recordedVideo)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  onLoadedMetadata={handleVideoLoad}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover"
                  style={{ 
                    filter: getFilterStyle(selectedFilter),
                    transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)'
                  }}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={handleVideoPlay}
                    className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleVideoPause}
                    className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleVideoMute}
                    className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  </button>
                </div>
                
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-white text-lg space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span>No video available</span>
            </div>
          )}
        </div>

        {/* Right Side Tools */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
          {/* Settings */}
          <button 
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
          
          {/* Share */}
          <button 
            onClick={() => setShowSharePanel(!showSharePanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
          
          {/* Trim */}
          <button 
            onClick={() => setShowTrimPanel(!showTrimPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,15h2v2c0,1.1-0.9,2-2,2H7c-1.1,0-2-0.9-2-2V7c0-1.1,0.9-2,2-2h2V3H7C5.9,3,5,3.9,5,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2v-2h-2V15z M14,3v2h2.59l-9.83,9.83c-0.39,0.39-0.39,1.02,0,1.41 c0.39,0.39,1.02,0.39,1.41,0L18,6.41V9h2V3H14z"/>
            </svg>
          </button>
          
          {/* Video */}
          <button 
            onClick={() => setShowVideoPanel(!showVideoPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <Play className="w-6 h-6" />
          </button>
          
          {/* Text */}
          <button 
            onClick={() => setShowTextPanel(!showTextPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <span className="text-sm font-bold">Aa</span>
          </button>
          
          {/* Sticker */}
          <button 
            onClick={() => setShowStickerPanel(!showStickerPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z M12,17.5c0.83,0,1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5s-1.5,0.67-1.5,1.5S11.17,17.5,12,17.5z M15.5,6L9,12.5l-2.5-2.5L5,12.5l4,4l8.5-8.5L15.5,6z"/>
            </svg>
          </button>
          
          {/* Effects */}
          <button 
            onClick={() => setShowEffectsPanel(!showEffectsPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <Sparkles className="w-6 h-6" />
          </button>
          
          {/* Tag */}
          <button 
            onClick={() => setShowTagPanel(!showTagPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-6h2V17z M13,9h-2V7h2V9z"/>
            </svg>
          </button>
          
          {/* Add Media */}
          <button 
            onClick={() => setShowAddMediaPanel(!showAddMediaPanel)}
            className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z"/>
            </svg>
          </button>
          
          {/* More */}
          <button className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,8,12,8z M12,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,10,12,10z M12,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,16,12,16z"/>
            </svg>
          </button>
        </div>

        {/* Trim Panel */}
        {showTrimPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Trim Video</h3>
              <button
                onClick={() => setShowTrimPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Trim Slider */}
              <div className="relative">
                <div className="w-full h-2 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-white rounded-full"
                    style={{ width: `${trimEnd - trimStart}%`, marginLeft: `${trimStart}%` }}
                  />
                </div>
                
                {/* Start Handle */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trimStart}
                  onChange={(e) => handleTrimChange(Number(e.target.value), trimEnd)}
                  className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                />
                
                {/* End Handle */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trimEnd}
                  onChange={(e) => handleTrimChange(trimStart, Number(e.target.value))}
                  className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                />
              </div>
              
              {/* Time Display */}
              <div className="flex justify-between text-white text-sm">
                <span>{Math.floor((trimStart / 100) * videoDuration)}s</span>
                <span>{Math.floor((trimEnd / 100) * videoDuration)}s</span>
              </div>
              
              {/* Apply Button */}
              <button
                onClick={() => {
                  applyTrim();
                  setShowTrimPanel(false);
                }}
                className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Apply Trim
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            {/* Your Story Button */}
            <button className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">U</span>
              </div>
              <span className="text-sm font-medium">Your Story</span>
            </button>
            
            {/* Next Button */}
            <button
              onClick={() => {
                if (recordedVideo) {
                  onVideoComplete(recordedVideo);
                  if (onNext) onNext();
                }
              }}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>

        {/* Text Panel */}
        {showTextPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Add Text</h3>
              <button 
                onClick={() => setShowTextPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your text..."
                className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              />
              
              <div className="flex space-x-4">
                <button className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                  Add Text
                </button>
                <button 
                  onClick={() => setShowTextPanel(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticker Panel */}
        {showStickerPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Add Sticker</h3>
              <button 
                onClick={() => setShowStickerPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {['😀', '😍', '🔥', '💯', '🎉', '❤️', '👍', '👏'].map((sticker, index) => (
                <button
                  key={index}
                  className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-700 transition-colors"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Effects Panel */}
        {showEffectsPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Effects</h3>
              <button 
                onClick={() => setShowEffectsPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {['None', 'Vintage', 'B&W', 'Sepia', 'Cool', 'Warm'].map((effect, index) => (
                <button
                  key={index}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettingsPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Settings</h3>
              <button 
                onClick={() => setShowSettingsPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Quality</span>
                <select className="bg-gray-800 text-white p-2 rounded">
                  <option>1080p</option>
                  <option>720p</option>
                  <option>480p</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Frame Rate</span>
                <select className="bg-gray-800 text-white p-2 rounded">
                  <option>30fps</option>
                  <option>60fps</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Share Panel */}
        {showSharePanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Share</h3>
              <button 
                onClick={() => setShowSharePanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Instagram
              </button>
              <button className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                TikTok
              </button>
              <button className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                WhatsApp
              </button>
              <button className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Download
              </button>
            </div>
          </div>
        )}

        {/* Video Panel */}
        {showVideoPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Video Options</h3>
              <button 
                onClick={() => setShowVideoPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleVideoPlay}
                className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Play
              </button>
              <button 
                onClick={handleVideoPause}
                className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Pause
              </button>
              <button 
                onClick={handleVideoMute}
                className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Mute/Unmute
              </button>
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.requestFullscreen();
                  }
                }}
                className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* Tag Panel */}
        {showTagPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Add Tag</h3>
              <button 
                onClick={() => setShowTagPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter tag..."
                className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              />
              
              <div className="flex space-x-4">
                <button className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                  Add Tag
                </button>
                <button 
                  onClick={() => setShowTagPanel(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Media Panel */}
        {showAddMediaPanel && (
          <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Add Media</h3>
              <button 
                onClick={() => setShowAddMediaPanel(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Photo
              </button>
              <button className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Video
              </button>
              <button className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Audio
              </button>
              <button className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                GIF
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main Camera Interface */}
      <>
          {/* TikTok-style Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        {/* Left - Close button */}
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
                {/* Center - Duration Selector */}
                <div className="flex bg-black/50 rounded-full p-1">
                  {(['15s', '1m', '3m'] as const).map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedDuration === dur 
                          ? 'bg-white text-black' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
        
        {/* Right - Time */}
        <div className="text-white text-sm font-medium">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
               style={{ 
                 filter: `${getFilterStyle(selectedFilter)} ${beautyFilter ? 'brightness(1.1) contrast(1.1) saturate(1.2)' : ''}`,
                 transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)'
               }}
             />
        
         {/* Timer Display */}
         {showTimer && timer > 0 && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
             <div className="text-8xl font-bold text-white animate-pulse">
               {timer}
             </div>
           </div>
         )}

         {/* Right Side Controls - TikTok Style */}
         <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
           
           {/* Timer */}
           <button 
             onClick={showTimerOptions}
             className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
           >
             <Timer className="w-6 h-6" />
           </button>
           
           {/* Layout */}
           <button 
             onClick={() => setShowLayoutPanel(!showLayoutPanel)}
             className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
           >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
               <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h4v4H7V7zm6 0h4v4h-4V7zM7 13h4v4H7v-4zm6 0h4v4h-4v-4z"/>
             </svg>
           </button>
           
           {/* Beautify */}
           <button 
             onClick={() => setBeautyFilter(!beautyFilter)}
             className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
               beautyFilter 
                 ? 'bg-pink-500' 
                 : 'bg-black/50 hover:bg-black/70'
             }`}
           >
             <Sparkles className="w-6 h-6" />
           </button>
           
           {/* Filters */}
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
           >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
               <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
             </svg>
           </button>
           
           {/* Speed */}
           <button 
             onClick={() => setShowSpeedPanel(!showSpeedPanel)}
             className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
           >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
               <path d="M13.5 5.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM9.5 5.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM17.5 5.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM19 12v7H5v-7h14m0-2H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"/>
             </svg>
           </button>
           
           {/* Flip Camera */}
           <button 
             onClick={flipCamera}
             className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
           >
             <FlipHorizontal2 className="w-6 h-6" />
           </button>
         </div>
        
        {/* Recording Overlay */}
        {isRecording && (
          <div className="absolute top-20 left-4 flex items-center space-x-2">
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

       {/* Timer Panel */}
       {showTimer && (
         <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-white font-semibold">Select Timer</h3>
             <button
               onClick={() => setShowTimer(false)}
               className="text-white hover:text-gray-300 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
           <div className="grid grid-cols-3 gap-4">
             {timerOptions.map((seconds) => (
               <button
                 key={seconds}
                 onClick={() => selectTimer(seconds)}
                 className="px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
               >
                 {seconds}s
               </button>
             ))}
           </div>
         </div>
       )}

       {/* Speed Panel */}
       {showSpeedPanel && (
         <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-white font-semibold">Select Speed</h3>
             <button
               onClick={() => setShowSpeedPanel(false)}
               className="text-white hover:text-gray-300 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
           <div className="flex space-x-4 overflow-x-auto">
             {speedOptions.map((option) => (
               <button
                 key={option.value}
                 onClick={() => setSelectedSpeed(option.value)}
                 className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-colors ${
                   selectedSpeed === option.value
                     ? 'bg-white text-black'
                     : 'bg-white/20 text-white'
                 }`}
               >
                 <span className="text-2xl">{option.icon}</span>
                 <span className="text-xs font-medium">{option.label}</span>
               </button>
             ))}
           </div>
         </div>
       )}

       {/* Layout Panel */}
       {showLayoutPanel && (
         <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-white font-semibold">Select Layout</h3>
             <button
               onClick={() => setShowLayoutPanel(false)}
               className="text-white hover:text-gray-300 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
           <div className="flex space-x-4 overflow-x-auto">
             {layoutOptions.map((layout) => (
               <button
                 key={layout.id}
                 onClick={() => setSelectedLayout(layout.id)}
                 className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-colors ${
                   selectedLayout === layout.id
                     ? 'bg-white text-black'
                     : 'bg-white/20 text-white'
                 }`}
               >
                 <span className="text-2xl">{layout.icon}</span>
                 <span className="text-xs font-medium">{layout.name}</span>
               </button>
             ))}
           </div>
         </div>
       )}


       {/* Filters Panel */}
       {showFilters && (
         <div className="absolute bottom-32 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-white font-semibold">Select Filter</h3>
             <button
               onClick={() => setShowFilters(false)}
               className="text-white hover:text-gray-300 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
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



       {/* TikTok-style Bottom Controls */}
       <div className="absolute bottom-0 left-0 right-0 p-4">

        {/* Bottom Controls Row */}
        <div className="flex items-center justify-between">
           {/* Left - Gallery */}
           <div className="flex items-center space-x-3">
             <input
               type="file"
               accept="video/*"
               onChange={handleFileSelect}
               className="hidden"
               id="gallery-video-input"
             />
             <label
               htmlFor="gallery-video-input"
               className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
             >
               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
               </svg>
             </label>
           </div>

          {/* Center - Record Button */}
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors border-4 border-white"
              >
                <div className="w-8 h-8 bg-white rounded-full"></div>
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
                  className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors border-4 border-white"
                >
                  <Square className="w-8 h-8 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Right - Upload */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      </>

    </div>
  );
};

export default DirectVideoRecorder;

