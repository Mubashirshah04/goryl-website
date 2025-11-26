'use client';

import React, { useState } from 'react';
import { Tag, Hash, Plus, X } from 'lucide-react';

interface ReelPreviewData {
  videoUrl: string;
  videoBlob?: Blob;
  caption: string;
  soundId?: string;
  soundName?: string;
  filter: string;
  tags: string[];
  category: string;
  thumbnail?: string;
  status: 'draft' | 'published';
}

interface EditorPanelProps {
  previewData: ReelPreviewData;
  onUpdate: (updates: Partial<ReelPreviewData>) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ previewData, onUpdate }) => {
  const [newTag, setNewTag] = useState('');
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);

  const categories = [
    'Fashion', 'Travel', 'Food', 'Fitness', 'Music', 'Dance', 
    'Comedy', 'Education', 'Technology', 'Art', 'Sports', 'Lifestyle'
  ];

  const hashtagSuggestions = [
    '#fyp', '#viral', '#trending', '#fashion', '#travel', '#food',
    '#fitness', '#music', '#dance', '#comedy', '#education', '#art'
  ];

  const handleCaptionChange = (caption: string) => {
    onUpdate({ caption });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !previewData.tags.includes(newTag.trim())) {
      onUpdate({ 
        tags: [...previewData.tags, newTag.trim()] 
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate({ 
      tags: previewData.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  const handleAddHashtag = (hashtag: string) => {
    if (!previewData.tags.includes(hashtag)) {
      onUpdate({ 
        tags: [...previewData.tags, hashtag] 
      });
    }
    setShowHashtagSuggestions(false);
  };

  const handleCategoryChange = (category: string) => {
    onUpdate({ category });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Caption */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Caption *
        </label>
        <textarea
          value={previewData.caption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="Write a caption for your reel..."
          className="w-full h-24 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none resize-none"
          maxLength={2200}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {previewData.caption.length}/2200 characters
          </span>
          <button
            onClick={() => setShowHashtagSuggestions(!showHashtagSuggestions)}
            className="text-xs text-red-500 hover:text-red-400 flex items-center space-x-1"
          >
            <Hash className="w-3 h-3" />
            <span>Add hashtags</span>
          </button>
        </div>
      </div>

      {/* Hashtag Suggestions */}
      {showHashtagSuggestions && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">Popular Hashtags</span>
            <button
              onClick={() => setShowHashtagSuggestions(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtagSuggestions.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleAddHashtag(hashtag)}
                className="px-2 py-1 bg-gray-700 text-white text-xs rounded-full hover:bg-gray-600 transition-colors"
              >
                {hashtag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {previewData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
            >
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button
            onClick={handleAddTag}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Category
        </label>
        <select
          value={previewData.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="bg-gray-800 rounded-lg p-3">
        <h4 className="text-white text-sm font-medium mb-2">Preview</h4>
        <div className="text-gray-300 text-sm">
          <p className="mb-2">{previewData.caption || 'No caption yet...'}</p>
          {previewData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {previewData.tags.map((tag, index) => (
                <span key={index} className="text-red-400 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;


