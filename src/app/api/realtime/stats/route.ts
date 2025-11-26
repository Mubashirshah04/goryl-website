import { NextRequest, NextResponse } from 'next/server';
import realtimeDataService from '@/lib/realtimeDataService';

/**
 * GET /api/realtime/stats
 * Returns realtime statistics (simulated if WebSocket not available)
 */
export async function GET(request: NextRequest) {
  try {
    // Get stats from realtime service
    // The service already handles simulated data if WebSocket is not available
    const stats = realtimeDataService.getStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error fetching realtime stats:', error);
    
    // Return default stats if service fails
    const defaultStats = {
      onlineUsers: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      liveStreams: 0,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: defaultStats,
      fallback: true,
    });
  }
}

