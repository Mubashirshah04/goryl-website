'use client';

import React from 'react';
import BottomNav from '@/components/layout/bottom-navigation';
import { Toaster } from 'sonner';

export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        theme="light"
      />
    </div>
  );
}
