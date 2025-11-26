import React from 'react';
import ChatPageClient from './ChatPageClient';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default async function ChatPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  return <ChatPageClient sellerId={sellerId} />;
}