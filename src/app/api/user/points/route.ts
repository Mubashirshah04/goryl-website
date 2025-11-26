import { NextResponse } from 'next/server';
import { addPoints } from '@/lib/awsUserService';

export async function POST(request: Request) {
    try {
        const { userId, points } = await request.json();

        if (!userId || typeof points !== 'number') {
            return NextResponse.json(
                { error: 'Invalid request parameters' },
                { status: 400 }
            );
        }

        await addPoints(userId, points);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding points:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
