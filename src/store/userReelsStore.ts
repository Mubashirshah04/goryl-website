import { create } from 'zustand';

interface Reel {
  id: string;
  url: string;
  title?: string;
  createdAt?: string;
}

interface UserReelsStore {
  reels: Reel[];
  loading: boolean;
  error: string | null;
  fetchUserReels: (userId?: string) => Promise<void>;
  fetchUserReelsRealtime: (userId?: string) => () => void;
  deleteReel: (reelId: string) => Promise<void>;
}

export const useUserReelsStore = create<UserReelsStore>((set) => ({
  reels: [],
  loading: false,
  error: null,
  fetchUserReels: async () => {
    set({ reels: [], loading: false, error: null });
  },
  fetchUserReelsRealtime: () => {
    return () => {};
  },
  deleteReel: async () => {
    return;
  },
}));

export default useUserReelsStore;