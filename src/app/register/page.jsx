'use client';
import React from 'react';
import Link from 'next/link';
import { Building, Store, User, ShoppingBag } from 'lucide-react';
export default function RegisterPage() {
    const accountTypes = [
        {
            type: 'normal',
            icon: ShoppingBag,
            title: 'Normal User (Free Buyer Account)',
            description: 'Default role after signup - Browse, buy, and interact with the community',
            features: ['Browse products', 'Like, comment, save', 'Follow sellers', 'Buy products', 'Watch reels'],
            href: '/register/personal',
            note: '✅ No KYC required'
        },
        {
            type: 'personal',
            icon: User,
            title: 'Personal Seller Account',
            description: 'For everyday individuals selling used items, handmade products, or reselling',
            features: ['Upload products via short video', 'Buyer chat & orders', 'Wallet & transactions'],
            href: '/register/personal'
        },
        {
            type: 'company',
            icon: Building,
            title: 'Company Account',
            description: 'For officially registered companies with multiple brands',
            features: ['Multiple brand management', 'Advanced analytics', 'Team collaboration'],
            href: '/register/company'
        },
        {
            type: 'brand',
            icon: Store,
            title: 'Brand Account',
            description: 'For independent entrepreneurs or small teams without company registration',
            features: ['Brand verification', 'Marketing tools', 'Customer insights'],
            href: '/register/brand'
        }
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Join Zaillisy</h1>
          <p className="text-purple-100 text-xl">Choose your account type to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            return (<Link key={account.type} href={account.href} className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl mb-4">
                    <Icon className="w-8 h-8 text-white"/>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{account.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{account.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {account.features.map((feature, index) => (<li key={index} className="text-sm text-gray-500 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        {feature}
                      </li>))}
                  </ul>
                  
                  {account.note && (<p className="text-sm text-green-600 font-medium mb-4">{account.note}</p>)}
                  
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors">
                    Get Started
                  </button>
                </div>
              </Link>);
        })}
        </div>

        <div className="text-center mt-8">
          <p className="text-purple-100">
            Already have an account?{' '}
            <Link href="/auth-login" className="text-white font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>);
}
