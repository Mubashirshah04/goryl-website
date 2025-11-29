'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, ShoppingBag, Building2, Users, Edit, Phone, MapPin, Calendar, Mail, Trash2, Edit3, Eye, Heart, Bookmark } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { toast } from 'sonner';
// ✅ AWS DYNAMODB - Using AWS services only


interface PublicContentTabsProps {
  profile: {
    id: string;
    role: string;
    name?: string;
    bio?: string;
    location?: string;
    followers?: string[] | number;
    following?: string[] | number;
    email?: string;
    phone?: string;
    website?: string;
    joinedAt?: any;
    businessInfo?: {
      businessName?: string;
      establishedYear?: string;
      teamSize?: string;
      teamMembers?: any[];
    };
  };
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}

export default function PublicContentTabs({ profile, isOwnProfile, isLoggedIn }: PublicContentTabsProps) {
  const router = useRouter();

  // Show tabs for all seller types (brand, company, seller, personal with products)
  const isVerifiedUser = profile && ['brand', 'company', 'seller', 'personal'].includes(profile.role);

  // Don't render anything if no profile
  if (!profile || !isVerifiedUser) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about' | 'company' | 'team' | 'liked' | 'saved'>('products');
  const [likedProducts, setLikedProducts] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [likedSavedLoading, setLikedSavedLoading] = useState(false);
  const { products, loading: productsLoading } = useUserProductsStore();
  const { reviews, loading: reviewsLoading } = useUserReviewsStore();

  // Fetch liked and saved products when tab changes
  useEffect(() => {
    if ((activeTab === 'liked' || activeTab === 'saved') && isOwnProfile && isLoggedIn) {
      const fetchLikedSaved = async () => {
        setLikedSavedLoading(true);
        try {
          const response = await fetch(`/api/user/liked-saved?userId=${profile.id}&type=${activeTab}`);
          if (response.ok) {
            const data = await response.json();
            const items = data.items || [];
            
            // Fetch full product details for each item
            const productsWithDetails = await Promise.all(
              items.map(async (item: any) => {
                try {
                  const productResponse = await fetch(`/api/products/${item.productId}`);
                  if (productResponse.ok) {
                    const responseData = await productResponse.json();
                    const productData = responseData.data || responseData;
                    return { ...item, product: productData };
                  }
                } catch (err) {
                  console.error(`Error fetching product ${item.productId}:`, err);
                }
                return item;
              })
            );
            
            if (activeTab === 'liked') {
              setLikedProducts(productsWithDetails);
            } else {
              setSavedProducts(productsWithDetails);
            }
          }
        } catch (error) {
          console.error(`Error fetching ${activeTab} products:`, error);
        } finally {
          setLikedSavedLoading(false);
        }
      };
      fetchLikedSaved();
    }
  }, [activeTab, isOwnProfile, isLoggedIn, profile.id]);

  // Products and reviews are already fetched by parent BrandProfile component
  // No need to fetch again here to avoid duplicate requests


  const formatCount = (count: number | undefined) => {
    if (!count || typeof count !== 'number') return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };


  // Delete product function with UI confirmation
  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    return new Promise<void>((resolve) => {
      // Create modal dialog
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
          <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to delete <strong>"${productTitle}"</strong>? This action cannot be undone.</p>
          <div class="flex gap-3">
            <button id="cancel-btn" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button id="delete-btn" class="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Cancel button
      modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve();
      });

      // Delete button
      modal.querySelector('#delete-btn')?.addEventListener('click', async () => {
        document.body.removeChild(modal);
        
        try {
          // Delete product via AWS API
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete');
          }
          
          toast.success('Product deleted successfully');
          // Refresh products list
          setTimeout(() => window.location.reload(), 500);
        } catch (error: any) {
          console.error('Error deleting product:', error);
          toast.error(error.message || 'Failed to delete product');
        }
        resolve();
      });
    });
  };

  // Edit product function
  const handleEditProduct = (productId: string) => {
    // Store product data for editing
    const product = products.find(p => p.id === productId);
    if (product) {
      sessionStorage.setItem('editProduct', JSON.stringify(product));
      window.location.href = `/product/upload?edit=${productId}`;
    }
  };

  const renderTabContent = () => {
    if (!profile) return null;

    const isVerifiedUser = ['brand', 'company', 'personal'].includes(profile.role);

    switch (activeTab) {
      case 'products':
        return (
          <div className="w-full">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="cursor-pointer group relative"
                  >
                    <div
                      className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden mb-2 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <img
                        src={product.images?.[0] || '/placeholder.png'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Views - Always visible at bottom */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm z-10">
                        <Eye className="w-3 h-3" />
                        <span>{product.viewCount ?? product.views ?? 0}</span>
                      </div>
                      {/* Product Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-semibold text-sm truncate">${product.price}</p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      {product.status === 'pending' && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Under Review
                        </div>
                      )}
                      {product.status === 'rejected' && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Rejected
                        </div>
                      )}
                      {/* Rating Badge */}
                      {product.rating && product.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          {product.rating.toFixed(1)}
                        </div>
                      )}

                      {/* Edit/Delete buttons - only show for own profile */}
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditProduct(product.id);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteProduct(product.id, product.title);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium truncate text-foreground">{product.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold text-foreground">${product.price}</p>
                      {product.rating && product.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <ShoppingBag className="w-16 h-16 text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No products yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">This company hasn't listed any products</p>
                {isOwnProfile && isVerifiedUser && (
                  <button
                    onClick={() => router.push('/product/upload')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Your First Product
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'reviews':
        return (
          <div className="w-full">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse h-32 rounded-xl"></div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{review.userName || 'Anonymous'}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.createdAt ? (typeof (review.createdAt as any).toDate === 'function' ? new Date((review.createdAt as any).toDate()).toLocaleDateString() : new Date(review.createdAt as any).toLocaleDateString()) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    {(review as any).images && (review as any).images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {(review as any).images.slice(0, 3).map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Review"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Star className="w-16 h-16 text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No reviews yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to review this company</p>
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="w-full space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-gray-600">{profile.bio || 'No bio available'}</p>
            </div>
            {profile.location && (
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-gray-600">{profile.location}</p>
              </div>
            )}
          </div>
        );

      case 'company':
        return (
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Company Information
                </h3>
                {isOwnProfile && (
                  <Link
                    href="/profile/edit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Info
                  </Link>
                )}
              </div>

              <div className="grid gap-6">
                {/* Business Name */}
                {profile.businessInfo?.businessName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="text-base font-medium text-foreground">{profile.businessInfo.businessName}</p>
                    </div>
                  </div>
                )}

                {/* Contact Email */}
                {profile.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-base font-medium text-foreground">{profile.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {profile.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-base font-medium text-foreground">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {profile.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-base font-medium text-foreground">{profile.location}</p>
                    </div>
                  </div>
                )}

                {/* Established Year */}
                {profile.businessInfo?.establishedYear && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Established</p>
                      <p className="text-base font-medium text-foreground">{profile.businessInfo.establishedYear}</p>
                    </div>
                  </div>
                )}

                {/* Website */}
                {profile.website && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-600 hover:underline">
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">About</p>
                      <p className="text-base text-foreground">{profile.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {!profile.businessInfo?.businessName && !profile.email && !profile.phone && !profile.location && !profile.website && !profile.bio && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>No company information available</p>
                  {isOwnProfile && (
                    <Link href="/profile/edit" className="text-blue-600 hover:underline mt-2 inline-block">
                      Add company information
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'team':
        const teamMembers = profile.businessInfo?.teamMembers || [];
        return (
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    Our Team
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</p>
                </div>
                {isOwnProfile && (
                  <Link
                    href="/seller/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Manage Team
                  </Link>
                )}
              </div>

              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member: any, index: number) => (
                    <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{member.name || 'Team Member'}</h4>
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{member.role || 'Member'}</p>
                        </div>
                      </div>
                      {member.email && (
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No team members yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                    {isOwnProfile ? 'Add team members from your dashboard to showcase your team' : 'Team information will be displayed here when available'}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/seller/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      <Users className="w-4 h-4" />
                      Add Team Members
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'liked':
        return (
          <div className="w-full">
            {likedSavedLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : likedProducts.filter(item => item.product?.title && item.product?.price).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {likedProducts.filter(item => item.product?.title && item.product?.price).map((item) => {
                  const product = item.product;
                  return (
                    <Link href={`/product/${item.productId}`} key={item.id}>
                      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
                        {/* Product Image */}
                        <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                          {product?.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product?.title || 'Product'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            <Heart className="w-3 h-3 inline mr-1 fill-white" />
                            Liked
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-3 flex-1 flex flex-col">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{product?.title}</p>
                          <p className="text-xs text-gray-500 mb-2">₹{product?.price}</p>
                          <p className="text-xs text-gray-400 mt-auto">Liked on {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Heart className="w-16 h-16 text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No liked items yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Products you like will appear here</p>
              </div>
            )}
          </div>
        );

      case 'saved':
        return (
          <div className="w-full">
            {likedSavedLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : savedProducts.filter(item => item.product?.title && item.product?.price).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedProducts.filter(item => item.product?.title && item.product?.price).map((item) => {
                  const product = item.product;
                  return (
                    <Link href={`/product/${item.productId}`} key={item.id}>
                      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
                        {/* Product Image */}
                        <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                          {product?.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product?.title || 'Product'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            <Bookmark className="w-3 h-3 inline mr-1 fill-white" />
                            Saved
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-3 flex-1 flex flex-col">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{product?.title}</p>
                          <p className="text-xs text-gray-500 mb-2">₹{product?.price}</p>
                          <p className="text-xs text-gray-400 mt-auto">Saved on {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Bookmark className="w-16 h-16 text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No saved items yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Products you save will appear here</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { id: 'products' as const, label: 'Products' },
    { id: 'reviews' as const, label: 'Reviews' },
    { id: 'about' as const, label: 'About' },
    ...((profile.role === 'brand' || profile.role === 'company') ? [{ id: 'company' as const, label: 'Company Info' }] : []),
    ...((profile.role === 'brand' || profile.role === 'company') ? [{ id: 'team' as const, label: 'Team' }] : []),
    { id: 'liked' as const, label: 'Liked' },
    { id: 'saved' as const, label: 'Saved' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {renderTabContent()}
      </div>

    </div>
  );
}
