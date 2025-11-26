'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface FilterSelectorProps {
  selectedFilter: string;
  onSelect: (filter: string) => void;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({ selectedFilter, onSelect }) => {
  const filters = [
    { id: 'none', name: 'Original', preview: '📷' },
    { id: 'brightness', name: 'Bright', preview: '☀️' },
    { id: 'contrast', name: 'Contrast', preview: '⚡' },
    { id: 'saturate', name: 'Vibrant', preview: '🌈' },
    { id: 'warm', name: 'Warm', preview: '🌅' },
    { id: 'cool', name: 'Cool', preview: '❄️' },
    { id: 'vintage', name: 'Vintage', preview: '📸' },
    { id: 'dramatic', name: 'Dramatic', preview: '🎭' },
    { id: 'blackwhite', name: 'B&W', preview: '⚫' },
    { id: 'sepia', name: 'Sepia', preview: '🤎' },
    { id: 'neon', name: 'Neon', preview: '💜' },
    { id: 'sunset', name: 'Sunset', preview: '🌇' },
    { id: 'ocean', name: 'Ocean', preview: '🌊' },
    { id: 'forest', name: 'Forest', preview: '🌲' },
    { id: 'golden', name: 'Golden', preview: '🏆' },
    { id: 'pink', name: 'Pink', preview: '🌸' },
    { id: 'blue', name: 'Blue', preview: '💙' },
    { id: 'green', name: 'Green', preview: '💚' }
  ];

  return (
    <div className="p-4">
      <h3 className="text-white text-lg font-semibold mb-4">Choose Filter</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onSelect(filter.id)}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedFilter === filter.id
                ? 'border-red-500 bg-red-500/20'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{filter.preview}</div>
              <div className="text-white text-xs font-medium">{filter.name}</div>
            </div>
            
            {selectedFilter === filter.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <h4 className="text-white text-sm font-medium mb-2">Filter Preview</h4>
        <p className="text-gray-400 text-xs">
          Selected: <span className="text-red-400 font-medium">
            {filters.find(f => f.id === selectedFilter)?.name || 'Original'}
          </span>
        </p>
        <p className="text-gray-500 text-xs mt-1">
          The filter will be applied to your video in real-time
        </p>
      </div>
    </div>
  );
};

export default FilterSelector;


