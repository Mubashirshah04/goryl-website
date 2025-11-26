'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DirectVideoRecorder from '@/components/video/DirectVideoRecorder';

export default function CameraPage() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [videoBlob, setVideoBlob] = useState(null);

    const handleVideoComplete = (blob) => {
        setVideoBlob(blob);
        setShowForm(true);
    };

    const handleNextToForm = () => {
        setShowForm(true);
    };

    const handleClose = () => {
        router.push('/');
    };

    // If form should be shown, redirect to upload page with video data
    if (showForm && videoBlob) {
        // Store video blob in sessionStorage for the upload page
        const videoUrl = URL.createObjectURL(videoBlob);
        sessionStorage.setItem('recordedVideo', JSON.stringify({
            blob: videoBlob,
            url: videoUrl,
            timestamp: Date.now()
        }));
        
        // Redirect to upload page
        router.push('/upload/reel');
        return null;
    }

    return (
        <div className="min-h-screen bg-black">
            <DirectVideoRecorder
                onVideoComplete={handleVideoComplete}
                onClose={handleClose}
                onNext={handleNextToForm}
            />
        </div>
    );
}

