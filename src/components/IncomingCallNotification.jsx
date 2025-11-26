'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { toast } from 'sonner';
export default function IncomingCallNotification({ callData, onAccept, onReject }) {
    const [isRinging, setIsRinging] = useState(false);
    useEffect(() => {
        if (callData) {
            setIsRinging(true);
            // Play ringtone (you can add actual audio file)
            const playRingtone = () => {
                try {
                    const audio = new Audio('/sounds/ringtone.mp3');
                    audio.loop = true;
                    audio.play().catch(() => {
                        // Handle autoplay restrictions
                        console.log('Could not play ringtone due to browser restrictions');
                    });
                    return audio;
                }
                catch (error) {
                    console.log('Ringtone file not found, using system notification');
                    return null;
                }
            };
            const audioElement = playRingtone();
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Incoming ${callData.callType} call`, {
                    body: `${callData.callerName} is calling you`,
                    icon: callData.callerPhoto,
                    tag: 'incoming-call'
                });
            }
            // Auto-reject after 30 seconds
            const autoRejectTimer = setTimeout(() => {
                if (audioElement) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
                onReject();
                toast.info('Call missed');
            }, 30000);
            return () => {
                clearTimeout(autoRejectTimer);
                if (audioElement) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
            };
        }
    }, [callData, onReject]);
    if (!callData)
        return null;
    return (<AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          {/* Incoming Call Header */}
          <div className="text-center mb-8">
            <p className="text-white/70 text-sm mb-2">
              Incoming {callData.callType} call
            </p>
            <h2 className="text-white text-xl font-semibold">
              {callData.callerName}
            </h2>
          </div>

          {/* Caller Avatar with enhanced animations */}
          <div className="relative mb-8 flex justify-center">
            <motion.div animate={{
            scale: isRinging ? [1, 1.15, 1] : 1,
            rotate: isRinging ? [0, 8, -8, 0] : 0
        }} transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut"
        }} className="relative">
              <img src={callData.callerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(callData.callerName.trim())}`} alt={callData.callerName} width="120" height="120" className="rounded-full ring-4 ring-white/20 shadow-2xl"/>
              
              {/* Multiple pulsing ring effects for more engagement */}
              <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }} className="absolute inset-0 border-4 border-white rounded-full"/>
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} className="absolute inset-0 border-4 border-purple-300 rounded-full"/>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }} className="absolute inset-0 border-4 border-blue-300 rounded-full"/>
              
              {/* Enhanced call type indicator with glow effect */}
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-2xl ring-4 ring-purple-500/30">
                {callData.callType === 'video' ? (<Video className="w-5 h-5 text-blue-600"/>) : (<Phone className="w-5 h-5 text-green-600"/>)}
              </motion.div>
            </motion.div>
          </div>

          {/* Enhanced Call Actions with more engaging animations */}
          <div className="flex items-center justify-center space-x-12">
            {/* Reject Button with shake animation on hover */}
            <motion.button whileHover={{
            scale: 1.15,
            x: [-2, 2, -2, 2, 0],
            transition: { x: { repeat: 3, duration: 0.2 } }
        }} whileTap={{ scale: 0.85 }} onClick={onReject} className="bg-red-500 text-white p-5 rounded-full shadow-2xl hover:bg-red-600 transition-colors relative overflow-hidden">
              <PhoneOff className="w-7 h-7 relative z-10"/>
              {/* Ripple effect */}
              <motion.div className="absolute inset-0 bg-red-400 rounded-full" initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: [0, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}/>
            </motion.button>

            {/* Accept Button with heartbeat and glow animation */}
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={onAccept} className="bg-green-500 text-white p-5 rounded-full shadow-2xl hover:bg-green-600 transition-colors relative overflow-hidden" animate={{
            boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0.8)',
                '0 0 0 25px rgba(34, 197, 94, 0)',
            ],
            scale: [1, 1.05, 1]
        }} transition={{
            boxShadow: { repeat: Infinity, duration: 1.8 },
            scale: { repeat: Infinity, duration: 1.8 }
        }}>
              <Phone className="w-7 h-7 relative z-10"/>
              {/* Ripple effect */}
              <motion.div className="absolute inset-0 bg-green-400 rounded-full" initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: [0, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}/>
            </motion.button>
          </div>

          {/* Enhanced call info with emoji feedback */}
          <div className="text-center mt-8">
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-white/60 text-sm mb-2">
              📱 Swipe up to answer with message
            </motion.p>
            <p className="text-white/40 text-xs">
              {callData.callType === 'video' ? '📹 Video call' : '📞 Voice call'} • Tap to {callData.callType === 'video' ? 'see' : 'hear'} each other
            </p>
          </div>
        </motion.div>

        {/* Background overlay with subtle animation */}
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 pointer-events-none"/>
      </div>
    </AnimatePresence>);
}
