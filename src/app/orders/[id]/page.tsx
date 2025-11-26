import React from 'react';
import OrderDetailsClient from './OrderDetailsClient';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailsClient orderId={id} />;
}
