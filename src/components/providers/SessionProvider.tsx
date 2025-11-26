'use client';

import { ReactNode } from 'react';

// SessionProvider is now a simple wrapper - no NextAuth client
// Auth is handled by Firebase Cloud Function
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
