'use client';

import React from 'react';
import { UserProfile } from '@/store/userProfileStore';
import { 
  Shield, 
  Store, 
  Building, 
  User, 
  Star, 
  MapPin, 
  Calendar,
  Globe,
  Verified
} from 'lucide-react';

interface PublicProfileBannerProps {
  profile: UserProfile;
  isLoggedIn: boolean;
  currentUserId?: string; // Current logged-in user's ID
}

export default function PublicProfileBanner({ profile, isLoggedIn, currentUserId }: PublicProfileBannerProps) {
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'brand':
        return {
          icon: Store,
          title: 'Brand Account',
          description: 'Official brand presence with verified products and services',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-600'
        };
      case 'company':
        return {
          icon: Building,
          title: 'Company Account',
          description: 'Business entity offering professional services and products',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'seller':
      case 'personal_seller':
        return {
          icon: Shield,
          title: 'Verified Seller',
          description: 'Trusted seller with quality products and customer service',
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'admin':
        return {
          icon: Verified,
          title: 'Platform Administrator',
          description: 'Official platform team member',
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: User,
          title: 'Personal Account',
          description: 'Individual user sharing experiences and connecting with others',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const roleInfo = getRoleInfo(profile.role);
  const IconComponent = roleInfo.icon;

  // Don't show banner if user is logged in and viewing their own profile
  if (isLoggedIn && currentUserId && profile.id === currentUserId) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color}`}>
              <IconComponent className={`w-4 h-4 mr-2 ${roleInfo.iconColor}`} />
              {roleInfo.title}
            </div>

            {/* Public Access Info */}
            <div className="hidden sm:flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-1" />
              <span>Public Profile</span>
            </div>

            {/* Profile Stats */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              {profile.followers && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  <span>{typeof profile.followers === 'number' ? profile.followers : '0'} followers</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
              {(profile as any).createdAt && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Joined {new Date((profile as any).createdAt).getFullYear()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Login Prompt for Non-Logged Users */}
          {!isLoggedIn && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                Want to follow or message?
              </span>
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Role Description - Mobile */}
        <div className="mt-3 sm:hidden">
          <p className="text-sm text-gray-600 dark:text-gray-300">{roleInfo.description}</p>
        </div>
      </div>
    </div>
  );
}
