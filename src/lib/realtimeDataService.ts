// Realtime Data Service - YouTube-like realtime updates
interface RealtimeStats {
  onlineUsers: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  liveStreams: number;
  timestamp: number;
}

interface ProductRealtimeData {
  productId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  purchases: number;
  timestamp: number;
}

interface UserRealtimeData {
  userId: string;
  isOnline: boolean;
  lastSeen: number;
  currentPage: string;
  activity: string;
}

class RealtimeDataService {
  private stats: RealtimeStats = {
    onlineUsers: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    liveStreams: 0,
    timestamp: Date.now()
  };

  private productData = new Map<string, ProductRealtimeData>();
  private userData = new Map<string, UserRealtimeData>();
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Initialize realtime service
  private initialize(): void {
    console.log('🔄 Initializing realtime data service...');
    
    // Start with simulated data
    this.startSimulatedUpdates();
    
    // Try to connect to WebSocket
    this.connectWebSocket();
    
    // Set up periodic updates
    this.setupPeriodicUpdates();
  }

  // Start simulated updates for demo
  private startSimulatedUpdates(): void {
    // Update global stats every second
    setInterval(() => {
      this.updateGlobalStats();
    }, 1000);

    // Update product data every 5 seconds
    setInterval(() => {
      this.updateProductData();
    }, 5000);

    // Update user data every 10 seconds
    setInterval(() => {
      this.updateUserData();
    }, 10000);
  }

  // Connect to WebSocket
  private connectWebSocket(): void {
    try {
      // Check if WebSocket server is available
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/realtime' 
        : 'ws://localhost:3001/realtime';
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ Realtime WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeMessage(data);
        } catch (error) {
          console.error('Error parsing realtime message:', error);
        }
      };

      ws.onclose = () => {
        console.log('❌ Realtime WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };

      ws.onerror = (error) => {
        // Silent error handling - WebSocket server not available
        // Don't log errors - this is expected if the server isn't running
        this.isConnected = false;
      };

    } catch (error) {
      console.log('📡 WebSocket connection failed, using simulated data');
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms...`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.log('📡 Max reconnection attempts reached, using simulated data');
      // Stop trying to reconnect and use simulated data
      this.isConnected = false;
    }
  }

  // Handle realtime message
  private handleRealtimeMessage(data: any): void {
    switch (data.type) {
      case 'stats':
        this.stats = { ...this.stats, ...data.data };
        this.notifyListeners('stats', this.stats);
        break;
        
      case 'product':
        this.productData.set(data.productId, data.data);
        this.notifyListeners('product', data.data);
        break;
        
      case 'user':
        this.userData.set(data.userId, data.data);
        this.notifyListeners('user', data.data);
        break;
        
      case 'notification':
        this.notifyListeners('notification', data.data);
        break;
    }
  }

  // Update global stats
  private updateGlobalStats(): void {
    // Simulate realistic changes
    this.stats = {
      onlineUsers: Math.floor(Math.random() * 100) + 5000,
      totalViews: this.stats.totalViews + Math.floor(Math.random() * 10),
      totalLikes: this.stats.totalLikes + Math.floor(Math.random() * 5),
      totalComments: this.stats.totalComments + Math.floor(Math.random() * 2),
      totalShares: this.stats.totalShares + Math.floor(Math.random() * 3),
      liveStreams: Math.floor(Math.random() * 5) + 10,
      timestamp: Date.now()
    };

    this.notifyListeners('stats', this.stats);
  }

  // Update product data
  private updateProductData(): void {
    // Simulate product interactions
    const productIds = ['product1', 'product2', 'product3', 'product4', 'product5'];
    
    productIds.forEach(productId => {
      const currentData = this.productData.get(productId) || {
        productId,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        purchases: 0,
        timestamp: Date.now()
      };

      // Simulate realistic growth
      currentData.views += Math.floor(Math.random() * 5) + 1;
      currentData.likes += Math.floor(Math.random() * 2);
      currentData.comments += Math.floor(Math.random() * 1);
      currentData.shares += Math.floor(Math.random() * 1);
      currentData.purchases += Math.floor(Math.random() * 1);
      currentData.timestamp = Date.now();

      this.productData.set(productId, currentData);
      this.notifyListeners('product', currentData);
    });
  }

  // Update user data
  private updateUserData(): void {
    // Simulate user activity
    const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
    
    userIds.forEach(userId => {
      const currentData = this.userData.get(userId) || {
        userId,
        isOnline: true,
        lastSeen: Date.now(),
        currentPage: '/',
        activity: 'browsing'
      };

      // Simulate user activity
      const activities = ['browsing', 'viewing', 'liking', 'commenting', 'sharing'];
      currentData.activity = activities[Math.floor(Math.random() * activities.length)];
      currentData.isOnline = Math.random() > 0.1; // 90% chance of being online
      currentData.lastSeen = Date.now();

      this.userData.set(userId, currentData);
      this.notifyListeners('user', currentData);
    });
  }

  // Set up periodic updates
  private setupPeriodicUpdates(): void {
    // Update every 30 seconds for demo
    setInterval(() => {
      this.broadcastUpdate();
    }, 30000);
  }

  // Broadcast update
  private broadcastUpdate(): void {
    const update = {
      type: 'broadcast',
      data: {
        stats: this.stats,
        products: Array.from(this.productData.values()),
        users: Array.from(this.userData.values()),
        timestamp: Date.now()
      }
    };

    this.notifyListeners('broadcast', update.data);
  }

  // Subscribe to realtime updates
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type)!.push(callback);
    
    // Immediately call with current data
    this.notifyCurrentData(type, callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Notify current data
  private notifyCurrentData(type: string, callback: (data: any) => void): void {
    switch (type) {
      case 'stats':
        callback(this.stats);
        break;
      case 'product':
        callback(Array.from(this.productData.values()));
        break;
      case 'user':
        callback(Array.from(this.userData.values()));
        break;
    }
  }

  // Notify listeners
  private notifyListeners(type: string, data: any): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in realtime listener:', error);
        }
      });
    }
  }

  // Get current stats
  getStats(): RealtimeStats {
    return { ...this.stats };
  }

  // Get product data
  getProductData(productId: string): ProductRealtimeData | null {
    return this.productData.get(productId) || null;
  }

  // Get user data
  getUserData(userId: string): UserRealtimeData | null {
    return this.userData.get(userId) || null;
  }

  // Get all products data
  getAllProductsData(): ProductRealtimeData[] {
    return Array.from(this.productData.values());
  }

  // Get all users data
  getAllUsersData(): UserRealtimeData[] {
    return Array.from(this.userData.values());
  }

  // Send realtime event
  sendEvent(type: string, data: any): void {
    if (this.isConnected) {
      // Send via WebSocket if connected
      // This would be implemented with the actual WebSocket connection
      console.log('Sending realtime event:', { type, data });
    } else {
      // Fallback to local simulation
      this.handleRealtimeMessage({ type, data });
    }
  }

  // Track user activity
  trackActivity(userId: string, activity: string, page: string): void {
    const userData: UserRealtimeData = {
      userId,
      isOnline: true,
      lastSeen: Date.now(),
      currentPage: page,
      activity
    };

    this.userData.set(userId, userData);
    this.notifyListeners('user', userData);
  }

  // Track product interaction
  trackProductInteraction(productId: string, interaction: 'view' | 'like' | 'comment' | 'share' | 'purchase'): void {
    const currentData = this.productData.get(productId) || {
      productId,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      purchases: 0,
      timestamp: Date.now()
    };

    switch (interaction) {
      case 'view':
        currentData.views++;
        break;
      case 'like':
        currentData.likes++;
        break;
      case 'comment':
        currentData.comments++;
        break;
      case 'share':
        currentData.shares++;
        break;
      case 'purchase':
        currentData.purchases++;
        break;
    }

    currentData.timestamp = Date.now();
    this.productData.set(productId, currentData);
    this.notifyListeners('product', currentData);
  }

  // Check connection status
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  // Get connection info
  getConnectionInfo(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const realtimeDataService = new RealtimeDataService();

export default realtimeDataService;
export type { RealtimeStats, ProductRealtimeData, UserRealtimeData };
