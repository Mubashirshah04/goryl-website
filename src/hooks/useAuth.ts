import { useSession } from '@/hooks/useCustomSession';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    loading: status === 'loading',
    isAuthenticated: !!session?.user,
  };
}
