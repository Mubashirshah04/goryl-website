'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useCustomSession';
import { useUserProfileStore } from '@/store/userProfileStore';
import { 
  ArrowLeft, Upload, Camera, Package, DollarSign, 
  FileText, Tag, MapPin, Eye, X, Save, Plus, Video
} from 'lucide-react';
// Removed toast - using progress bar instead
import Link from 'next/link';
import { UploadProgressBar } from '@/components/UploadProgressBar';

export default function ProductUploadPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const { profile, loading: profileLoading, fetchProfile } = useUserProfileStore();
  const router = useRouter();
  const hasRun = useRef(false); // Ref to prevent multiple executions
  
  const [isSeller, setIsSeller] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    shortDescription: '',
    highlights: [] as string[],
    
    // Pricing
    price: 0,
    originalPrice: 0,
    specialPrice: 0,
    specialPriceStartDate: '',
    specialPriceEndDate: '',
    currency: 'USD',
    
    // Category & Brand
    category: '',
    subCategory: '',
    brand: '',
    
    // Product Details
    condition: 'new',
    recommendedAge: '',
    model: '',
    sku: '',
    
    // Attributes & Variants
    attributes: [] as { name: string; value: string }[],
    variants: [] as { 
      type: string; // size, color, material
      options: { name: string; price: number; stock: number }[] 
    }[],
    
    // Stock & Availability
    stock: 1,
    lowStockThreshold: 5,
    availability: 'in_stock' as 'in_stock' | 'out_of_stock' | 'pre_order',
    
    // Shipping
    shippingInfo: {
      dangerousGoods: 'none' as 'none' | 'battery' | 'flammables' | 'liquid',
      packageWeight: 0,
      packageDimensions: {
        length: 0,
        width: 0,
        height: 0
      },
      freeShipping: false,
      shippingCost: 0
    },
    
    // Warranty
    warrantyInfo: {
      hasWarranty: false,
      warrantyPeriod: '',
      warrantyType: 'manufacturer' as 'manufacturer' | 'seller' | 'none'
    },
    
    // Media
    images: [] as string[],
    video: '',
    
    // Other
    location: '',
    tags: [] as string[],
    
    // Special Offers & Policies
    specialOffers: [] as string[],
    returnPolicy: [] as string[],
    deliveryServices: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });
  const [newSpecialOffer, setNewSpecialOffer] = useState('');
  const [newReturnPolicy, setNewReturnPolicy] = useState('');
  const [newDeliveryService, setNewDeliveryService] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form

  // Check if user is a seller
  useEffect(() => {
    // Wait for auth state to be determined
    if (authLoading) return;
    
    // Prevent multiple executions
    if (hasRun.current) return;
    
    if (!user) {
      router.push('/auth-login');
      return;
    }

    // Mark as run
    hasRun.current = true;

    // Only run this effect once when user is authenticated
    const checkSellerStatus = async () => {
      try {
        // Fetch profile without forcing refresh to avoid loading state issues
        await fetchProfile(user.id || user.email);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    checkSellerStatus();
  }, [user?.id, authLoading, router]); // FIXED: removed fetchProfile from deps to prevent infinite loop

  useEffect(() => {
    if (profile) {
      // Include all seller account types - personal, brand, and company
      const sellerRoles = ['personal_seller', 'brand', 'company'];
      setIsSeller(sellerRoles.includes(profile.role));
      
      if (!sellerRoles.includes(profile.role)) {
        router.push('/');
      }
    }
  }, [profile, router]);

  // Load product data in edit mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      setIsEditMode(true);
      setEditProductId(editId);
      
      // Load product data from sessionStorage
      const editProductData = sessionStorage.getItem('editProduct');
      if (editProductData) {
        try {
          const productData = JSON.parse(editProductData);
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            shortDescription: productData.shortDescription || '',
            highlights: productData.highlights || [],
            price: productData.price || 0,
            originalPrice: productData.originalPrice || 0,
            specialPrice: productData.specialPrice || 0,
            specialPriceStartDate: productData.specialPriceStartDate || '',
            specialPriceEndDate: productData.specialPriceEndDate || '',
            currency: productData.currency || 'USD',
            category: productData.category || '',
            subCategory: productData.subCategory || '',
            brand: productData.brand || '',
            condition: productData.condition || 'new',
            recommendedAge: productData.recommendedAge || '',
            model: productData.model || '',
            sku: productData.sku || '',
            attributes: productData.attributes || [],
            variants: productData.variants || [],
            stock: productData.stock || 1,
            lowStockThreshold: productData.lowStockThreshold || 5,
            availability: productData.availability || 'in_stock',
            shippingInfo: productData.shippingInfo || {
              dangerousGoods: 'none',
              packageWeight: 0,
              packageDimensions: { length: 0, width: 0, height: 0 },
              freeShipping: false,
              shippingCost: 0
            },
            warrantyInfo: productData.warrantyInfo || {
              hasWarranty: false,
              warrantyPeriod: '',
              warrantyType: 'manufacturer'
            },
            images: productData.images || [],
            video: productData.video || '',
            location: productData.location || '',
            tags: productData.tags || [],
            specialOffers: productData.specialOffers || [],
            returnPolicy: productData.returnPolicy || [],
            deliveryServices: productData.deliveryServices || []
          });
        } catch (error) {
          console.error('Error loading product data:', error);
        }
      }
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = imageFiles.length + newFiles.length;

    if (totalImages > 5) {
      return;
    }

    // Validate file sizes (max 5MB per image to prevent memory issues)
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const file of newFiles) {
      if (file.size > maxSize) {
        return;
      }
    }

    // Create preview URLs
    const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...newFiles]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImageUrls]
    }));
  };

  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(formData.images[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video file (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return;
    }

    setVideoFile(file);
    const videoUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, video: videoUrl }));
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim() && !formData.highlights.includes(newHighlight.trim())) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()]
      }));
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const handleAddAttribute = () => {
    if (newAttribute.name.trim() && newAttribute.value.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }]
      }));
      setNewAttribute({ name: '', value: '' });
    }
  };

  const handleRemoveAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleShippingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        [field]: value
      }
    }));
  };

  const handleWarrantyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      warrantyInfo: {
        ...prev.warrantyInfo,
        [field]: value
      }
    }));
  };

  const handleAddSpecialOffer = () => {
    if (newSpecialOffer.trim() && !formData.specialOffers.includes(newSpecialOffer.trim())) {
      setFormData(prev => ({
        ...prev,
        specialOffers: [...prev.specialOffers, newSpecialOffer.trim()]
      }));
      setNewSpecialOffer('');
    }
  };

  const handleRemoveSpecialOffer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.filter((_, i) => i !== index)
    }));
  };

  const handleAddReturnPolicy = () => {
    if (newReturnPolicy.trim() && !formData.returnPolicy.includes(newReturnPolicy.trim())) {
      setFormData(prev => ({
        ...prev,
        returnPolicy: [...prev.returnPolicy, newReturnPolicy.trim()]
      }));
      setNewReturnPolicy('');
    }
  };

  const handleRemoveReturnPolicy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      returnPolicy: prev.returnPolicy.filter((_, i) => i !== index)
    }));
  };

  const handleAddDeliveryService = () => {
    if (newDeliveryService.trim() && !formData.deliveryServices.includes(newDeliveryService.trim())) {
      setFormData(prev => ({
        ...prev,
        deliveryServices: [...prev.deliveryServices, newDeliveryService.trim()]
      }));
      setNewDeliveryService('');
    }
  };

  const handleRemoveDeliveryService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliveryServices: prev.deliveryServices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user || !isSeller) return;

    // Validation
    if (!formData.name.trim()) {
      setUploadStatus('error');
      setUploadMessage('Product name is required');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }
    if (!formData.description.trim()) {
      setUploadStatus('error');
      setUploadMessage('Product description is required');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }
    if (formData.price <= 0) {
      setUploadStatus('error');
      setUploadMessage('Price must be greater than 0');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }
    if (!formData.category) {
      setUploadStatus('error');
      setUploadMessage('Please select a category');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }
    if (!formData.location.trim()) {
      setUploadStatus('error');
      setUploadMessage('Location is required');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }
    if (formData.images.length === 0 && imageFiles.length === 0) {
      setUploadStatus('error');
      setUploadMessage('Please upload at least one product image');
      setShowProgressBar(true);
      setTimeout(() => setShowProgressBar(false), 3000);
      return;
    }

    setUploading(true);
    setShowProgressBar(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadMessage('Preparing upload...');
    
    try {
      // Upload images to AWS S3
      const { uploadImage, uploadVideo } = await import('@/lib/awsS3Service');

      let imageUrls: string[] = [...formData.images]; // Keep existing images in edit mode
      
      const totalSteps = imageFiles.length + (videoFile ? 1 : 0) + 1; // Images + Video + Save to DB
      let completedSteps = 0;
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          setUploadMessage(`Uploading image ${i + 1}/${imageFiles.length}...`);
          
          const result = await uploadImage(
            file,
            user.sub,
            'products',
            (progress) => {
              // Calculate overall progress: (completed images * 100 + current image progress) / total steps
              const imageProgress = ((completedSteps * 100) + progress) / totalSteps;
              setUploadProgress(Math.min(imageProgress, 100));
            }
          );
          
          imageUrls.push(result.url);
          completedSteps++;
          setUploadProgress((completedSteps * 100) / totalSteps);
          console.log('✅ Image uploaded to S3:', result.url);
        }
      }

      // Upload video if selected
      let videoUrl: string | undefined;
      if (videoFile) {
        try {
          setUploadMessage('Uploading video...');
          const result = await uploadVideo(
            videoFile,
            user.sub,
            'products',
            (progress) => {
              // Calculate overall progress: (completed steps * 100 + video progress) / total steps
              const videoProgress = ((completedSteps * 100) + progress) / totalSteps;
              setUploadProgress(Math.min(videoProgress, 100));
            }
          );
          videoUrl = result.url;
          completedSteps++;
          setUploadProgress((completedSteps * 100) / totalSteps);
          console.log('✅ Video uploaded to S3:', videoUrl);
        } catch (error) {
          console.error('❌ Error uploading video:', error);
          // Continue without video
        }
      }

      // Create seller reference object for real-time compatibility
      const sellerRef = {
        id: user.sub,
        name: profile?.name || user.name || user.email?.split('@')[0] || 'Unknown',
        photoURL: profile?.customPhotoURL || profile?.photoURL || user.photoURL || ''
      };

      // Create/Update product in AWS DynamoDB
      const { createProduct, updateProduct } = await import('@/lib/hybridProductService');

      const productData = {
        title: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        highlights: formData.highlights,
        price: formData.price,
        originalPrice: formData.originalPrice,
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand,
        model: formData.model,
        sku: formData.sku,
        recommendedAge: formData.recommendedAge,
        location: formData.location,
        tags: formData.tags,
        stock: formData.stock,
        images: imageUrls,
        video: videoUrl,
        sellerId: user.sub,
        sellerName: profile?.name || user.name || user.email?.split('@')[0] || 'Unknown',
        sellerPhoto: profile?.customPhotoURL || profile?.photoURL || user.photoURL || '',
        seller: {
          id: user.sub,
          name: profile?.name || user.name || user.email?.split('@')[0] || 'Unknown',
          avatar: profile?.customPhotoURL || profile?.photoURL || user.photoURL || '',
          isVerified: profile?.verified || false,
          rating: profile?.rating || 0
        },
        status: 'pending' as const, // Pending admin approval
        likes: [],
        views: 0,
        rating: 0,
        reviewCount: 0,
      };

      // Save to DynamoDB
      setUploadMessage('Saving product...');
      setUploadProgress(90); // Almost done, just saving

      if (isEditMode && editProductId) {
        // Update existing product in DynamoDB
        await updateProduct(editProductId, productData);
        console.log('✅ PRODUCT UPDATE: Product updated in DynamoDB with ID:', editProductId);
        
        setUploadProgress(100);
        setUploadStatus('success');
        setUploadMessage('Product updated successfully!');
        sessionStorage.removeItem('editProduct');
        
        // Smooth redirect like YouTube
        setTimeout(() => {
          setShowProgressBar(false);
          router.push(`/product/${editProductId}`);
        }, 1500);
      } else {
        // Create new product in DynamoDB
        const productId = await createProduct(productData);
        console.log('✅ PRODUCT UPLOAD: Product created in DynamoDB with ID:', productId);
        
        setUploadProgress(100);
        setUploadStatus('success');
        setUploadMessage('Product uploaded successfully! It will be reviewed by admin.');
        
        // Send notification that upload is under review
        try {
          const { sendUploadUnderReviewNotification } = await import('@/lib/notificationService');
          await sendUploadUnderReviewNotification(
            user.sub,
            'product',
            formData.name,
            productId
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
        
        // Smooth redirect to homepage like YouTube
        setTimeout(() => {
          setShowProgressBar(false);
          router.push('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Error uploading product:', error);
      
      setUploadStatus('error');
      setUploadProgress(0);
      
      // Show detailed error message
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      
      // Check for specific error types
      if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
        setUploadMessage('Server error. Please try again in a moment.');
      } else if (errorMessage.includes('credentials') || errorMessage.includes('AWS')) {
        setUploadMessage('AWS configuration error. Please check your AWS credentials.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setUploadMessage('Network error. Please check your internet connection.');
      } else if (errorMessage.includes('size') || errorMessage.includes('too large')) {
        setUploadMessage('File too large. Please reduce file size and try again.');
      } else {
        setUploadMessage(`Upload failed: ${errorMessage}`);
      }
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowProgressBar(false);
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  // Show loading state only when loading and no profile data yet (avoid flicker)
  if ((authLoading && !user) || (profileLoading && !profile)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login first</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be authenticated to upload products</p>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seller Access Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Only sellers can upload products</p>
          <Link 
            href="/seller-center"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Join Seller Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? 'Edit Product' : 'Upload Product'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditMode ? 'Update your product details' : 'Add a new product to your store'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Pricing' },
              { num: 3, label: 'Details' },
              { num: 4, label: 'Shipping' },
              { num: 5, label: 'Media' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex flex-col items-center ${idx > 0 ? 'ml-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.num 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.num}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 hidden md:block">{step.label}</span>
                </div>
                {idx < 4 && (
                  <div className={`h-1 w-12 md:w-24 mx-2 ${
                    currentStep > step.num ? 'bg-purple-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing & Fashion</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports & Outdoors</option>
                  <option value="books">Books & Media</option>
                  <option value="automotive">Automotive</option>
                  <option value="health">Health & Beauty</option>
                  <option value="toys">Toys & Games</option>
                  <option value="jewelry">Jewelry & Watches</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Brief product summary (max 200 characters)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.shortDescription.length}/200 characters</p>
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your product in detail..."
              />
            </div>

            {/* Product Highlights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Highlights
              </label>
              <div className="space-y-2 mb-3">
                {formData.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm">{highlight}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(idx)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add a product highlight"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Brand, Model, SKU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Model number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Stock keeping unit"
                />
              </div>
            </div>

            {/* Recommended Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommended Age
              </label>
              <input
                type="text"
                value={formData.recommendedAge}
                onChange={(e) => handleInputChange('recommendedAge', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 3+ years, Adults only, All ages"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📦 Shipping Information</h3>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dangerous Goods Classification
                </label>
                <select
                  value={formData.shippingInfo.dangerousGoods}
                  onChange={(e) => handleShippingChange('dangerousGoods', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="none">None</option>
                  <option value="battery">Contains Battery</option>
                  <option value="flammables">Flammable Materials</option>
                  <option value="liquid">Liquid Products</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.shippingInfo.packageWeight}
                  onChange={(e) => handleShippingChange('packageWeight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            {/* Package Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={formData.shippingInfo.packageDimensions.length}
                  onChange={(e) => handleShippingChange('packageDimensions', {
                    ...formData.shippingInfo.packageDimensions,
                    length: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Length"
                  min="0"
                />
                <input
                  type="number"
                  value={formData.shippingInfo.packageDimensions.width}
                  onChange={(e) => handleShippingChange('packageDimensions', {
                    ...formData.shippingInfo.packageDimensions,
                    width: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Width"
                  min="0"
                />
                <input
                  type="number"
                  value={formData.shippingInfo.packageDimensions.height}
                  onChange={(e) => handleShippingChange('packageDimensions', {
                    ...formData.shippingInfo.packageDimensions,
                    height: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Height"
                  min="0"
                />
              </div>
            </div>

            {/* Free Shipping & Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="freeShipping"
                  checked={formData.shippingInfo.freeShipping}
                  onChange={(e) => handleShippingChange('freeShipping', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="freeShipping" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Offer Free Shipping
                </label>
              </div>

              {!formData.shippingInfo.freeShipping && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shipping Cost ($)
                  </label>
                  <input
                    type="number"
                    value={formData.shippingInfo.shippingCost}
                    onChange={(e) => handleShippingChange('shippingCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛡️ Warranty Information</h3>
            </div>

            {/* Warranty */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="hasWarranty"
                checked={formData.warrantyInfo.hasWarranty}
                onChange={(e) => handleWarrantyChange('hasWarranty', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="hasWarranty" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Product has warranty
              </label>
            </div>

            {formData.warrantyInfo.hasWarranty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warranty Period
                  </label>
                  <input
                    type="text"
                    value={formData.warrantyInfo.warrantyPeriod}
                    onChange={(e) => handleWarrantyChange('warrantyPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 1 year, 6 months, 90 days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warranty Type
                  </label>
                  <select
                    value={formData.warrantyInfo.warrantyType}
                    onChange={(e) => handleWarrantyChange('warrantyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="manufacturer">Manufacturer Warranty</option>
                    <option value="seller">Seller Warranty</option>
                    <option value="none">No Warranty</option>
                  </select>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎁 Special Offers & Policies</h3>
            </div>

            {/* Special Offers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Offers (Optional)
              </label>
              <div className="space-y-2 mb-3">
                {formData.specialOffers.map((offer, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="flex-1 text-sm text-orange-800">{offer}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialOffer(idx)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialOffer}
                  onChange={(e) => setNewSpecialOffer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialOffer())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Bank Offer: 10% instant discount on HDFC Cards"
                />
                <button
                  type="button"
                  onClick={handleAddSpecialOffer}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add special offers like bank discounts, EMI, exchange offers, etc.</p>
            </div>

            {/* Return Policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Return Policy (Optional)
              </label>
              <div className="space-y-2 mb-3">
                {formData.returnPolicy.map((policy, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="flex-1 text-sm text-blue-800">{policy}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReturnPolicy(idx)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReturnPolicy}
                  onChange={(e) => setNewReturnPolicy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReturnPolicy())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 30-day return window from delivery date"
                />
                <button
                  type="button"
                  onClick={handleAddReturnPolicy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add return policy terms like return window, conditions, refund process, etc.</p>
            </div>

            {/* Delivery Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delivery Services (Optional)
              </label>
              <div className="space-y-2 mb-3">
                {formData.deliveryServices.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <span className="flex-1 text-sm text-green-800">{service}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliveryService(idx)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeliveryService}
                  onChange={(e) => setNewDeliveryService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliveryService())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Express delivery available (1-2 business days)"
                />
                <button
                  type="button"
                  onClick={handleAddDeliveryService}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add delivery services like express delivery, same-day delivery, tracking, etc.</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📸 Product Media</h3>
            </div>

            {/* Product Video */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Video (Optional, Max 50MB)
              </label>
              {formData.video ? (
                <div className="mb-4">
                  <video src={formData.video} controls className="w-full max-h-64 rounded-lg border border-gray-300" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({...prev, video: ''}));
                      setVideoFile(null);
                    }}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove Video
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors bg-gray-50 dark:bg-gray-900"
                  >
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300">Click to upload video</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">MP4, MOV, AVI (Max 50MB)</p>
                  </button>
                </>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Images (Max 5, Max 5MB each)
              </label>
              
              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {formData.images.length < 5 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors bg-gray-50 dark:bg-gray-900"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300">Click to upload images</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {formData.images.length}/5 images uploaded
                    </p>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update Product' : 'Upload Product'}
                  </>
                )}
              </button>
            </div>

            {/* Upload Progress Bar - Below Button */}
            <UploadProgressBar
              isVisible={showProgressBar}
              progress={uploadProgress}
              status={uploadStatus}
              message={uploadMessage}
              onClose={() => setShowProgressBar(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}