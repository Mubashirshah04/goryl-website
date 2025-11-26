import React from 'react';
import TrackOrderClient from './TrackOrderClient';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default async function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <TrackOrderClient orderId={orderId} />;
}
