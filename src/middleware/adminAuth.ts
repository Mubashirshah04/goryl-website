/**
 * Admin authentication middleware
 * Protects admin-only routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

/**
 * Middleware to check if user is admin
 * Use this in API routes that require admin access
 */
export async function requireAdmin(request: NextRequest, userEmail: string | null | undefined) {
  if (!isAdmin(userEmail)) {
    return NextResponse.json(
      { 
        error: 'Unauthorized', 
        message: 'Admin access required' 
      },
      { status: 403 }
    );
  }
  return null; // Allow access
}

/**
 * Get user email from session/token
 * You can customize this based on your auth implementation
 */
export function getUserEmailFromRequest(request: NextRequest): string | null {
  // Example: Get from header
  const email = request.headers.get('x-user-email');
  return email;
}
