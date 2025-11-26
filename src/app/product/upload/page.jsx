'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { ArrowLeft, Upload, Camera, Package, X, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
export default function ProductUploadPage() {
    const { user, loading: authLoading, refreshUserData } = useAuthStore();
    const { profile, loading: profileLoading, fetchProfile } = useUserProfileStore();
    const router = useRouter();
    const hasRun = useRef(false); // Ref to prevent multiple executions
    const [isSeller, setIsSeller] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        category: '',
        condition: 'new',
        location: '',
        tags: [],
        stock: 1,
        images: []
    });
    const [newTag, setNewTag] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const fileInputRef = useRef(null);
    // Check if user is a seller
    useEffect(() => {
        // Wait for auth state to be determined
        if (authLoading)
            return;
        // Prevent multiple executions
        if (hasRun.current)
            return;
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
                await fetchProfile(user.sub);
            }
            catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile information');
            }
        };
        checkSellerStatus();
    }, [user === null || user === void 0 ? void 0 : user.sub, authLoading, router]); // FIXED: removed fetchProfile from deps to prevent infinite loop
    useEffect(() => {
        if (profile) {
            // Include all seller account types - personal, brand, and company
            const sellerRoles = ['personal_seller', 'brand', 'company'];
            setIsSeller(sellerRoles.includes(profile.role));
            if (!sellerRoles.includes(profile.role)) {
                toast.error('Only sellers can upload products');
                router.push('/');
            }
        }
    }, [profile, router]);
    const handleInputChange = (field, value) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => (Object.assign(Object.assign({}, prev), { tags: [...prev.tags, newTag.trim()] })));
            setNewTag('');
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { tags: prev.tags.filter(tag => tag !== tagToRemove) })));
    };
    const handleImageSelect = (e) => {
        const files = e.target.files;
        if (!files)
            return;
        const newFiles = Array.from(files);
        const totalImages = imageFiles.length + newFiles.length;
        if (totalImages > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }
        // Validate file sizes (max 5MB per image to prevent memory issues)
        const maxSize = 5 * 1024 * 1024; // 5MB
        for (const file of newFiles) {
            if (file.size > maxSize) {
                toast.error(`${file.name} is too large. Max 5MB per image`);
                return;
            }
        }
        // Create preview URLs
        const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
        setImageFiles(prev => [...prev, ...newFiles]);
        setFormData(prev => (Object.assign(Object.assign({}, prev), { images: [...prev.images, ...newImageUrls] })));
    };
    const handleRemoveImage = (index) => {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(formData.images[index]);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => (Object.assign(Object.assign({}, prev), { images: prev.images.filter((_, i) => i !== index) })));
    };
    const handleSubmit = async () => {
        if (!user || !isSeller)
            return;
        // Validation
        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Product description is required');
            return;
        }
        if (formData.price <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        if (!formData.location.trim()) {
            toast.error('Location is required');
            return;
        }
        if (formData.images.length === 0) {
            toast.error('Please upload at least one product image');
            return;
        }
        setUploading(true);
        try {
            // Upload images to S3 via firebaseStorage wrapper
            const { uploadImage } = await import('@/lib/firebaseStorage');
            const { collection, addDoc, serverTimestamp } = await import('@/lib/firestore');
            const { db } = await import('@/lib/firebase');
            const imageUrls = [];
            // Upload each image
            for (let i = 0; i < imageFiles.length; i++) {
              const file = imageFiles[i];
              const res = await uploadImage(file, user.sub);
              imageUrls.push(res.url);
            }
            // Create seller reference object for real-time compatibility
            const sellerRef = {
                id: user.sub,
                name: (profile === null || profile === void 0 ? void 0 : profile.name) || user.displayName || 'Unknown',
                photoURL: (profile === null || profile === void 0 ? void 0 : profile.customPhotoURL) || (profile === null || profile === void 0 ? void 0 : profile.photoURL) || user.photoURL || ''
            };
            // Create product document in Firestore with proper structure
            const productData = {
                title: formData.name,
                description: formData.description,
                price: formData.price,
                category: formData.category,
                condition: formData.condition,
                location: formData.location,
                tags: formData.tags,
                stock: formData.stock,
                inventory: {
                    total: formData.stock,
                    available: formData.stock,
                    reserved: 0
                },
                images: imageUrls,
                sellerId: user.sub,
                sellerName: (profile === null || profile === void 0 ? void 0 : profile.name) || user.displayName || 'Unknown',
                sellerPhoto: (profile === null || profile === void 0 ? void 0 : profile.customPhotoURL) || (profile === null || profile === void 0 ? void 0 : profile.photoURL) || user.photoURL || '',
                sellerRef: sellerRef, // Add seller reference for homepage compatibility
                seller: {
                    id: user.sub,
                    name: (profile === null || profile === void 0 ? void 0 : profile.name) || user.displayName || 'Unknown',
                    avatar: (profile === null || profile === void 0 ? void 0 : profile.customPhotoURL) || (profile === null || profile === void 0 ? void 0 : profile.photoURL) || user.photoURL || '',
                    isVerified: (profile === null || profile === void 0 ? void 0 : profile.verified) || false,
                    rating: (profile === null || profile === void 0 ? void 0 : profile.rating) || 0
                },
                status: 'active',
                likes: [], // Use array instead of number for real-time compatibility
                views: 0,
                viewCount: 0, // Add viewCount field for consistency
                sold: 0,
                rating: 0,
                reviewCount: 0,
                likeCount: 0, // Add likeCount field for consistency
                comments: 0, // Add comments field for consistency
                brand: (profile === null || profile === void 0 ? void 0 : profile.name) || user.displayName || 'Unknown', // Add brand field
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, 'products'), productData);
            console.log('✅ PRODUCT UPLOAD: Product created successfully with ID:', docRef.id);
            console.log('📦 PRODUCT UPLOAD: Product data:', productData);
            toast.success('Product uploaded successfully!');
            router.push(`/profile/${user.sub}`);
        }
        catch (error) {
            console.error('Error uploading product:', error);
            toast.error('Failed to upload product. Please try again.');
        }
        finally {
            setUploading(false);
        }
    };
    // Show loading state only when loading and no profile data yet (avoid flicker)
    if ((authLoading && !user) || (profileLoading && !profile)) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login first</h1>
          <p className="text-gray-600 dark:text-gray-300">You need to be authenticated to upload products</p>
        </div>
      </div>);
    }
    if (!isSeller) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seller Access Required</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Only sellers can upload products</p>
          <Link href="/become-seller" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Become a Seller
          </Link>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600"/>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Upload Product</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Add a new product to your store</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h2>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter product name"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Describe your product in detail..."/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input type="number" value={formData.price} onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" min="0" step="0.01"/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <input type="number" value={formData.stock} onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="1" min="0"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select value={formData.condition} onChange={(e) => handleInputChange('condition', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
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
              <input type="text" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="City, State"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (<span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-purple-600 hover:text-purple-800">
                      <X className="w-3 h-3"/>
                    </button>
                  </span>))}
              </div>
              <div className="flex">
                <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag()} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Add a tag"/>
                <button onClick={handleAddTag} className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700">
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Images (Max 5, Max 5MB each)
              </label>
              
              {/* Image Preview Grid */}
              {formData.images.length > 0 && (<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {formData.images.map((image, index) => (<div key={index} className="relative group">
                      <img src={image} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-300"/>
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>))}
                </div>)}

              {/* Upload Button */}
              {formData.images.length < 5 && (<div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden"/>
                  <button type="button" onClick={() => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2"/>
                    <p className="text-gray-600 dark:text-gray-300">Click to upload images</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {formData.images.length}/5 images uploaded
                    </p>
                  </button>
                </div>)}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button onClick={handleSubmit} disabled={uploading} className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {uploading ? (<>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>) : (<>
                    <Save className="w-4 h-4 mr-2"/>
                    Upload Product
                  </>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);
}

