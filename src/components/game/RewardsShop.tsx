'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, ShoppingBag, Lock, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';

const COUPONS = [
    { id: '5OFF', discount: '5%', cost: 100, code: 'GORYL5', color: 'bg-blue-500' },
    { id: '10OFF', discount: '10%', cost: 250, code: 'GORYL10', color: 'bg-purple-500' },
    { id: '20OFF', discount: '20%', cost: 500, code: 'GORYL20', color: 'bg-pink-500' },
];

export default function RewardsShop() {
    const { user, userData, refreshUserData } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);

    const handleRedeem = async (coupon: typeof COUPONS[0]) => {
        if (!user?.sub) {
            toast.error('Please sign in to redeem rewards');
            return;
        }

        if ((userData?.points || 0) < coupon.cost) {
            toast.error('Not enough points!');
            return;
        }

        setLoading(coupon.id);
        try {
            const response = await fetch('/api/user/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.sub,
                    cost: coupon.cost,
                    couponCode: coupon.code
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`🎉 Redeemed ${coupon.discount} coupon! Code: ${coupon.code}`);
                await refreshUserData();
            } else {
                toast.error(data.message || 'Redemption failed');
            }
        } catch (error) {
            console.error('Redemption error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const isRedeemed = (code: string) => {
        return userData?.redeemedCoupons?.includes(code);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-xl">
                    <ShoppingBag className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rewards Shop</h2>
                    <p className="text-gray-500 dark:text-gray-400">Spend your hard-earned points!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COUPONS.map((coupon) => {
                    const redeemed = isRedeemed(coupon.code);
                    const canAfford = (userData?.points || 0) >= coupon.cost;

                    return (
                        <motion.div
                            key={coupon.id}
                            whileHover={{ y: -5 }}
                            className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
                        >
                            {/* Coupon Header */}
                            <div className={`${coupon.color} p-6 text-white text-center relative overflow-hidden`}>
                                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                                <h3 className="text-4xl font-black mb-1">{coupon.discount}</h3>
                                <p className="font-medium opacity-90">OFF YOUR ORDER</p>
                            </div>

                            {/* Coupon Body */}
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Cost</span>
                                    <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                                        <Ticket className="w-4 h-4 text-yellow-500" />
                                        {coupon.cost} pts
                                    </div>
                                </div>

                                {redeemed ? (
                                    <div className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                                        <Check className="w-5 h-5" />
                                        Code: {coupon.code}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleRedeem(coupon)}
                                        disabled={!canAfford || loading === coupon.id}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canAfford
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 shadow-lg hover:shadow-xl'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {loading === coupon.id ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Ticket className="w-5 h-5" />
                                            </motion.div>
                                        ) : canAfford ? (
                                            <>Redeem Reward</>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Need {coupon.cost - (userData?.points || 0)} more
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
