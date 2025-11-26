'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, ArrowRight, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GamePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlay: () => void;
    onSkip: () => void;
    productImage?: string;
}

export function GamePromptModal({ isOpen, onClose, onPlay, onSkip, productImage }: GamePromptModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Content */}
                    <div className="p-6 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center relative">
                            <Gamepad2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                                WIN % OFF
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Want a Discount?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Play a quick game to win points and redeem exclusive coupons for this product!
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={onPlay}
                                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <Gamepad2 className="w-5 h-5" />
                                Play & Win Discount
                            </button>

                            <button
                                onClick={onSkip}
                                className="w-full py-3.5 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <span>No thanks, I'll pay full price</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                        Win up to 20% OFF • Takes less than 1 minute
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
