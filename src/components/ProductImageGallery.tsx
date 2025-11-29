'use client';

import React, { useState, useEffect } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  video?: string;
}

export function ProductImageGallery({ images, title, video }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backgroundVideoRef, setBackgroundVideoRef] = useState<HTMLVideoElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Function to open modal and stop background video
  const openModal = () => {
    // Stop background video if it's playing
    if (backgroundVideoRef && !backgroundVideoRef.paused) {
      backgroundVideoRef.pause();
    }
    setIsModalOpen(true);
  };

  // Zoom functions
  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
  };

  const handleDoubleTap = () => {
    if (isZoomed) {
      resetZoom();
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      setLastTouchDistance(getDistance(e.touches[0], e.touches[1]));
    } else if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch to zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / lastTouchDistance;
      const newZoomLevel = Math.max(1, Math.min(3, zoomLevel * scale));
      setZoomLevel(newZoomLevel);
      setIsZoomed(newZoomLevel > 1);
      setLastTouchDistance(currentDistance);
    } else if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  };

  // Filter out blob URLs and data URLs - only keep real S3 URLs
  const validImages = images.filter((img) => 
    img && !img.startsWith('blob:') && !img.startsWith('data:') && 
    (img.startsWith('http://') || img.startsWith('https://'))
  );

  // Combine images and video into a single media array
  const mediaItems = [
    ...validImages.map((img, index) => ({ type: 'image', src: img, index })),
    ...(video && !video.startsWith('blob:') && !video.startsWith('data:') && (video.startsWith('http://') || video.startsWith('https://')) ? [{ type: 'video', src: video, index: validImages.length }] : [])
  ];

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSwipeAnimation('left');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      setSwipeAnimation(null);
      setIsTransitioning(false);
    }, 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSwipeAnimation('right');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
      setSwipeAnimation(null);
      setIsTransitioning(false);
    }, 300);
  };

  const goToImage = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSwipeAnimation(index > currentIndex ? 'left' : 'right');
    setTimeout(() => {
    setCurrentIndex(index);
      setSwipeAnimation(null);
      setIsTransitioning(false);
    }, 300);
  };



  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Only allow swipe if not zoomed
    if (!isZoomed) {
      if (isLeftSwipe && mediaItems.length > 1) {
        nextImage();
      }
      if (isRightSwipe && mediaItems.length > 1) {
        prevImage();
      }
    }
    
    // Reset swipe feedback
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
    setLastTouchDistance(null);
  };


  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        {/* Simple Layout */}
        <div className="w-full">
          {/* Main Image Area */}
          <div className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <div 
              className="relative w-full aspect-[4/3] max-h-[500px] min-h-[350px] sm:aspect-square sm:max-h-[600px] sm:min-h-[400px] overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Main Media */}
              <div 
                className="relative w-full h-full overflow-hidden bg-gray-50 cursor-pointer hover:opacity-95 transition-all duration-300"
                onClick={openModal}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  transition: isZoomed ? 'none' : 'transform 0.3s ease'
                }}
              >
                {mediaItems[currentIndex]?.type === 'video' ? (
                  <video
                    ref={(el) => setBackgroundVideoRef(el)}
                    src={mediaItems[currentIndex].src}
                    controls
                    className="object-cover w-full h-full"
                    poster={images[0]}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onDoubleClick={handleDoubleTap}
                    onError={(e) => {
                      console.error('❌ Video load error:', mediaItems[currentIndex].src);
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-center text-red-500 py-4 bg-red-50 rounded-lg h-full flex items-center justify-center';
                      errorDiv.innerHTML = `
                        <div class="text-red-600 font-semibold">Video could not be loaded</div>
                      `;
                      target.parentNode?.insertBefore(errorDiv, target);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    key={`${mediaItems[currentIndex]?.src || images[currentIndex]}-${currentIndex}`}
                    src={`${mediaItems[currentIndex]?.src || images[currentIndex]}?t=${Date.now()}`}
                    alt={`${title} - Media ${currentIndex + 1}`}
                    className="object-cover w-full h-full"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onDoubleClick={handleDoubleTap}
                    onLoad={() => console.log('🖼️ Media loaded successfully:', mediaItems[currentIndex]?.src)}
                    onError={(e) => {
                      console.error('❌ Media load error:', mediaItems[currentIndex]?.src);
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE2NS4zIDE1MCAxMzcgMTc4LjMgMTM3IDIxM0MxMzcgMjQ3LjcgMTY1LjMgMjc2IDIwMCAyNzZDMjM0LjcgMjc2IDI2MyAyNDcuNyAyNjMgMjEzQzI2MyAxNzguMyAyMzQuNyAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAyMDBIMjUwVjI1MEgxNTBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                )}
                
              </div>

              {/* Video Indicator */}
              {mediaItems[currentIndex]?.type === 'video' && (
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  🎥 Video
                </div>
              )}

              {/* Navigation Arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 p-2 rounded-full hover:bg-white transition-colors z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 p-2 rounded-full hover:bg-white transition-colors z-10"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Media Counter */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-gray-200 shadow-lg">
                  {currentIndex + 1} / {mediaItems.length}
                </div>
              )}

              {/* Zoom Controls */}
              {isZoomed && (
                <div className="absolute top-2 left-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetZoom();
                    }}
                    className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 shadow-lg hover:bg-white transition-colors"
                  >
                    🔍 Reset Zoom
                  </button>
                  <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 shadow-lg">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Images */}
          {mediaItems.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
              {mediaItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                    index === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-lg">🎥</div>
                    </div>
                  ) : (
                    <img
                      key={`thumbnail-${item.src}-${index}`}
                      src={`${item.src}?t=${Date.now()}`}
                      alt={`${title} - Thumbnail ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Full Screen Media */}
            <div className="w-full h-full flex items-center justify-center">
              {mediaItems[currentIndex]?.type === 'video' ? (
                <video
                  src={mediaItems[currentIndex].src}
                  controls
                  className="max-w-full max-h-full object-contain"
                  poster={images[0]}
                  onClick={(e) => e.stopPropagation()}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={`${mediaItems[currentIndex]?.src || images[currentIndex]}?t=${Date.now()}`}
                  alt={`${title} - Media ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {/* Media Counter */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                {currentIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}