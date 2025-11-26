import React from 'react';
import ProductPageClient from './ProductPageClient';
export async function generateStaticParams() {
    // For static export, we need to pre-generate all possible product IDs
    // Since we can't fetch from Firestore at build time, we'll return common demo IDs
    // and handle real product IDs dynamically in the client
    // Generate a comprehensive list of possible product IDs
    const staticIds = [
        'demo-product-1',
        'demo-product-2',
        'demo-product-3',
        'rdNdpxj6M19N1pkudghR', // Specific product ID that was failing
    ];
    // Generate additional placeholder IDs for potential products
    const additionalIds = [];
    for (let i = 1; i <= 50; i++) {
        additionalIds.push(`product-${i}`);
    }
    // Generate random-like IDs similar to Firebase auto-generated IDs
    const firebaseStyleIds = [
        'ABC123def456GHI789',
        'XYZ987uvw654RST321',
        'MNO456pqr789STU012',
        'DEF789ghi012JKL345',
        'PQR012stu345VWX678'
    ];
    const allIds = [...staticIds, ...additionalIds, ...firebaseStyleIds];
    return allIds.map(id => ({ id }));
}
// Static export doesn't support dynamicParams
// export const dynamicParams = true;
export default async function ProductPage({ params }) {
    const { id } = await params;
    // Debug logging
    console.log('🚨 PRODUCT PAGE: Received params:', params);
    console.log('🚨 PRODUCT PAGE: Extracted ID:', id, 'Type:', typeof id, 'Length:', id === null || id === void 0 ? void 0 : id.length);
    console.log('🚨 PRODUCT PAGE: ID JSON:', JSON.stringify(id));
    // Validate product ID more strictly
    if (!id || typeof id !== 'string' || id.trim() === '' || id === 'undefined' || id === 'null') {
        console.error('Invalid product ID detected:', id);
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Product</h1>
          <p className="text-gray-600 dark:text-gray-300">Product ID is missing or invalid: "{id}"</p>
        </div>
      </div>);
    }
    // Additional validation for Firestore document ID format
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
        console.error('Product ID is empty after trimming:', id);
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Product</h1>
          <p className="text-gray-600 dark:text-gray-300">Product ID is empty.</p>
        </div>
      </div>);
    }
    // Final validation before passing to client
    console.log('🔍 PRODUCT PAGE DEBUG:');
    console.log('- Original id:', JSON.stringify(id));
    console.log('- Trimmed id:', JSON.stringify(trimmedId));
    console.log('- ID length:', trimmedId.length);
    console.log('- ID type:', typeof trimmedId);
    console.log('- ID includes slash:', trimmedId.includes('/'));
    console.log('- ID includes backslash:', trimmedId.includes('\\'));
    console.log('- ID equals "products":', trimmedId === 'products');
    // Check for empty or invalid ID
    if (!trimmedId || trimmedId === '' || trimmedId === 'undefined' || trimmedId === 'null') {
        console.error('❌ PRODUCT PAGE: Empty or invalid product ID detected');
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Product ID</h1>
          <p className="text-gray-600 dark:text-gray-300">Product ID is empty or invalid.</p>
          <p className="text-sm text-gray-500 mt-2">Received: "{trimmedId}"</p>
        </div>
      </div>);
    }
    // Check for Firestore invalid characters and invalid paths
    if (trimmedId.includes('/') || trimmedId.includes('\\') || trimmedId === 'products' || trimmedId.length < 3) {
        console.error('❌ PRODUCT PAGE: Invalid Firestore document ID format:', trimmedId);
        // Special handling for "products" - redirect to products page
        if (trimmedId === 'products') {
            return (<div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Product URL</h1>
            <p className="text-gray-600 dark:text-gray-300">You accessed /product/products which is invalid.</p>
            <p className="text-sm text-gray-500 mt-2">Did you mean to visit the products page?</p>
            <button onClick={() => window.location.href = '/shop'} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Go to Shop
            </button>
          </div>
        </div>);
        }
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Product ID Format</h1>
          <p className="text-gray-600 dark:text-gray-300">The product ID contains invalid characters for Firestore.</p>
          <p className="text-sm text-gray-500 mt-2">ID: "{trimmedId}"</p>
          <button onClick={() => window.location.href = '/shop'} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            Browse Products
          </button>
        </div>
      </div>);
    }
    console.log('✅ PRODUCT PAGE: ID validation passed, rendering component');
    return <ProductPageClient productId={trimmedId}/>;
}
