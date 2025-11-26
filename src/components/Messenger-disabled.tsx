'use client';

// TEMPORARILY DISABLED - Needs AWS migration
// This component was using Firestore extensively and needs to be rewritten for AWS

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function Messenger() {
  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        disabled
        className="bg-gray-400 text-white rounded-full p-4 shadow-lg cursor-not-allowed opacity-50"
        title="Messaging feature coming soon"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
