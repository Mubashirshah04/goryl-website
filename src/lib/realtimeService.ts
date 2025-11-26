/**
 * Real-time Service for Reels, Comments, Likes
 * 
 * Uses WebSockets for real-time updates like YouTube/TikTok
 * Falls back to fast polling if WebSockets unavailable
 */

interface RealtimeSubscription {
  id: string;
  type: 'reels' | 'comments' | 'likes' | 'shares';
  reelId?: string;
  callback: (data: any) => void;
  unsubscribe: () => void;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Try WebSocket first, fallback to fast polling
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // Use WebSocket API endpoint (you'll need to create this)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected - Real-time updates enabled');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribeAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error, falling back to fast polling:', error);
        this.isConnecting = false;
        this.fallbackToPolling();
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        this.isConnecting = false;
        this.reconnect();
      };
    } catch (error) {
      console.warn('WebSocket not available, using fast polling:', error);
      this.fallbackToPolling();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, using fast polling');
      this.fallbackToPolling();
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private subscribeAll() {
    this.subscriptions.forEach((sub) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          subscriptionId: sub.id,
          dataType: sub.type,
          reelId: sub.reelId,
        }));
      }
    });
  }

  private handleMessage(data: any) {
    const { type, subscriptionId, payload } = data;

    if (type === 'update' && subscriptionId) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.callback(payload);
      }
    }
  }

  private fallbackToPolling() {
    // Fast polling fallback (1-2 seconds)
    this.subscriptions.forEach((sub) => {
      this.startPolling(sub);
    });
  }

  private startPolling(subscription: RealtimeSubscription) {
    // Clear existing polling for this subscription
    const existing = this.pollIntervals.get(subscription.id);
    if (existing) {
      clearInterval(existing);
    }

    const pollInterval = setInterval(async () => {
      try {
        let data;

        switch (subscription.type) {
          case 'reels':
            // REMOVED - reels feature deleted
            // const { getReels } = await import('./reelsService');
            // const result = await getReels(50);
            // data = result.reels || [];
            break;

          case 'comments':
            // REMOVED - reels feature deleted
            // if (subscription.reelId) {
            //   const { getReelComments } = await import('./reelsService');
            //   data = await getReelComments(subscription.reelId);
            // }
            break;

          case 'likes':
            // REMOVED - reels feature deleted
            // Poll for likes updates
            // if (subscription.reelId) {
            //   const { getReel } = await import('./reelsService');
            //   const reel = await getReel(subscription.reelId);
            //   data = reel ? { 
            //     likesCount: reel.likesCount || 0, 
            //     likes: (reel as any).likes || [] 
            //   } : null;
            // }
            break;
        }

        if (data) {
          subscription.callback(data);
        }
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 1500); // Poll every 1.5 seconds for near real-time

    this.pollIntervals.set(subscription.id, pollInterval);
  }

  /**
   * Subscribe to reels updates (real-time)
   */
  subscribeToReels(callback: (reels: any[]) => void): () => void {
    const id = `reels_${Date.now()}_${Math.random()}`;

    const subscription: RealtimeSubscription = {
      id,
      type: 'reels',
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(id);
        const interval = this.pollIntervals.get(id);
        if (interval) {
          clearInterval(interval);
          this.pollIntervals.delete(id);
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'unsubscribe', subscriptionId: id }));
        }
      },
    };

    this.subscriptions.set(id, subscription);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeAll();
    } else {
      this.startPolling(subscription);
    }

    return subscription.unsubscribe;
  }

  /**
   * Subscribe to reel comments (real-time)
   */
  subscribeToComments(reelId: string, callback: (comments: any[]) => void): () => void {
    const id = `comments_${reelId}_${Date.now()}`;

    const subscription: RealtimeSubscription = {
      id,
      type: 'comments',
      reelId,
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(id);
        const interval = this.pollIntervals.get(id);
        if (interval) {
          clearInterval(interval);
          this.pollIntervals.delete(id);
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'unsubscribe', subscriptionId: id }));
        }
      },
    };

    this.subscriptions.set(id, subscription);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeAll();
    } else {
      this.startPolling(subscription);
    }

    return subscription.unsubscribe;
  }

  /**
   * Subscribe to reel likes (real-time)
   */
  subscribeToLikes(reelId: string, callback: (data: { likesCount: number; likes: string[] }) => void): () => void {
    const id = `likes_${reelId}_${Date.now()}`;

    const subscription: RealtimeSubscription = {
      id,
      type: 'likes',
      reelId,
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(id);
        const interval = this.pollIntervals.get(id);
        if (interval) {
          clearInterval(interval);
          this.pollIntervals.delete(id);
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'unsubscribe', subscriptionId: id }));
        }
      },
    };

    this.subscriptions.set(id, subscription);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeAll();
    } else {
      this.startPolling(subscription);
    }

    return subscription.unsubscribe;
  }

  /**
   * Broadcast update (for optimistic updates)
   */
  broadcastUpdate(type: string, data: any) {
    this.subscriptions.forEach((sub) => {
      if (sub.type === type || (type === 'reel' && sub.reelId === data.reelId)) {
        sub.callback(data);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();
    this.subscriptions.clear();
  }
}

// Singleton instance
let realtimeServiceInstance: RealtimeService | null = null;

export const getRealtimeService = (): RealtimeService => {
  if (typeof window === 'undefined') {
    // Server-side: return a mock service
    return {
      subscribeToReels: () => () => { },
      subscribeToComments: () => () => { },
      subscribeToLikes: () => () => { },
      broadcastUpdate: () => { },
      disconnect: () => { },
    } as any;
  }

  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService();
  }
  return realtimeServiceInstance;
};

export default getRealtimeService();

