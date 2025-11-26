'use client';

import React, { useState } from 'react';
import MemoryGame from '@/components/game/MemoryGame';
import RewardsShop from '@/components/game/RewardsShop';
import { Gamepad2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GamePage() {
    const [activeTab, setActiveTab] = useState<'play' | 'shop'>('play');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Play & Earn
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Play the Memory Match game to earn points and redeem exclusive discounts!
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                        <button
                            onClick={() => setActiveTab('play')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'play'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Gamepad2 className="w-5 h-5" />
                            Play Game
                        </button>
                        <button
                            onClick={() => setActiveTab('shop')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'shop'
                                    ? 'bg-pink-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Rewards Shop
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'play' ? <MemoryGame /> : <RewardsShop />}
                </motion.div>
            </div>
        </div>
    );
}
