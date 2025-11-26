'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function ProductImageGallery({ images, title }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };
    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    const goToImage = (index) => {
        setCurrentIndex(index);
    };
    if (!images || images.length === 0) {
        return (<div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No images available</p>
      </div>);
    }
    return (<>
      <div className="relative w-full">
        {/* Main Image */}
        <div className="relative w-full h-96 md:h-[500px] bg-gray-100 rounded-lg overflow-hidden">
          <img src={images[currentIndex]} alt={`${title} - Image ${currentIndex + 1}`} className="object-cover w-full h-full"/>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (<>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                <ChevronLeft size={20}/>
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                <ChevronRight size={20}/>
              </button>
            </>)}

          {/* Zoom Button */}
          <button onClick={() => setIsFullscreen(true)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
            <ZoomIn size={20}/>
          </button>

          {/* Image Counter */}
          {images.length > 1 && (<div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {images.length}
            </div>)}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (<div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (<button key={index} onClick={() => goToImage(index)} className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${index === currentIndex
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                <img src={image} alt={`${title} - Thumbnail ${index + 1}`} className="object-cover w-full h-full"/>
              </button>))}
          </div>)}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
            <div className="relative max-w-7xl max-h-full p-4">
              <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors z-10">
                <X size={24}/>
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img src={images[currentIndex]} alt={`${title} - Fullscreen`} width="1200" height="800" className="object-contain max-w-full max-h-full cursor-zoom-out" onClick={() => setIsFullscreen(false)}/>
              </div>

              {/* Fullscreen Navigation */}
              {images.length > 1 && (<>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-white/20 transition-colors z-10 backdrop-blur-sm">
                    <ChevronLeft size={28}/>
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-white/20 transition-colors z-10 backdrop-blur-sm">
                    <ChevronRight size={28}/>
                  </button>
                </>)}

              {/* Fullscreen Image Counter */}
              {images.length > 1 && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                  {currentIndex + 1} / {images.length}
                </div>)}

              {/* Fullscreen Thumbnail Strip */}
              {images.length > 1 && (<div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto pb-2">
                  {images.map((image, index) => (<button key={index} onClick={(e) => {
                        e.stopPropagation();
                        goToImage(index);
                    }} className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${index === currentIndex
                        ? 'border-white'
                        : 'border-white/30 hover:border-white/60'}`}>
                      <img src={image} alt={`Thumbnail ${index + 1}`} className="object-cover w-full h-full"/>
                    </button>))}
                </div>)}
            </div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
