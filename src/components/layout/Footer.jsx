'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { getThemeTextColor, getThemeSecondaryTextColor, getThemeGradient, getThemeLinkColor } from '@/lib/themeUtils';
export function Footer() {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const { profile } = useUserProfileStore();
    const [categories, setCategories] = useState([
        { name: 'Fashion', href: '/categories/fashion' },
        { name: 'Electronics', href: '/categories/electronics' },
        { name: 'Beauty', href: '/categories/beauty' },
        { name: 'Home', href: '/categories/home' },
    ]);
    // Load categories from Firebase
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { getAllCategories } = await import('@/lib/services/categoryService');
                const firebaseCategories = await getAllCategories();
                if (firebaseCategories && firebaseCategories.length > 0) {
                    const categoryLinks = firebaseCategories.map(category => ({
                        name: category.name,
                        href: `/categories/${category.slug}`
                    }));
                    setCategories(categoryLinks);
                }
            }
            catch (error) {
                // Silently handle Firebase permission errors - keep default categories
                console.log('Using default categories (Firebase not accessible)');
            }
        };
        loadCategories();
    }, []);
    const customerSupport = [
        { name: 'Help Center', href: '/help-center' },
        { name: 'Contact Us', href: '/contact-us' },
        { name: 'FAQs', href: '/faqs' },
    ];
    const company = [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Blog', href: '/blog' },
    ];
    const legal = [
        { name: 'Terms', href: '/terms' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Cookies', href: '/cookies' },
    ];
    const socialMedia = [
        { name: 'Facebook', href: 'https://facebook.com', icon: '📘' },
        { name: 'Instagram', href: 'https://instagram.com', icon: '📷' },
        { name: 'Twitter', href: 'https://twitter.com', icon: '🐦' },
    ];
    // Handle hydration safely - don't render theme-specific classes on server
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    // Use light theme as default for server-side rendering
    const effectiveTheme = isMounted ? theme : 'light';
    return (<footer className={`relative ${isMounted ? getThemeGradient(theme) : 'bg-gradient-to-br from-gray-50 to-gray-100'} ${isMounted ? getThemeTextColor(theme) : 'text-gray-900'} transition-colors duration-300`}>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full mix-blend-soft-light filter blur-2xl animate-pulse ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-pink-500 opacity-15' : 'bg-gradient-to-r from-purple-300 to-pink-300 opacity-20'}`}></div>
        <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full mix-blend-soft-light filter blur-2xl ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-blue-500 to-teal-500 opacity-10' : 'bg-gradient-to-r from-blue-300 to-teal-300 opacity-15'}`}></div>
      </div>
      
      <div className="container mx-auto px-0 relative z-10">
        {/* Enhanced Main Content */}
        <div className="px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Brand Info with Enhanced Design */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-lg blur-sm opacity-70 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}></div>
                  <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${effectiveTheme === 'dark' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                    <span className="text-white font-bold">Z</span>
                  </div>
                </div>
                <span className={`text-xl font-bold ml-3 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' : 'text-purple-600'}`}>
                  Zaillisy
                </span>
              </div>
              <p className={`text-sm mb-4 leading-relaxed ${isMounted ? getThemeSecondaryTextColor(theme) : 'text-gray-600'}`}>
                Social commerce platform connecting buyers and sellers.
              </p>
              <div className="flex space-x-3">
                {socialMedia.map((social) => (<a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm group ${effectiveTheme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600' : 'bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500'}`} title={social.name}>
                    <span className="text-base group-hover:scale-110 transition-transform">{social.icon}</span>
                  </a>))}
              </div>
              {/* Start Selling Button - Show for normal users and non-logged in users */}
              {/* Hide for sellers: personal_seller, brand, company */}
              {(!user || !profile || 
                !profile.accountType || 
                (profile.accountType !== 'personal_seller' && 
                 profile.accountType !== 'brand' && 
                 profile.accountType !== 'company' &&
                 profile.accountType !== 'admin') ||
                (profile.role && 
                 profile.role !== 'personal_seller' && 
                 profile.role !== 'brand' && 
                 profile.role !== 'company' && 
                 profile.role !== 'admin')) && (
                <div className="mt-4">
                  <Link href="/become-seller" className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm ${effectiveTheme === 'dark'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'}`}>
                    Start Selling
                  </Link>
                </div>
              )}
            </div>

            {/* Categories with Enhanced Styling */}
            <div>
              <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider relative inline-block ${effectiveTheme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-600'}`}>
                Categories
                <span className={`absolute bottom-0 left-0 w-8 h-0.5 rounded-full ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-500'}`}></span>
              </h3>
              <ul className="space-y-2">
                {categories.map((category) => (<li key={category.name}>
                    <Link href={category.href} className={`transition-all duration-300 text-sm flex items-center group py-1 ${isMounted ? getThemeLinkColor(theme) : 'text-gray-600 hover:text-purple-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 ${effectiveTheme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'}`}></span>
                      <span className="group-hover:translate-x-1 transform duration-300">{category.name}</span>
                    </Link>
                  </li>))}
                <li>
                  <Link href="/categories" className={`transition-colors text-sm font-medium flex items-center group py-1 ${effectiveTheme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'}`}>
                    <span className="group-hover:translate-x-1 transform duration-300">View All</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Company with Enhanced Design */}
            <div>
              <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider relative inline-block ${effectiveTheme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-600'}`}>
                Support
                <span className={`absolute bottom-0 left-0 w-8 h-0.5 rounded-full ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-500'}`}></span>
              </h3>
              <ul className="space-y-2 mb-4">
                {customerSupport.map((item) => (<li key={item.name}>
                    <Link href={item.href} className={`transition-all duration-300 text-sm flex items-center group py-1 ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 ${effectiveTheme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'}`}></span>
                      <span className="group-hover:translate-x-1 transform duration-300">{item.name}</span>
                    </Link>
                  </li>))}
              </ul>
              
              <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider relative inline-block ${effectiveTheme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-600'}`}>
                Company
                <span className={`absolute bottom-0 left-0 w-8 h-0.5 rounded-full ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-500'}`}></span>
              </h3>
              <ul className="space-y-2">
                {company.map((item) => (<li key={item.name}>
                    <Link href={item.href} className={`transition-all duration-300 text-sm flex items-center group py-1 ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 ${effectiveTheme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'}`}></span>
                      <span className="group-hover:translate-x-1 transform duration-300">{item.name}</span>
                    </Link>
                  </li>))}
              </ul>
            </div>

            {/* Legal with Enhanced Design */}
            <div>
              <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider relative inline-block ${effectiveTheme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-600'}`}>
                Legal
                <span className={`absolute bottom-0 left-0 w-8 h-0.5 rounded-full ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-500'}`}></span>
              </h3>
              <ul className="space-y-2">
                {legal.map((item) => (<li key={item.name}>
                    <Link href={item.href} className={`transition-all duration-300 text-sm flex items-center group py-1 ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 ${effectiveTheme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'}`}></span>
                      <span className="group-hover:translate-x-1 transform duration-300">{item.name}</span>
                    </Link>
                  </li>))}
              </ul>
            </div>
          </div>
        </div>

        {/* Enhanced Divider */}
        <div className={`border-t mx-6 ${effectiveTheme === 'dark' ? 'border-gray-800/50' : 'border-gray-200'}`}></div>

        {/* Enhanced Bottom Bar */}
        <div className="px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto">
            <div className={`text-sm mb-4 md:mb-0 ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              &copy; {new Date().getFullYear()} Zaillisy. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className={`text-sm transition-colors ${effectiveTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-purple-600'}`}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={`text-sm transition-colors ${effectiveTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-purple-600'}`}>
                Terms of Service
              </Link>
              <Link href="/cookies" className={`text-sm transition-colors ${effectiveTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-purple-600'}`}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>);
}
