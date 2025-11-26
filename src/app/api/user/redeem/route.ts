import { NextResponse } from 'next/server';
import { redeemCoupon } from '@/lib/awsUserService';

export async function POST(request: Request) {
    try {
        const { userId, cost, couponCode } = await request.json();

        if (!userId || typeof cost !== 'number' || !couponCode) {
            return NextResponse.json(
                { error: 'Invalid request parameters' },
                { status: 400 }
            );
        }

        const success = await redeemCoupon(userId, cost, couponCode);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, message: 'Redemption failed (insufficient points or already redeemed)' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error redeeming coupon:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
