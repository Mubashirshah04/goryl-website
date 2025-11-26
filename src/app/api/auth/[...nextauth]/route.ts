// NextAuth is now handled by Firebase Cloud Function
// This file just ensures the route exists for Next.js routing
// All actual auth logic is in: functions/nextauth-api.js

// This route is a placeholder - actual auth handled by Firebase Function

// Placeholder - actual auth is handled by Firebase Function
// This prevents Next.js from trying to handle auth routes

// Simple pass-through - Firebase handles the actual request
export async function GET() {
  return new Response(
    JSON.stringify({ message: 'Auth handled by Firebase Function' }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ message: 'Auth handled by Firebase Function' }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
