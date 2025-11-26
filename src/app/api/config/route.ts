import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return basic app configuration
    const config = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        analytics: true,
        caching: true,
        performance: true,
      },
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
      },
      performance: {
        monitoring: true,
        preloading: true,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in /api/config:', error);
    
    // Return minimal config on error
    return NextResponse.json(
      {
        version: '1.0.0',
        environment: 'development',
        features: {
          analytics: false,
          caching: false,
          performance: false,
        },
        error: 'Configuration unavailable',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // Still return 200 to avoid breaking the app
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
