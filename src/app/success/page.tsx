'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function SuccessContent() {
  const orderId = useSearchParams().get('order');
  useEffect(() => {
    toast.success('Order placed successfully!');
  }, []);
  return (
    <div className="container mx-auto p-10 text-center">
      <h1 className="text-3xl font-bold text-green-600">🎉 Order Confirmed!</h1>
      <p className="mt-2">Order #{orderId}</p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-10 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
