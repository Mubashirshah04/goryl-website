'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react';

import { toast } from 'sonner';
import WebRTCService, { CallOffer } from '@/lib/webrtc';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    photoURL: string;
  };
  isIncoming?: boolean;
  callType: 'video' | 'audio';
  callData?: CallOffer;
  currentUserId: string;
}

export default function VideoCall({ 
  isOpen, 
  onClose, 
  user, 
  isIncoming = false, 
  callType,
  callData,
  currentUserId
}: VideoCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [webrtcService] = useState(() => new WebRTCService());
  const [callStatus, setCallStatus] = useState('Initializing call...');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [localStreamReady, setLocalStreamReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(0);

  // Start call timer
  useEffect(() => {
    if (isConnected) {
      callStartTime.current = Date.now();
      const timer = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  // Setup WebRTC callbacks with enhanced status updates
  useEffect(() => {
    // Enhanced remote stream callback
    webrtcService.onRemoteStream = (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
      setConnectionStatus('connected');
      setCallStatus('Connected');
      callStartTime.current = Date.now();
      toast.success('🎉 Call connected! You can now see and hear each other!');
    };

    // Enhanced connection state callback with quality monitoring
    webrtcService.onConnectionStateChange = (state: RTCPeerConnectionState) => {
      console.log('Connection state changed:', state);
      if (state === 'connected') {
        setConnectionStatus('connected');
        setIsConnected(true);
        setConnectionQuality('excellent');
        setCallStatus('Connected');
      } else if (state === 'connecting') {
        setConnectionStatus('connecting');
        setCallStatus('Connecting...');
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setConnectionQuality('poor');
        setCallStatus('Connection lost');
      }
    };

    // Local stream callback for immediate feedback
    webrtcService.onLocalStream = (stream: MediaStream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalStreamReady(true);
      toast.success('📹 Camera and microphone ready!');
    };

    // Call status updates
    webrtcService.onCallStatusChange = (status: string) => {
      setCallStatus(status);
    };

    return () => {
      webrtcService.onRemoteStream = null;
      webrtcService.onConnectionStateChange = null;
      webrtcService.onLocalStream = null;
      webrtcService.onCallStatusChange = null;
    };
  }, [webrtcService]);

  // Handle incoming/outgoing call
  useEffect(() => {
    if (!isOpen) return;

    const initializeCall = async () => {
      try {
        if (isIncoming && callData) {
          // This is an incoming call, wait for user to accept
          console.log('Incoming call from:', callData.callerName);
        } else {
          // This is an outgoing call
          console.log('Starting outgoing call to:', user.name);
          await webrtcService.startCall(user.id, callType, currentUserId, user.photoURL);
        }

        // Get local stream and show it
        const localStream = webrtcService.getLocalStream();
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
      } catch (error) {
        console.error('Error initializing call:', error);
        toast.error('Failed to initialize call');
        setConnectionStatus('disconnected');
      }
    };

    initializeCall();
  }, [isOpen, isIncoming, callData, user, callType, currentUserId, webrtcService]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await webrtcService.endCall();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      toast.info('Call ended');
      onClose();
    } catch (error) {
      console.error('Error ending call:', error);
      onClose();
    }
  };

  const handleAcceptCall = async () => {
    if (!callData) return;
    
    try {
      await webrtcService.answerCall(callData.id, localVideoRef.current || undefined);
      toast.success('Call accepted!');
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
    }
  };

  const handleRejectCall = async () => {
    if (callData) {
      await webrtcService.rejectCall(callData.id);
    }
    toast.info('Call rejected');
    onClose();
  };

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
    toast.info(enabled ? 'Camera turned on' : 'Camera turned off');
  };

  const toggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioEnabled(enabled);
    toast.info(enabled ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    toast.info(isSpeakerEnabled ? 'Speaker off' : 'Speaker on');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`w-full h-full flex flex-col ${isFullscreen ? '' : 'max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden'}`}
        >
          {/* Call Header */}
          <div className="bg-gray-900/90 backdrop-blur-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name.trim())}`}
                  alt={user.name}
                  width="48"
                  height="48"
                  className="rounded-full ring-2 ring-white/20"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                    }`} />
                    <p className="text-gray-300 text-sm">
                      {connectionStatus === 'connected' ? (
                        <>
                          <span className="text-green-400">{formatDuration(callDuration)}</span>
                          <span className="ml-2 text-xs opacity-75">
                            • {connectionQuality === 'excellent' ? '🔋 HD' : connectionQuality === 'good' ? '🔊 SD' : '🔉 Low'}
                          </span>
                        </>
                      ) : (
                        <span className="animate-pulse">{callStatus}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video/Audio Content */}
          <div className="flex-1 relative bg-gray-900">
            {callType === 'video' ? (
              <>
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                
                {/* Local Video (Picture in Picture) */}
                {isVideoEnabled && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
                  >
                    <video
                      ref={localVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  </motion.div>
                )}

                {/* User Avatar Fallback when not connected */}
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                    <div className="text-center">
                      <img
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name.trim())}`}
                        alt={user.name}
                        width="120"
                        height="120"
                        className="rounded-full mx-auto mb-4 ring-4 ring-white/20"
                      />
                      <h3 className="text-white text-2xl font-bold mb-2">{user.name}</h3>
                      <p className="text-white/70">
                        {isIncoming ? 'Incoming call...' : 
                         connectionStatus === 'connecting' ? 'Connecting...' : 'Calling...'}
                      </p>
                      {connectionStatus === 'connecting' && (
                        <div className="mt-4">
                          <div className="animate-pulse flex space-x-1 justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Audio Only Mode
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900 to-blue-900">
                <div className="text-center">
                  <div className="relative mb-6">
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      width="160"
                      height="160"
                      className="rounded-full mx-auto ring-4 ring-white/20"
                    />
                    {isConnected && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-4 border-4 border-green-500 rounded-full opacity-50"
                      />
                    )}
                  </div>
                  <h3 className="text-white text-3xl font-bold mb-2">{user.name}</h3>
                  <p className="text-white/70 text-xl">
                    {isIncoming ? 'Incoming voice call...' : 
                     isConnected ? 'Voice call in progress' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="bg-gray-900/90 backdrop-blur-xl p-6">
            <div className="flex items-center justify-center space-x-4">
              {isIncoming && !isConnected ? (
                // Incoming call controls
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRejectCall}
                    className="p-4 bg-red-500 text-white rounded-full shadow-2xl hover:bg-red-600 transition-colors"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAcceptCall}
                    className="p-4 bg-green-500 text-white rounded-full shadow-2xl hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                  </motion.button>
                </>
              ) : (
                // Active call controls
                <>
                  {callType === 'video' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVideo}
                      className={`p-3 rounded-full shadow-lg transition-colors ${
                        isVideoEnabled 
                          ? 'bg-white/20 text-white hover:bg-white/30' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleAudio}
                    className={`p-3 rounded-full shadow-lg transition-colors ${
                      isAudioEnabled 
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSpeaker}
                    className={`p-3 rounded-full shadow-lg transition-colors ${
                      isSpeakerEnabled 
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {isSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleEndCall}
                    className="p-4 bg-red-500 text-white rounded-full shadow-2xl hover:bg-red-600 transition-colors"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}