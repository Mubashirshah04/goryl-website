import { uploadFile } from '@/lib/firebaseStorage';

// Video compression using WebCodecs API (if available)
export const compressVideo = async (
  file: File,
  options: {
    quality?: 'low' | 'medium' | 'high';
    maxWidth?: number;
    maxHeight?: number;
    bitrate?: number;
  } = {}
): Promise<Blob> => {
  const {
    quality = 'medium',
    maxWidth = 1280,
    maxHeight = 720,
    bitrate = 1000000 // 1Mbps
  } = options;
  
  // Quality presets
  const qualityPresets = {
    low: { bitrate: 500000, maxWidth: 640, maxHeight: 360 },
    medium: { bitrate: 1000000, maxWidth: 1280, maxHeight: 720 },
    high: { bitrate: 2000000, maxWidth: 1920, maxHeight: 1080 }
  };
  
  const preset = qualityPresets[quality];
  const finalBitrate = bitrate || preset.bitrate;
  const finalMaxWidth = maxWidth || preset.maxWidth;
  const finalMaxHeight = maxHeight || preset.maxHeight;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Calculate dimensions maintaining aspect ratio
      let { videoWidth, videoHeight } = video;
      
      if (videoWidth > finalMaxWidth || videoHeight > finalMaxHeight) {
        const aspectRatio = videoWidth / videoHeight;
        if (videoWidth > videoHeight) {
          videoWidth = finalMaxWidth;
          videoHeight = videoWidth / aspectRatio;
        } else {
          videoHeight = finalMaxHeight;
          videoWidth = videoHeight * aspectRatio;
        }
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Create MediaRecorder for compression
      const stream = canvas.captureStream(30); // 30fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: finalBitrate
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(compressedBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Play video and draw frames
      video.currentTime = 0;
      video.play();
      
      const drawFrame = () => {
        if (video.currentTime < video.duration) {
          if (ctx) {
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          }
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      
      video.ontimeupdate = drawFrame;
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Generate video thumbnails
export const generateVideoThumbnail = (
  file: File,
  timeOffset: number = 1
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      video.currentTime = timeOffset;
    };
    
    video.onseeked = () => {
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const thumbnail = canvas.toDataURL('image/webp', 0.8);
        resolve(thumbnail);
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Upload optimized video
export const uploadOptimizedVideo = async (
  file: File,
  path: string,
  options: {
    quality?: 'low' | 'medium' | 'high';
    generateThumbnail?: boolean;
  } = {}
): Promise<{ videoUrl: string; thumbnailUrl?: string }> => {
  const { quality = 'medium', generateThumbnail = true } = options;
  
  try {
    // Compress video
    const compressedVideo = await compressVideo(file, { quality });
    
    // Upload video to S3 via firebaseStorage wrapper
    const videoFile = compressedVideo instanceof Blob ? new File([compressedVideo], file.name, { type: 'video/webm' }) : file;
    const videoResult = await uploadFile(videoFile, path);
    const videoUrl = videoResult.url;
    
    let thumbnailUrl: string | undefined;
    
    // Generate and upload thumbnail
    if (generateThumbnail) {
      const thumbnail = await generateVideoThumbnail(file);
      const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
      const thumbnailFile = thumbnailBlob instanceof Blob ? new File([thumbnailBlob], `${file.name}_thumb.webp`, { type: 'image/webp' }) : thumbnailBlob as any;
      const thumbResult = await uploadFile(thumbnailFile, `${path}_thumbnail`);
      thumbnailUrl = thumbResult.url;
    }
    
    return { videoUrl, thumbnailUrl };
  } catch (error) {
    console.error('Error uploading optimized video:', error);
    throw error;
  }
};

// Progressive video loading
export const createProgressiveVideoLoader = (videoElement: HTMLVideoElement, urls: string[]) => {
  let currentQuality = 0;
  
  const loadNextQuality = () => {
    if (currentQuality < urls.length - 1) {
      currentQuality++;
      videoElement.src = urls[currentQuality];
    }
  };
  
  // Start with lowest quality
  videoElement.src = urls[0];
  
  // Load higher quality when current one is ready
  videoElement.addEventListener('canplaythrough', loadNextQuality);
  
  return {
    getCurrentQuality: () => currentQuality,
    loadSpecificQuality: (index: number) => {
      if (index >= 0 && index < urls.length) {
        currentQuality = index;
        videoElement.src = urls[index];
      }
    }
  };
};

// Video preloading
export const preloadVideo = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error(`Failed to preload video: ${url}`));
    video.src = url;
  });
};

// Adaptive bitrate streaming simulation
export const createAdaptiveStream = (videoElement: HTMLVideoElement, qualityLevels: string[]) => {
  let currentLevel = 0;
  
  const checkConnection = () => {
    // Simple connection check based on video loading time
    const startTime = performance.now();
    
    videoElement.addEventListener('loadstart', () => {
      const loadTime = performance.now() - startTime;
      
      if (loadTime > 3000 && currentLevel > 0) {
        // Slow connection, reduce quality
        currentLevel = Math.max(0, currentLevel - 1);
        videoElement.src = qualityLevels[currentLevel];
      } else if (loadTime < 1000 && currentLevel < qualityLevels.length - 1) {
        // Fast connection, increase quality
        currentLevel = Math.min(qualityLevels.length - 1, currentLevel + 1);
        videoElement.src = qualityLevels[currentLevel];
      }
    });
  };
  
  // Start with medium quality
  currentLevel = Math.floor(qualityLevels.length / 2);
  videoElement.src = qualityLevels[currentLevel];
  
  checkConnection();
  
  return {
    getCurrentLevel: () => currentLevel,
    setLevel: (level: number) => {
      if (level >= 0 && level < qualityLevels.length) {
        currentLevel = level;
        videoElement.src = qualityLevels[currentLevel];
      }
    }
  };
};

export default {
  compressVideo,
  generateVideoThumbnail,
  uploadOptimizedVideo,
  createProgressiveVideoLoader,
  preloadVideo,
  createAdaptiveStream
};
