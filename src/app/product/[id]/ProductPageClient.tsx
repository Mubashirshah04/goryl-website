'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Using AWS DynamoDB instead of Firestore
import { getProductById, updateProduct } from '@/lib/hybridProductService';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Share2, 
  Star, 
  ShoppingCart, 
  Heart, 
  MessageCircle, 
  Star as StarIcon,
  MoreHorizontal,
  Bookmark,
  Truck,
  Shield,
  RotateCcw,
  Award,
  CheckCircle,
  Zap,
  Tag,
  Eye,
  Package,
  Store
} from 'lucide-react';
import { ProductImageGallery } from '@/components/ProductImageGallery';
import ProductReviews from '@/components/ProductReviews';
import ProductComments from '@/components/ProductComments';
import CommentDialog from '@/components/CommentDialog';
import { RelatedProducts } from '@/components/RelatedProducts';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useSimilarProducts } from '@/hooks/useRecommendations';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  video?: string;
  sellerId: string;
  sellerName: string;
  stock?: number;
  brand?: string;
  model?: string;
  sku?: string;
  condition?: string;
  recommendedAge?: string;
  highlights?: string[];
  shippingInfo?: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    freeShipping?: boolean;
    shippingCost?: number;
    estimatedDays?: number;
    shippingMethod?: string;
    packageWeight?: number;
    packageDimensions?: { length: number; width: number; height: number };
    dangerousGoods?: string;
  };
  warrantyInfo?: {
    duration?: string;
    type?: string;
    coverage?: string;
    hasWarranty?: boolean;
    warrantyPeriod?: string;
    warrantyType?: string;
  };
  inventory?: {
    total: number;
    available: number;
    reserved: number;
  };
  status: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  metadata?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    materials: string[];
    colors: string[];
    sizes: string[];
  };
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export default function ProductPageClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [buyerGallery, setBuyerGallery] = useState<string[]>([]);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [moreProducts, setMoreProducts] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  
  // const { similarProducts, loading: similarLoading } = useSimilarProducts(product?.category || '', productId);
  useEffect(() => {
    console.log('🔥 PRODUCT CLIENT: useEffect triggered');
    console.log('🔥 PRODUCT CLIENT: productId prop:', JSON.stringify(productId));
    console.log('🔥 PRODUCT CLIENT: productId type:', typeof productId);
    console.log('🔥 PRODUCT CLIENT: productId length:', productId?.length);
    
    // Check if we're getting URL path instead of product ID
    if (productId && productId.includes('/')) {
      console.error('❌ PRODUCT CLIENT: Received URL path instead of product ID:', productId);
      const segments = productId.split('/').filter(segment => segment.length > 0);
      console.log('🔍 URL segments:', segments);
      
      // If we have segments, try to extract the actual product ID
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment !== 'products' && lastSegment !== 'product') {
          console.log('🔄 Attempting to use last segment as product ID:', lastSegment);
          // Recursively call with corrected ID
          // But we need to be careful not to create infinite loop
          setError(`Invalid URL format. Expected product ID, got: "${productId}"`);
          setLoading(false);
          return;
        }
      }
      
      setError(`Invalid product URL: "${productId}"`);
      setLoading(false);
      return;
    }
    
    if (!productId) {
      console.error('❌ PRODUCT CLIENT: No productId provided');
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    const trimmedId = productId.trim();
    console.log('🔥 PRODUCT CLIENT: Trimmed ID:', JSON.stringify(trimmedId));

    if (!trimmedId) {
      console.error('❌ PRODUCT CLIENT: Product ID is empty after trimming');
      setError('Product ID cannot be empty');
      setLoading(false);
      return;
    }

    // Additional Firestore-specific validation
    if (trimmedId.includes('/') || trimmedId.includes('\\') || trimmedId === 'products' || trimmedId.startsWith('.') || trimmedId.endsWith('.')) {
      console.error('❌ PRODUCT CLIENT: Invalid Firestore document ID format:', trimmedId);
      setError(`Invalid product ID format: "${trimmedId}". Cannot be collection name or contain special characters.`);
      setLoading(false);
      return;
    }

    // Final validation before creating Firestore reference
    if (!trimmedId || trimmedId.length === 0) {
      console.error('❌ PRODUCT CLIENT: Cannot create Firestore reference with empty ID');
      setError('Invalid product ID: empty or undefined');
      setLoading(false);
      return;
    }
    
    // Wrap async code in an async function
    const loadProduct = async () => {
      try {
        console.log('🔥 PRODUCT CLIENT: About to create doc reference with:', { collection: 'products', id: trimmedId });
        
        // Additional safety check before creating Firestore reference
        if (!trimmedId || trimmedId.length === 0) {
          throw new Error('Product ID is empty or undefined');
        }
        
        // Check if trimmedId is just "products" (invalid)
        if (trimmedId === 'products') {
          console.error('❌ PRODUCT CLIENT: Received "products" as product ID - this is invalid');
          setError('Invalid product ID: "products" is a collection name, not a document ID');
          setLoading(false);
          return;
        }
        
        // Additional check for common invalid IDs
        const invalidIds = ['products', 'product', 'undefined', 'null', ''];
        if (invalidIds.includes(trimmedId.toLowerCase())) {
          console.error('❌ PRODUCT CLIENT: Received invalid product ID:', trimmedId);
          setError(`Invalid product ID: "${trimmedId}"`);
          setLoading(false);
          return;
        }
        
        // Load product from AWS DynamoDB
        console.log('✅ PRODUCT CLIENT: Loading from AWS DynamoDB');
        
        const product = await getProductById(trimmedId);
        
        if (product) {
          const productData = product as Product;
          console.log('🔥 PRODUCT DATA from DynamoDB:', {
            viewCount: productData.viewCount,
            likeCount: productData.likeCount,
            title: productData.title
          });
          setProduct(productData);
          setLikeCount(productData.likeCount || 0);
          setError(null);
          
          // Increment view count only once per session
          const viewedKey = `viewed_${trimmedId}`;
          if (!sessionStorage.getItem(viewedKey)) {
            console.log('🔥 INCREMENTING VIEW COUNT for:', trimmedId);
            await updateProduct(trimmedId, {
              viewCount: (productData.viewCount || 0) + 1,
              views: (productData.views || 0) + 1
            });
            console.log('✅ VIEW COUNT UPDATED in DynamoDB');
            sessionStorage.setItem(viewedKey, 'true');
          } else {
            console.log('🔥 VIEW ALREADY COUNTED for session:', trimmedId);
          }
        } else {
          setError('Product not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading product from DynamoDB:', error);
        setError('Failed to load product');
        setLoading(false);
      }
    };

    // Call the async function
    loadProduct();
  }, [productId]);

  // Fetch reviews, Q&A, buyer gallery, and related products
  useEffect(() => {
    if (!productId || !product) return;

    const fetchProductData = async () => {
      try {
        console.log('🔍 Fetching product data for:', productId);

        // Fetch reviews with images for buyer gallery
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('productId', '==', productId),
          limit(20)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort reviews by createdAt in JavaScript
        reviewsData.sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        
        setReviews(reviewsData);

        // Extract buyer gallery images from reviews
        const galleryImages: string[] = [];
        reviewsData.forEach((review: any) => {
          if (review.images && Array.isArray(review.images)) {
            galleryImages.push(...review.images);
          }
        });
        setBuyerGallery(galleryImages.slice(0, 12)); // Limit to 12 images

        // Calculate review stats
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
          const avgRating = totalRating / reviewsData.length;
          
          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviewsData.forEach((review: any) => {
            const rating = review.rating || 0;
            if (rating >= 1 && rating <= 5) {
              breakdown[rating as keyof typeof breakdown]++;
            }
          });

          setReviewStats({
            averageRating: avgRating,
            totalReviews: reviewsData.length,
            ratingBreakdown: breakdown
          });
        }

        // Fetch Q&A
        const questionsQuery = query(
          collection(db, 'questions'),
          where('productId', '==', productId),
          limit(5)
        );
        const questionsSnapshot = await getDocs(questionsQuery);
        const questionsData = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort questions by createdAt in JavaScript
        questionsData.sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        
        setQuestions(questionsData);

        // Fetch seller's other products
        if (product.sellerId) {
          const sellerProductsQuery = query(
            collection(db, 'products'),
            where('sellerId', '==', product.sellerId),
            where('status', '==', 'active'),
            limit(8)
          );
          const sellerProductsSnapshot = await getDocs(sellerProductsQuery);
          const sellerProductsData = sellerProductsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((p: any) => p.id !== productId); // Exclude current product
          
          setSellerProducts(sellerProductsData);
        }

        // Fetch related products from same category
        if (product.category) {
          const relatedProductsQuery = query(
            collection(db, 'products'),
            where('category', '==', product.category),
            where('status', '==', 'active'),
            limit(12)
          );
          const relatedProductsSnapshot = await getDocs(relatedProductsQuery);
          const relatedProductsData = relatedProductsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((p: any) => p.id !== productId); // Exclude current product
          
          setRelatedProducts(relatedProductsData);
        }

      } catch (error) {
        console.error('Error fetching product data:', error);
        setReviews([]);
        setQuestions([]);
        setBuyerGallery([]);
        setSellerProducts([]);
        setRelatedProducts([]);
      }
    };

    fetchProductData();
  }, [productId, product]);


  // Check like status using AWS DynamoDB
  useEffect(() => {
    if (!product || !user || !productId) return;

    const checkLikeStatus = async () => {
      try {
        const { isItemLiked } = await import('@/lib/awsLikeService');
        const liked = await isItemLiked(user.sub, 'product', productId);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [product, user, productId]);

  const handleAddToCart = async () => {
    if (!product || !user) {
      toast.error('Please login to add items to cart');
      return;
    }

    const availableStock = product.inventory?.available ?? product.stock ?? 0;
    if (availableStock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    try {
      // Ensure product has required properties for cart
      const cartProduct = {
        ...product,
        images: product.images || [],
        stock: product.stock || 0
      };
      await addToCart(cartProduct, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!product || !user) {
      toast.error('Please login to buy now');
      return;
    }

    const availableStock = product.inventory?.available ?? product.stock ?? 0;
    if (availableStock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    try {
      // Add to cart first
      const cartProduct = {
        ...product,
        images: product.images || [],
        stock: product.stock || 0
      };
      await addToCart(cartProduct, quantity);
      
      // Show success message
      toast.success('Product added to cart!');
      
      // Small delay to ensure cart is updated before redirecting
      setTimeout(() => {
        router.push('/checkout');
      }, 500);
    } catch (error) {
      console.error('Error in buy now:', error);
      toast.error('Failed to process buy now');
    }
  };

  const handleLike = async () => {
    if (!product || !user || !productId || productId.trim() === '') {
      toast.error('Please login to like products');
      return;
    }

    const newLikedState = !isLiked;
    const increment_value = newLikedState ? 1 : -1;

    try {
      // Update local state immediately for better UX
      setIsLiked(newLikedState);
      setLikeCount(prev => prev + increment_value);
      
      // Update AWS DynamoDB
      const { likeItem, unlikeItem } = await import('@/lib/awsLikeService');
      
      if (newLikedState) {
        await likeItem(user.sub, 'product', productId);
      } else {
        await unlikeItem(user.sub, 'product', productId);
      }
      
      toast.success(newLikedState ? 'Added to favorites!' : 'Removed from favorites!');
    } catch (error) {
      // Revert local state on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => prev - increment_value);
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  // Load more random products for infinite scroll
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMoreProducts) return;
    
    setLoadingMore(true);
    try {
      let productsQuery;
      
      if (lastVisible) {
        productsQuery = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(12)
        );
      } else {
        productsQuery = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      }
      
      const productsSnapshot = await getDocs(productsQuery);
      const newProducts = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.id !== productId); // Exclude current product
      
      if (newProducts.length > 0) {
        setMoreProducts(prev => [...prev, ...newProducts]);
        setLastVisible(productsSnapshot.docs[productsSnapshot.docs.length - 1]);
      }
      
      if (newProducts.length < 12) {
        setHasMoreProducts(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMoreProducts, lastVisible]);

  // Initial load of more products
  useEffect(() => {
    if (moreProducts.length === 0) {
      loadMoreProducts();
    }
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <ProductImageGallery
              images={product.images}
              title={product.title}
              video={product.video}
            />
            
            {/* Buyer Gallery - Customer Review Images */}
            {buyerGallery.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Customer Photos ({buyerGallery.length})
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {buyerGallery.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity cursor-pointer">
                      <img 
                        src={image} 
                        alt={`Customer photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onClick={() => {
                          // Open image in modal or lightbox
                          window.open(image, '_blank');
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Real photos from verified buyers
                </p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Title & Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Brand: {product.sellerName}</span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">In Stock</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{product.title}</h1>
              
              {/* Rating & Reviews */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded text-sm">
                  <span className="font-bold">{reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : 'No rating'}</span>
                  {reviewStats.averageRating > 0 && <Star className="h-3 w-3 ml-1 fill-current" />}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {reviewStats.totalReviews} ratings & {reviews.length} reviews
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {product.viewCount || 0} views
                </span>
              </div>

              {/* Special Offers - Only Real Firebase Data */}
              {(product as any).specialOffers && (product as any).specialOffers.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                  <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">Special Offers</h3>
                  <div className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                    {(product as any).specialOffers.map((offer: string, index: number) => (
                      <div key={index}>• {offer}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  Rs {product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                      Rs {product.originalPrice.toFixed(2)}
                    </span>
                    <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm px-2 py-1 rounded">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </span>
                  </>
                )}
              </div>
              {(product as any).shippingInfo?.freeShipping && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  FREE delivery on this product
                </div>
              )}
            </div>

            {/* Delivery & Services - Real Firebase Data */}
            {((product as any).shippingInfo?.freeShipping || 
              (product as any).warrantyInfo?.hasWarranty || 
              ((product as any).returnPolicy && (product as any).returnPolicy.length > 0) ||
              ((product as any).deliveryServices && (product as any).deliveryServices.length > 0)) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Delivery & Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Free Delivery */}
                  {(product as any).shippingInfo?.freeShipping && (
                    <div className="flex items-center space-x-3">
                      <Truck className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Free Delivery</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">On this product</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Warranty */}
                  {(product as any).warrantyInfo?.hasWarranty && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {(product as any).warrantyInfo.warrantyPeriod} Warranty
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {(product as any).warrantyInfo.warrantyType === 'manufacturer' ? 'Manufacturer' : 'Seller'} warranty
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Return Policy */}
                  {(product as any).returnPolicy && (product as any).returnPolicy.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Return Available</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Check policy below</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Delivery Services from Seller */}
                  {(product as any).deliveryServices && (product as any).deliveryServices.length > 0 && (
                    (product as any).deliveryServices.slice(0, 3).map((service: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Truck className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{service}</div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Zaillisy Assured - Always show */}
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Zaillisy Assured</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Quality checked</div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Short Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Short Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {product.description?.length > 200 
                  ? `${product.description.substring(0, 200)}...` 
                  : product.description || "High-quality product with excellent features and reliable performance."}
              </p>
            </div>

            {/* Technical Specifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Technical Specifications</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Brand */}
                  {(product.brand || product.sellerName) && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Brand</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.brand || product.sellerName}</span>
                    </div>
                  )}
                  
                  {/* Model */}
                  {product.model && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Model</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.model}</span>
                    </div>
                  )}
                  
                  {/* SKU */}
                  {product.sku && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">SKU</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.sku}</span>
                    </div>
                  )}
                  
                  {/* Recommended Age */}
                  {product.recommendedAge && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Recommended Age</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.recommendedAge}</span>
                    </div>
                  )}
                  
                  {/* Condition */}
                  {product.condition && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Condition</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{product.condition}</span>
                    </div>
                  )}
                  
                  {/* Package Weight */}
                  {product.shippingInfo?.packageWeight && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Package Weight</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.shippingInfo.packageWeight} kg</span>
                    </div>
                  )}
                  
                  {/* Package Dimensions */}
                  {product.shippingInfo?.packageDimensions && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Package Dimensions</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {product.shippingInfo.packageDimensions.length} × {product.shippingInfo.packageDimensions.width} × {product.shippingInfo.packageDimensions.height} cm
                      </span>
                    </div>
                  )}
                  
                  {/* Dangerous Goods */}
                  {product.shippingInfo?.dangerousGoods && product.shippingInfo.dangerousGoods !== 'none' && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Contains</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{product.shippingInfo.dangerousGoods.replace('_', ' ')}</span>
                    </div>
                  )}
                  
                  {/* Warranty */}
                  {product.warrantyInfo?.hasWarranty && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Warranty</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {product.warrantyInfo.warrantyPeriod} ({product.warrantyInfo.warrantyType} warranty)
                      </span>
                    </div>
                  )}
                  
                  {/* Old metadata fields (backward compatibility) */}
                  {product.metadata?.weight && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Weight</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.weight}g</span>
                    </div>
                  )}
                  {product.metadata?.dimensions && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Dimensions</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {product.metadata.dimensions.length} × {product.metadata.dimensions.width} × {product.metadata.dimensions.height} cm
                      </span>
                    </div>
                  )}
                  {product.metadata?.materials && product.metadata.materials.length > 0 && (
                    <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Materials</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.materials.join(', ')}</span>
                    </div>
                  )}
                  {product.metadata?.colors && product.metadata.colors.length > 0 && (
                    <div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Available Colors</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.colors.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  (product.inventory?.available ?? product.stock ?? 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {(() => {
                    const availableStock = product.inventory?.available ?? product.stock ?? 0;
                    return availableStock > 0 
                      ? `${availableStock} units in stock`
                      : 'Out of stock';
                  })()}
                </span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Order within 2 hours 15 minutes for delivery by tomorrow
              </div>
            </div>

            {/* Purchase Options */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-900 dark:text-white">Quantity:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inventory?.available ?? product.stock ?? 1, quantity + 1))}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Only {product.inventory?.available ?? product.stock ?? 0} left in stock
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  disabled={(product.inventory?.available ?? product.stock ?? 0) === 0}
                  className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={(product.inventory?.available ?? product.stock ?? 0) === 0}
                  className="flex-1 bg-black dark:bg-white text-white px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold border border-gray-300 dark:border-gray-700"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </button>
              </div>

              {/* EMI Options */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">EMI Options Available</span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Starting from ${(product.price / 12).toFixed(2)}/month. No Cost EMI available
                </div>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLike}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  isLiked
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>

              <button className="flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="text-sm">Share</span>
              </button>

              <button className="flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm">Compare</span>
              </button>
            </div>

            {/* Reviews & Comments Toggle */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <StarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">Reviews ({reviewStats.totalReviews})</span>
              </button>

              <button
                onClick={() => setShowCommentDialog(true)}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Comments</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visit Store - Seller's Products */}
        <div className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">More from {product.sellerName}</h2>
              <p className="text-gray-600 dark:text-gray-400">Discover more products from this seller</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/chat/${product.sellerId}`}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contact Seller</span>
              </Link>
              <Link
                href={`/profile/${product.sellerId}`}
                className="flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300 dark:border-gray-700"
              >
                <Store className="w-5 h-5" />
                <span>Visit Store</span>
              </Link>
            </div>
          </div>
          
          {sellerProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sellerProducts.slice(0, 8).map((item: any, index: number) => (
                <div key={`seller-${item.id}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                     onClick={() => router.push(`/product/${item.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={item.images?.[0] || '/placeholder-product.jpg'} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" 
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 h-10">{item.title}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${
                          i < Math.floor(item.rating || 4.0) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600">${item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-500 line-through">${item.originalPrice}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => router.push(`/shop/${product.sellerId}`)}
                className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline transition-colors"
              >
                View all {sellerProducts.length}+ products from {product.sellerName} →
              </button>
            </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-6">This seller has no other products yet</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/chat/${product.sellerId}`}
                  className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Contact Seller</span>
                </Link>
                <Link
                  href={`/profile/${product.sellerId}`}
                  className="inline-flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium border border-gray-300 dark:border-gray-700"
                >
                  <Store className="w-5 h-5" />
                  <span>Visit Store</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Product Description */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detailed Product Description</h2>
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">
              {product.description || "This premium product offers exceptional quality and performance. Designed with attention to detail and built to last, it provides excellent value for your investment. Whether you're a professional or enthusiast, this product delivers the reliability and functionality you need."}
            </div>
            
            {/* Product Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Highlights:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.highlights.map((highlight: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features from Product Data - Only Real Firebase Data */}
            {(product.metadata as any)?.features?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(product.metadata as any).features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package Contents - Only Real Firebase Data */}
            {(product.metadata as any)?.packageContents?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Package Contents:</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>1x {product.title}</span>
                    </li>
                    {(product.metadata as any).packageContents.map((item: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Usage Instructions - Only Real Firebase Data */}
            {(product.metadata as any)?.usageInstructions?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage & Care Instructions:</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    {(product.metadata as any).usageInstructions.map((instruction: string, index: number) => (
                      <li key={index}>• {instruction}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping & Returns */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Shipping & Returns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600" />
                Shipping Information
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {product.shippingInfo?.freeShipping ? (
                  <div>• Free shipping on this item</div>
                ) : product.shippingInfo?.shippingCost ? (
                  <div>• Shipping cost: ${product.shippingInfo.shippingCost}</div>
                ) : (
                  <div>• Free standard delivery on orders over $25</div>
                )}
                {product.shippingInfo?.packageWeight && (
                  <div>• Package weight: {product.shippingInfo.packageWeight} kg</div>
                )}
                {product.shippingInfo?.packageDimensions && (
                  <div>• Package size: {product.shippingInfo.packageDimensions.length} × {product.shippingInfo.packageDimensions.width} × {product.shippingInfo.packageDimensions.height} cm</div>
                )}
                {product.shippingInfo?.dangerousGoods && product.shippingInfo.dangerousGoods !== 'none' && (
                  <div className="text-orange-600 dark:text-orange-400">• Contains: {product.shippingInfo.dangerousGoods.replace('_', ' ')}</div>
                )}
                {/* Custom Delivery Services */}
                {(product as any).deliveryServices && (product as any).deliveryServices.length > 0 && (
                  (product as any).deliveryServices.map((service: string, index: number) => (
                    <div key={index}>• {service}</div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />
                Return Policy
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {(product as any).returnPolicy && (product as any).returnPolicy.length > 0 ? (
                  (product as any).returnPolicy.map((policy: string, index: number) => (
                    <div key={index}>• {policy}</div>
                  ))
                ) : (
                  <>
                    <div>• 30-day return window from delivery date</div>
                    <div>• Items must be in original condition</div>
                    <div>• Free return shipping on defective items</div>
                    <div>• Refund processed within 5-7 business days</div>
                    <div>• Exchange available for different size/color</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Questions & Answers</h2>
          <div className="space-y-6">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Q: </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{question.question}</span>
                  </div>
                  {question.answer && (
                    <div className="ml-4">
                      <span className="text-sm font-medium text-blue-600">A: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{question.answer}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        By {question.answeredBy || product.sellerName} • {
                          question.answeredAt ? 
                          new Date(question.answeredAt.toDate()).toLocaleDateString() : 
                          'Recently'
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No questions yet for this product</p>
                <p className="text-sm text-gray-400">Be the first to ask a question!</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => {
                if (!user) {
                  toast.error('Please login to ask a question');
                  return;
                }
                // Add question functionality here
                toast.info('Question form will be implemented soon');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors"
            >
              Ask a question about this product
            </button>
          </div>
        </div>


        {/* Customer Reviews Summary */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Customer reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rating Overview */}
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : 'No rating'}
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${
                        i < Math.floor(reviewStats.averageRating > 0 ? reviewStats.averageRating : 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`} />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reviewStats.totalReviews} global ratings
                  </div>
                </div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewStats.ratingBreakdown[stars as keyof typeof reviewStats.ratingBreakdown] || 0;
                  const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                  
                  return (
                    <div key={stars} className="flex items-center space-x-3">
                      <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {stars} star
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Highlights - Only show if reviews exist */}
            {reviews.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Review highlights</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Based on {reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Customer Reviews */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top customer reviews</h3>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={review.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.userName || 'user')}`} 
                      alt={review.userName || 'Reviewer'} 
                      className="w-10 h-10 rounded-full" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{review.userName || 'Anonymous'}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${
                              i < (review.rating || 0) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Verified Purchase</span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{review.title || 'Customer Review'}</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        {review.comment || review.text || 'No comment provided.'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Helpful?</span>
                        <button className="text-blue-600 hover:underline">Yes ({review.helpfulCount || 0})</button>
                        <button className="text-blue-600 hover:underline">No ({review.notHelpfulCount || 0})</button>
                        <button className="text-blue-600 hover:underline">Report</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
          
          <button className="mt-4 text-blue-600 hover:underline font-medium">
            See all {reviewStats.totalReviews} reviews
          </button>
        </div>

        {/* Reviews Section */}
        {showReviews && (
          <div className="mt-12">
            <ProductReviews 
              productId={productId}
              reviews={reviews}
              productRating={reviewStats.averageRating || product.rating || 0}
              reviewCount={reviewStats.totalReviews || product.reviewCount || 0}
            />
          </div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-12">
            <ProductComments productId={productId} />
          </div>
        )}

        {/* Just for You - Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Just for You</h2>
                <p className="text-gray-600 dark:text-gray-400">Products you might also like from {product.category}</p>
              </div>
              <button 
                onClick={() => router.push(`/explore?category=${encodeURIComponent(product.category)}`)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors"
              >
                View all in {product.category}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedProducts.slice(0, 12).map((item: any, index: number) => (
                <div key={`related-${item.id}-${index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:shadow-md transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-gray-600"
                     onClick={() => router.push(`/product/${item.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={item.images?.[0] || '/placeholder-product.jpg'} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 h-8">{item.title}</h3>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-2.5 w-2.5 ${
                          i < Math.floor(item.rating || 4.0) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-green-600">${item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-400 line-through">${item.originalPrice}</div>
                    )}
                  </div>
                  {item.sellerId !== product.sellerId && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      by {item.sellerName}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Explore more button */}
            {relatedProducts.length > 0 && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => router.push(`/explore?category=${encodeURIComponent(product.category)}`)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Explore More in {product.category}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Infinite Scroll - More Products */}
        {moreProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Discover More Products</h2>
              <p className="text-gray-600 dark:text-gray-400">Keep scrolling to explore more amazing products</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {moreProducts.map((item: any, index: number) => (
                <div key={`more-${item.id}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"
                     onClick={() => router.push(`/product/${item.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={item.images?.[0] || '/placeholder-product.jpg'} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 h-8">{item.title}</h3>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-2.5 w-2.5 ${
                          i < Math.floor(item.rating || 4.0) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-green-600">${item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-400 line-through">${item.originalPrice}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    by {item.sellerName}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading indicator */}
            {loadingMore && (
              <div className="mt-8 text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading more products...</p>
              </div>
            )}
            
            {/* End message */}
            {!hasMoreProducts && moreProducts.length > 0 && (
              <div className="mt-8 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">You've reached the end!</p>
                <button 
                  onClick={() => router.push('/explore')}
                  className="mt-4 text-purple-600 hover:text-purple-800 font-medium hover:underline"
                >
                  Explore All Products →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Comment Dialog */}
        <CommentDialog 
          isOpen={showCommentDialog}
          onClose={() => setShowCommentDialog(false)}
          productId={productId}
        />
      </div>
    </div>
  );
}
