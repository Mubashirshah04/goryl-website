'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Type, 
  Palette, 
  Crop, 
  RotateCcw, 
  Download, 
  X, 
  Check,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Contrast,
  Zap,
  Filter
} from 'lucide-react';

interface VideoEditorProps {
  videoUrl: string;
  onSave?: (editedVideoData: any) => void;
  onCancel?: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
}

interface VideoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

export default function VideoEditor({ videoUrl, onSave, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Editing states
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'crop'>('filters');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<VideoFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0
  });

  // Video controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoaded(true);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Text overlay functions
  const addTextOverlay = useCallback(() => {
    if (!newText.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial',
      rotation: 0
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setNewText('');
    setShowTextInput(false);
    setSelectedTextId(newOverlay.id);
  }, [newText]);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setSelectedTextId(null);
  }, []);

  // Filter functions
  const updateFilter = useCallback((filterName: keyof VideoFilters, value: number) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
      sepia: 0
    });
  }, []);

  // Apply filters to video
  const getFilterStyle = useCallback(() => {
    return {
      filter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
      `.replace(/\s+/g, ' ').trim()
    };
  }, [filters]);

  // Save edited video
  const handleSave = useCallback(() => {
    const editData = {
      filters,
      textOverlays,
      videoUrl,
      timestamp: Date.now()
    };
    onSave?.(editData);
  }, [filters, textOverlays, videoUrl, onSave]);

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <div className="text-white font-medium">Edit Reel</div>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-full text-white font-medium transition-colors"
        >
          Save
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Preview Area */}
        <div className="flex-1 flex items-center justify-center relative bg-gray-900">
          <div ref={containerRef} className="relative w-full max-w-sm h-full max-h-[80vh] bg-black rounded-lg overflow-hidden">
            {/* Video */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              style={getFilterStyle()}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              loop
            />

            {/* Text Overlays */}
            <AnimatePresence>
              {textOverlays.map((overlay) => (
                <motion.div
                  key={overlay.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute select-none cursor-move ${
                    selectedTextId === overlay.id ? 'ring-2 ring-pink-500' : ''
                  }`}
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    fontSize: `${overlay.fontSize}px`,
                    color: overlay.color,
                    fontFamily: overlay.fontFamily,
                    transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontWeight: 'bold'
                  }}
                  onClick={() => setSelectedTextId(overlay.id)}
                >
                  {overlay.text}
                  {selectedTextId === overlay.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTextOverlay(overlay.id);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none slider-thumb"
                />
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editing Panel */}
        <div className="w-80 bg-gray-900 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex bg-gray-800">
            {[
              { id: 'filters', icon: Filter, label: 'Filters' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'crop', icon: Crop, label: 'Adjust' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 p-3 flex flex-col items-center space-y-1 transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-pink-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'filters' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-medium">Filters</h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Reset
                  </button>
                </div>

                {/* Filter Controls */}
                {Object.entries(filters).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-gray-300 capitalize">
                        {key}
                      </label>
                      <span className="text-sm text-white">
                        {key === 'blur' ? `${value}px` : `${value}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={key === 'blur' ? 0 : key === 'brightness' || key === 'contrast' || key === 'saturation' ? 0 : 0}
                      max={key === 'blur' ? 10 : key === 'brightness' || key === 'contrast' || key === 'saturation' ? 200 : 100}
                      value={value}
                      onChange={(e) => updateFilter(key as keyof VideoFilters, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider-thumb"
                    />
                  </div>
                ))}

                {/* Preset Filters */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <h4 className="text-sm text-gray-300">Presets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Vintage', filters: { brightness: 110, contrast: 120, saturation: 80, sepia: 30 } },
                      { name: 'B&W', filters: { brightness: 100, contrast: 110, grayscale: 100 } },
                      { name: 'Vibrant', filters: { brightness: 105, contrast: 110, saturation: 150 } },
                      { name: 'Soft', filters: { brightness: 105, contrast: 95, blur: 1 } }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setFilters({ ...filters, ...preset.filters })}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-medium">Text</h3>
                  <button
                    onClick={() => setShowTextInput(true)}
                    className="px-3 py-1 bg-pink-600 hover:bg-pink-700 rounded text-sm text-white transition-colors"
                  >
                    Add Text
                  </button>
                </div>

                {/* Add Text Input */}
                <AnimatePresence>
                  {showTextInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={addTextOverlay}
                          className="flex-1 p-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowTextInput(false);
                            setNewText('');
                          }}
                          className="flex-1 p-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Text List */}
                <div className="space-y-2">
                  {textOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className={`p-3 bg-gray-800 rounded border-2 transition-colors ${
                        selectedTextId === overlay.id ? 'border-pink-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedTextId(overlay.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white text-sm truncate flex-1">
                          {overlay.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTextOverlay(overlay.id);
                          }}
                          className="text-gray-400 hover:text-red-400 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {selectedTextId === overlay.id && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="color"
                              value={overlay.color}
                              onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                              className="w-full h-8 bg-gray-700 border border-gray-600 rounded"
                            />
                            <select
                              value={overlay.fontFamily}
                              onChange={(e) => updateTextOverlay(overlay.id, { fontFamily: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded text-white text-xs"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Times New Roman">Times</option>
                              <option value="Courier New">Courier</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs text-gray-400 dark:text-gray-500">Size</label>
                            <input
                              type="range"
                              min={12}
                              max={72}
                              value={overlay.fontSize}
                              onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider-thumb"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="space-y-6">
                <h3 className="text-white font-medium">Adjustments</h3>
                <div className="text-gray-400 text-sm">
                  Crop and rotation features coming soon...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
