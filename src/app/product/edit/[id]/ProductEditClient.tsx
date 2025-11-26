'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';

interface ProductEditClientProps {
  productId: string;
}

export default function ProductEditClient({ productId }: ProductEditClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadProduct = async () => {
      if (!user) {
        toast.error('Please login to edit products');
        router.push('/auth-login');
        return;
      }

      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          toast.error('Product not found');
          router.push('/');
          return;
        }

        const productData = productSnap.data();

        // Check if user owns this product
        if (productData.sellerId !== user.sub) {
          toast.error('You can only edit your own products');
          router.push('/');
          return;
        }

        // Store product data in sessionStorage for edit page
        sessionStorage.setItem('editProduct', JSON.stringify({
          id: productId,
          ...productData
        }));

        // Redirect to upload page in edit mode
        router.push(`/product/upload?edit=${productId}`);
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Failed to load product');
        router.push('/');
      }
    };

    loadProduct();
  }, [productId, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading product...</p>
      </div>
    </div>
  );
}

