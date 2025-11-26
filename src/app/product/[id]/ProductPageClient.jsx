'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, increment, onSnapshot, collection, query, where, getDocs, limit, addDoc, deleteDoc } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { ArrowLeft, Share2, Star, ShoppingCart, Heart, MessageCircle, Star as StarIcon, Truck, Shield, RotateCcw, Award, CheckCircle, Zap, Tag, Eye } from 'lucide-react';
import { ProductImageGallery } from '@/components/ProductImageGallery';
import ProductReviews from '@/components/ProductReviews';
import ProductComments from '@/components/ProductComments';
import LoadingSpinner from '@/components/LoadingSpinner';
export default function ProductPageClient({ productId }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const router = useRouter();
    const { user } = useAuthStore();
    const { addToCart } = useCartStore();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [reviewStats, setReviewStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [buyerGallery, setBuyerGallery] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    // const { similarProducts, loading: similarLoading } = useSimilarProducts(product?.category || '', productId);
    useEffect(() => {
        console.log('🔥 PRODUCT CLIENT: useEffect triggered');
        console.log('🔥 PRODUCT CLIENT: productId prop:', JSON.stringify(productId));
        console.log('🔥 PRODUCT CLIENT: productId type:', typeof productId);
        console.log('🔥 PRODUCT CLIENT: productId length:', productId === null || productId === void 0 ? void 0 : productId.length);
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
            const productRef = doc(db, 'products', trimmedId);
            console.log('✅ PRODUCT CLIENT: Successfully created Firestore reference');
            const unsubscribe = onSnapshot(productRef, (doc) => {
                if (doc.exists()) {
                    const productData = Object.assign({ id: doc.id }, doc.data());
                    console.log('🔥 PRODUCT DATA:', {
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
                        updateDoc(productRef, {
                            viewCount: increment(1)
                        }).then(() => {
                            console.log('✅ VIEW COUNT UPDATED successfully');
                        }).catch((error) => {
                            console.error('❌ VIEW COUNT UPDATE FAILED:', error);
                        });
                        sessionStorage.setItem(viewedKey, 'true');
                    }
                    else {
                        console.log('🔥 VIEW ALREADY COUNTED for session:', trimmedId);
                    }
                }
                else {
                    setError('Product not found');
                }
                setLoading(false);
            }, (error) => {
                console.error('Error fetching product:', error);
                setError('Failed to load product');
                setLoading(false);
            });
            return () => unsubscribe();
        }
        catch (error) {
            console.error('Error creating Firestore reference:', error);
            setError('Failed to create product reference');
            setLoading(false);
        }
    }, [productId]);
    // Fetch reviews, Q&A, buyer gallery, and related products
    useEffect(() => {
        if (!productId || !product)
            return;
        const fetchProductData = async () => {
            try {
                console.log('🔍 Fetching product data for:', productId);
                // Fetch reviews with images for buyer gallery
                const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', productId), limit(20));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const reviewsData = reviewsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                // Sort reviews by createdAt in JavaScript
                reviewsData.sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    }
                    return 0;
                });
                setReviews(reviewsData);
                // Extract buyer gallery images from reviews
                const galleryImages = [];
                reviewsData.forEach((review) => {
                    if (review.images && Array.isArray(review.images)) {
                        galleryImages.push(...review.images);
                    }
                });
                setBuyerGallery(galleryImages.slice(0, 12)); // Limit to 12 images
                // Calculate review stats
                if (reviewsData.length > 0) {
                    const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
                    const avgRating = totalRating / reviewsData.length;
                    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                    reviewsData.forEach((review) => {
                        const rating = review.rating || 0;
                        if (rating >= 1 && rating <= 5) {
                            breakdown[rating]++;
                        }
                    });
                    setReviewStats({
                        averageRating: avgRating,
                        totalReviews: reviewsData.length,
                        ratingBreakdown: breakdown
                    });
                }
                // Fetch Q&A
                const questionsQuery = query(collection(db, 'questions'), where('productId', '==', productId), limit(5));
                const questionsSnapshot = await getDocs(questionsQuery);
                const questionsData = questionsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                // Sort questions by createdAt in JavaScript
                questionsData.sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    }
                    return 0;
                });
                setQuestions(questionsData);
                // Fetch seller's other products
                if (product.sellerId) {
                    const sellerProductsQuery = query(collection(db, 'products'), where('sellerId', '==', product.sellerId), where('status', '==', 'active'), limit(8));
                    const sellerProductsSnapshot = await getDocs(sellerProductsQuery);
                    const sellerProductsData = sellerProductsSnapshot.docs
                        .map(doc => (Object.assign({ id: doc.id }, doc.data())))
                        .filter((p) => p.id !== productId); // Exclude current product
                    setSellerProducts(sellerProductsData);
                }
                // Fetch related products from same category
                if (product.category) {
                    const relatedProductsQuery = query(collection(db, 'products'), where('category', '==', product.category), where('status', '==', 'active'), limit(12));
                    const relatedProductsSnapshot = await getDocs(relatedProductsQuery);
                    const relatedProductsData = relatedProductsSnapshot.docs
                        .map(doc => (Object.assign({ id: doc.id }, doc.data())))
                        .filter((p) => p.id !== productId); // Exclude current product
                    setRelatedProducts(relatedProductsData);
                }
            }
            catch (error) {
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
    // Check like status
    useEffect(() => {
        if (!product || !user)
            return;
        const checkLikeStatus = async () => {
            try {
                const likeQuery = query(collection(db, 'likes'), where('userId', '==', user.sub), where('productId', '==', productId), where('type', '==', 'product'));
                const likeSnapshot = await getDocs(likeQuery);
                setIsLiked(!likeSnapshot.empty);
            }
            catch (error) {
                console.error('Error checking like status:', error);
            }
        };
        checkLikeStatus();
    }, [product, user, productId]);
    const handleAddToCart = async () => {
        var _a, _b, _c;
        if (!product || !user) {
            toast.error('Please login to add items to cart');
            return;
        }
        const availableStock = (_c = (_b = (_a = product.inventory) === null || _a === void 0 ? void 0 : _a.available) !== null && _b !== void 0 ? _b : product.stock) !== null && _c !== void 0 ? _c : 0;
        if (availableStock < quantity) {
            toast.error('Not enough stock available');
            return;
        }
        try {
            // Ensure product has required properties for cart
            const cartProduct = Object.assign(Object.assign({}, product), { images: product.images || [], stock: product.stock || 0 });
            await addToCart(cartProduct, quantity);
            toast.success('Added to cart!');
        }
        catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };
    const handleBuyNow = async () => {
        var _a, _b, _c;
        if (!product || !user) {
            toast.error('Please login to buy now');
            return;
        }
        const availableStock = (_c = (_b = (_a = product.inventory) === null || _a === void 0 ? void 0 : _a.available) !== null && _b !== void 0 ? _b : product.stock) !== null && _c !== void 0 ? _c : 0;
        if (availableStock < quantity) {
            toast.error('Not enough stock available');
            return;
        }
        try {
            // Add to cart first
            const cartProduct = Object.assign(Object.assign({}, product), { images: product.images || [], stock: product.stock || 0 });
            await addToCart(cartProduct, quantity);
            // Show success message
            toast.success('Product added to cart!');
            // Small delay to ensure cart is updated before redirecting
            setTimeout(() => {
                router.push('/checkout');
            }, 500);
        }
        catch (error) {
            console.error('Error in buy now:', error);
            toast.error('Failed to process buy now');
        }
    };
    const handleLike = async () => {
        if (!product || !user || !productId || productId.trim() === '')
            return;
        const newLikedState = !isLiked;
        const increment_value = newLikedState ? 1 : -1;
        try {
            // Update local state immediately for better UX
            setIsLiked(newLikedState);
            setLikeCount(prev => prev + increment_value);
            if (newLikedState) {
                // Add like to likes collection
                await addDoc(collection(db, 'likes'), {
                    userId: user.sub,
                    productId: productId,
                    type: 'product',
                    createdAt: new Date()
                });
            }
            else {
                // Remove like from likes collection
                const likeQuery = query(collection(db, 'likes'), where('userId', '==', user.sub), where('productId', '==', productId), where('type', '==', 'product'));
                const likeSnapshot = await getDocs(likeQuery);
                const deletePromises = likeSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            }
            // Update product like count
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, {
                likeCount: increment(increment_value)
            });
            toast.success(newLikedState ? 'Added to favorites!' : 'Removed from favorites!');
        }
        catch (error) {
            // Revert local state on error
            setIsLiked(!newLikedState);
            setLikeCount(prev => prev - increment_value);
            console.error('Error updating like:', error);
            toast.error('Failed to update like');
        }
    };
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product === null || product === void 0 ? void 0 : product.title,
                    text: product === null || product === void 0 ? void 0 : product.description,
                    url: window.location.href,
                });
            }
            catch (error) {
                console.error('Error sharing:', error);
            }
        }
        else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>);
    }
    if (error || !product) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.back()} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="h-5 w-5 mr-2"/>
              Back
            </button>
            
            <div className="flex items-center space-x-4">
              <button onClick={handleShare} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Share2 className="h-5 w-5 mr-2"/>
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
            <ProductImageGallery images={product.images} title={product.title}/>
            
            {/* Buyer Gallery - Customer Review Images */}
            {buyerGallery.length > 0 && (<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                  Customer Photos ({buyerGallery.length})
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {buyerGallery.map((image, index) => (<div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity cursor-pointer">
                      <img src={image} alt={`Customer photo ${index + 1}`} className="w-full h-full object-cover" onClick={() => {
                    // Open image in modal or lightbox
                    window.open(image, '_blank');
                }}/>
                    </div>))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Real photos from verified buyers
                </p>
              </div>)}
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
                  {reviewStats.averageRating > 0 && <Star className="h-3 w-3 ml-1 fill-current"/>}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {reviewStats.totalReviews} ratings & {reviews.length} reviews
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {product.viewCount || 0} views
                </span>
              </div>

              {/* Special Offers */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">Special Offers</h3>
                <div className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                  <div>• Bank Offer: 10% instant discount on HDFC Bank Credit Cards</div>
                  <div>• No Cost EMI: Available on orders above $50</div>
                  <div>• Exchange Offer: Up to $25 off on exchange</div>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (<>
                    <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm px-2 py-1 rounded">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </span>
                  </>)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Inclusive of all taxes • FREE delivery by tomorrow
              </div>
            </div>

            {/* Delivery & Services */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Delivery & Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-green-600"/>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Free Delivery</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tomorrow by 10 AM</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600"/>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">2 Year Warranty</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Know More</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="h-5 w-5 text-orange-600"/>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">7 Days Return</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Change of mind applicable</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-purple-600"/>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Zaillisy Assured</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quality checked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Highlights */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600"/>
                Product Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600"/>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Premium Quality</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">High-grade materials and construction</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
                    <Zap className="h-4 w-4 text-blue-600"/>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Latest Technology</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Advanced features and innovation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-1">
                    <Shield className="h-4 w-4 text-purple-600"/>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Reliable & Durable</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Built to last with quality assurance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-1">
                    <Star className="h-4 w-4 text-orange-600"/>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Customer Favorite</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Highly rated by verified buyers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Short Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {((_a = product.description) === null || _a === void 0 ? void 0 : _a.length) > 200
            ? `${product.description.substring(0, 200)}...`
            : product.description || "High-quality product with excellent features and reliable performance."}
              </p>
            </div>

            {/* Technical Specifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Technical Specifications</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="px-4 py-3 flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Brand</span>
                    <span className="text-gray-700 dark:text-gray-300">{product.sellerName}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                    <span className="font-medium text-gray-900 dark:text-white">Model</span>
                    <span className="text-gray-700 dark:text-gray-300">{product.title}</span>
                  </div>
                  {((_b = product.metadata) === null || _b === void 0 ? void 0 : _b.weight) && (<div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Weight</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.weight}g</span>
                    </div>)}
                  {((_c = product.metadata) === null || _c === void 0 ? void 0 : _c.dimensions) && (<div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Dimensions</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {product.metadata.dimensions.length} × {product.metadata.dimensions.width} × {product.metadata.dimensions.height} cm
                      </span>
                    </div>)}
                  {((_d = product.metadata) === null || _d === void 0 ? void 0 : _d.materials) && product.metadata.materials.length > 0 && (<div className="px-4 py-3 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Materials</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.materials.join(', ')}</span>
                    </div>)}
                  {((_e = product.metadata) === null || _e === void 0 ? void 0 : _e.colors) && product.metadata.colors.length > 0 && (<div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">Available Colors</span>
                      <span className="text-gray-700 dark:text-gray-300">{product.metadata.colors.join(', ')}</span>
                    </div>)}
                  <div className="px-4 py-3 flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Warranty</span>
                    <span className="text-gray-700 dark:text-gray-300">2 Years Manufacturer Warranty</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between bg-gray-50 dark:bg-gray-800">
                    <span className="font-medium text-gray-900 dark:text-white">Country of Origin</span>
                    <span className="text-gray-700 dark:text-gray-300">USA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${((_h = (_g = (_f = product.inventory) === null || _f === void 0 ? void 0 : _f.available) !== null && _g !== void 0 ? _g : product.stock) !== null && _h !== void 0 ? _h : 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {(() => {
            var _a, _b, _c;
            const availableStock = (_c = (_b = (_a = product.inventory) === null || _a === void 0 ? void 0 : _a.available) !== null && _b !== void 0 ? _b : product.stock) !== null && _c !== void 0 ? _c : 0;
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
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">{quantity}</span>
                  <button onClick={() => { var _a, _b, _c; return setQuantity(Math.min((_c = (_b = (_a = product.inventory) === null || _a === void 0 ? void 0 : _a.available) !== null && _b !== void 0 ? _b : product.stock) !== null && _c !== void 0 ? _c : 1, quantity + 1)); }} className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Only {(_l = (_k = (_j = product.inventory) === null || _j === void 0 ? void 0 : _j.available) !== null && _k !== void 0 ? _k : product.stock) !== null && _l !== void 0 ? _l : 0} left in stock
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button onClick={handleAddToCart} disabled={((_p = (_o = (_m = product.inventory) === null || _m === void 0 ? void 0 : _m.available) !== null && _o !== void 0 ? _o : product.stock) !== null && _p !== void 0 ? _p : 0) === 0} className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold">
                  <ShoppingCart className="h-5 w-5 mr-2"/>
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} disabled={((_s = (_r = (_q = product.inventory) === null || _q === void 0 ? void 0 : _q.available) !== null && _r !== void 0 ? _r : product.stock) !== null && _s !== void 0 ? _s : 0) === 0} className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold">
                  <Zap className="h-5 w-5 mr-2"/>
                  Buy Now
                </button>
              </div>

              {/* EMI Options */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-blue-600"/>
                  <span className="font-medium text-blue-800 dark:text-blue-200">EMI Options Available</span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Starting from ${(product.price / 12).toFixed(2)}/month. No Cost EMI available
                </div>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleLike} className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${isLiked
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`}/>
                <span className="text-sm">{likeCount}</span>
              </button>

              <button className="flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <Share2 className="h-4 w-4 mr-2"/>
                <span className="text-sm">Share</span>
              </button>

              <button className="flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <Eye className="h-4 w-4 mr-2"/>
                <span className="text-sm">Compare</span>
              </button>
            </div>

            {/* Reviews & Comments Toggle */}
            <div className="flex space-x-4 pt-4">
              <button onClick={() => setShowReviews(!showReviews)} className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <StarIcon className="h-4 w-4 mr-2"/>
                <span className="text-sm">Reviews ({reviewStats.totalReviews})</span>
              </button>

              <button onClick={() => setShowComments(!showComments)} className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <MessageCircle className="h-4 w-4 mr-2"/>
                <span className="text-sm">Q&A ({questions.length || 0})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visit Store - Seller's Products */}
        {sellerProducts.length > 0 && (<div className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Visit {product.sellerName}'s Store</h2>
                <p className="text-gray-600 dark:text-gray-400">Discover more amazing products from this seller</p>
              </div>
              <button onClick={() => router.push(`/shop/${product.sellerId}`)} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                Visit Store
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sellerProducts.slice(0, 8).map((item) => {
                var _a;
                return (<div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105" onClick={() => router.push(`/product/${item.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
                    <img src={((_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) || '/placeholder-product.jpg'} alt={item.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"/>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 h-10">{item.title}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < Math.floor(item.rating || 4.0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'}`}/>))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600">${item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (<div className="text-xs text-gray-500 line-through">${item.originalPrice}</div>)}
                  </div>
                </div>);
            })}
            </div>
            
            <div className="mt-6 text-center">
              <button onClick={() => router.push(`/shop/${product.sellerId}`)} className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline transition-colors">
                View all {sellerProducts.length}+ products from {product.sellerName} →
              </button>
            </div>
          </div>)}

        {/* Detailed Product Description */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detailed Product Description</h2>
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">
              {product.description || "This premium product offers exceptional quality and performance. Designed with attention to detail and built to last, it provides excellent value for your investment. Whether you're a professional or enthusiast, this product delivers the reliability and functionality you need."}
            </div>
            
            {/* Key Features from Product Data */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {((_u = (_t = product.metadata) === null || _t === void 0 ? void 0 : _t.features) === null || _u === void 0 ? void 0 : _u.length) > 0 ? (product.metadata.features.map((feature, index) => (<div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>))) : (<>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Premium quality construction</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Advanced technology integration</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Energy efficient design</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-gray-700 dark:text-gray-300">User-friendly interface</span>
                    </div>
                  </>)}
              </div>
            </div>

            {/* What's in the Box */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Package Contents:</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>1x {product.title}</span>
                  </li>
                  {((_w = (_v = product.metadata) === null || _v === void 0 ? void 0 : _v.packageContents) === null || _w === void 0 ? void 0 : _w.length) > 0 ? (product.metadata.packageContents.map((item, index) => (<li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{item}</span>
                      </li>))) : (<>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>User Manual & Quick Start Guide</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Warranty Card</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Customer Support Information</span>
                      </li>
                    </>)}
                </ul>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage & Care Instructions:</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Read all instructions carefully before first use</li>
                  <li>• Keep in a clean, dry environment when not in use</li>
                  <li>• Regular maintenance ensures optimal performance</li>
                  <li>• Contact customer support for any technical issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Returns */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Shipping & Returns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600"/>
                Shipping Information
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>• Free standard delivery on orders over $25</div>
                <div>• Express delivery available (1-2 business days)</div>
                <div>• International shipping to 50+ countries</div>
                <div>• Order processing time: 1-2 business days</div>
                <div>• Tracking information provided via email</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <RotateCcw className="h-5 w-5 mr-2 text-blue-600"/>
                Return Policy
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>• 30-day return window from delivery date</div>
                <div>• Items must be in original condition</div>
                <div>• Free return shipping on defective items</div>
                <div>• Refund processed within 5-7 business days</div>
                <div>• Exchange available for different size/color</div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Questions & Answers</h2>
          <div className="space-y-6">
            {questions.length > 0 ? (questions.map((question) => (<div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Q: </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{question.question}</span>
                  </div>
                  {question.answer && (<div className="ml-4">
                      <span className="text-sm font-medium text-blue-600">A: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{question.answer}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        By {question.answeredBy || product.sellerName} • {question.answeredAt ?
                    new Date(question.answeredAt.toDate()).toLocaleDateString() :
                    'Recently'}
                      </div>
                    </div>)}
                </div>))) : (<div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No questions yet for this product</p>
                <p className="text-sm text-gray-400">Be the first to ask a question!</p>
              </div>)}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => {
            if (!user) {
                toast.error('Please login to ask a question');
                return;
            }
            // Add question functionality here
            toast.info('Question form will be implemented soon');
        }} className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors">
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
                    {[...Array(5)].map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.floor(reviewStats.averageRating > 0 ? reviewStats.averageRating : 0)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'}`}/>))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reviewStats.totalReviews} global ratings
                  </div>
                </div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviewStats.ratingBreakdown[stars] || 0;
            const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
            return (<div key={stars} className="flex items-center space-x-3">
                      <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {stars} star
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(percentage)}%
                      </span>
                    </div>);
        })}
              </div>
            </div>

            {/* Review Highlights */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Review highlights</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Most mentioned positive</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">"Great quality and fast delivery"</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-1">Value for money</div>
                  <div className="text-sm text-green-700 dark:text-green-300">"Excellent product at this price point"</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="font-medium text-purple-800 dark:text-purple-200 mb-1">Build quality</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">"Solid construction and durable materials"</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customer Reviews */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top customer reviews</h3>
          <div className="space-y-6">
            {reviews.length > 0 ? (reviews.slice(0, 3).map((review) => (<div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-start space-x-4">
                    <img src={review.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.userName || 'user')}`} alt={review.userName || 'Reviewer'} className="w-10 h-10 rounded-full"/>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{review.userName || 'Anonymous'}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < (review.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'}`}/>))}
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
                </div>))) : (<div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>)}
          </div>
          
          <button className="mt-4 text-blue-600 hover:underline font-medium">
            See all {reviewStats.totalReviews} reviews
          </button>
        </div>

        {/* Reviews Section */}
        {showReviews && (<div className="mt-12">
            <ProductReviews productId={productId} reviews={reviews} productRating={reviewStats.averageRating || product.rating || 0} reviewCount={reviewStats.totalReviews || product.reviewCount || 0}/>
          </div>)}

        {/* Comments Section */}
        {showComments && (<div className="mt-12">
            <ProductComments productId={productId}/>
          </div>)}

        {/* Just for You - Related Products */}
        {relatedProducts.length > 0 && (<div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Just for You</h2>
                <p className="text-gray-600 dark:text-gray-400">Products you might also like from {product.category}</p>
              </div>
              <button onClick={() => router.push(`/explore?category=${encodeURIComponent(product.category)}`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors">
                View all in {product.category}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedProducts.slice(0, 12).map((item) => {
                var _a;
                return (<div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:shadow-md transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-gray-600" onClick={() => router.push(`/product/${item.id}`)}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
                    <img src={((_a = item.images) === null || _a === void 0 ? void 0 : _a[0]) || '/placeholder-product.jpg'} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                  </div>
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 h-8">{item.title}</h3>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (<Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(item.rating || 4.0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'}`}/>))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-green-600">${item.price}</div>
                    {item.originalPrice && item.originalPrice > item.price && (<div className="text-xs text-gray-400 line-through">${item.originalPrice}</div>)}
                  </div>
                  {item.sellerId !== product.sellerId && (<div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      by {item.sellerName}
                    </div>)}
                </div>);
            })}
            </div>
            
            {/* Explore more button */}
            {relatedProducts.length > 0 && (<div className="mt-6 text-center">
                <button onClick={() => router.push(`/explore?category=${encodeURIComponent(product.category)}`)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Explore More in {product.category}
                </button>
              </div>)}
          </div>)}
      </div>
    </div>);
}

