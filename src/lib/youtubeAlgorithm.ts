/**
 * YouTube-like Algorithm for Goryl
 * Gradually shows products and personalizes based on user behavior
 * Perfect for new websites with limited products
 */

interface Product {
  id: string;
  title: string;
  price: number;
  category?: string;
  views?: number;
  rating?: number;
  sellerId?: string;
  createdAt?: Date;
  images?: string[];
}

interface UserInteraction {
  productId: string;
  type: 'view' | 'like' | 'save' | 'click' | 'share' | 'add_to_cart';
  timestamp: number;
}

interface AlgorithmScore {
  product: Product;
  score: number;
  reason: string;
}

class YouTubeAlgorithm {
  private userInteractions: UserInteraction[] = [];
  private viewedProducts: Set<string> = new Set();
  private likedCategories: Map<string, number> = new Map();
  private userPreferences: {
    priceRange: [number, number];
    categories: string[];
    avgRating: number;
  } = {
    priceRange: [0, 10000],
    categories: [],
    avgRating: 0
  };

  /**
   * Track user interaction
   */
  trackInteraction(productId: string, type: UserInteraction['type']) {
    this.userInteractions.push({
      productId,
      type,
      timestamp: Date.now()
    });

    // Keep only last 100 interactions
    if (this.userInteractions.length > 100) {
      this.userInteractions = this.userInteractions.slice(-100);
    }

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_interactions', JSON.stringify(this.userInteractions));
      } catch (e) {
        console.error('Error saving interactions:', e);
      }
    }
  }

  /**
   * Load user interactions from localStorage
   */
  loadInteractions() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('user_interactions');
      if (saved) {
        this.userInteractions = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading interactions:', e);
    }
  }

  /**
   * Calculate product score based on algorithm
   * Heavily favors trending and new products for new websites
   */
  calculateScore(product: Product): number {
    let score = 0;

    // 1. FRESHNESS (new products get HUGE boost) - 40 points
    // Perfect for new websites - new products show at top
    if (product.createdAt) {
      const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      // New products (< 7 days) get full 40 points
      // Gradually decrease after that
      const freshnessScore = Math.max(0, 40 - ageInDays * 2);
      score += freshnessScore;
    } else {
      score += 40;
    }

    // 2. ENGAGEMENT (views, rating) - 35 points
    // Trending products show high
    const views = product.views || 0;
    const viewScore = Math.min(20, (views / 50) * 10); // More aggressive view scoring
    score += viewScore;

    const rating = product.rating || 0;
    const ratingScore = (rating / 5) * 15; // Cap at 15
    score += ratingScore;

    // 3. Category preference - 15 points
    if (product.category && this.likedCategories.has(product.category)) {
      const categoryScore = (this.likedCategories.get(product.category) || 0) * 3;
      score += Math.min(15, categoryScore);
    }

    // 4. Price preference - 5 points
    if (product.price >= this.userPreferences.priceRange[0] && 
        product.price <= this.userPreferences.priceRange[1]) {
      score += 5;
    }

    // 5. Diversity (haven't seen this product) - 5 points
    if (!this.viewedProducts.has(product.id)) {
      score += 5;
    }

    return score;
  }

  /**
   * Get personalized feed with gradual rollout
   * Always shows trending/new at top, gradually shows less popular below
   */
  getPersonalizedFeed(
    allProducts: Product[],
    batchSize: number = 12,
    userHasInteractions: boolean = false
  ): Product[] {
    // Calculate scores for ALL products
    const scoredProducts: AlgorithmScore[] = allProducts.map(product => ({
      product,
      score: this.calculateScore(product),
      reason: this.getScoreReason(product)
    }));

    // Sort by score (highest first) - ALWAYS trending at top
    scoredProducts.sort((a, b) => b.score - a.score);

    // Strategy: Show top products first, then gradually mix in others
    let result: Product[] = [];

    if (allProducts.length <= batchSize) {
      // If we have few products, show all sorted by score
      result = scoredProducts.map(sp => sp.product);
    } else {
      // Show top 70% trending products
      const topProducts = scoredProducts.slice(0, Math.ceil(batchSize * 0.7));
      result = topProducts.map(sp => sp.product);

      // Add 30% diverse products for variety
      const remainingProducts = scoredProducts.slice(Math.ceil(batchSize * 0.7));
      const diverseProducts = this.shuffleArray(remainingProducts).slice(0, Math.ceil(batchSize * 0.3));
      result = [...result, ...diverseProducts.map(sp => sp.product)];
    }

    // Track viewed products
    result.forEach(p => this.viewedProducts.add(p.id));

    return result.slice(0, batchSize);
  }

  /**
   * Gradual rollout strategy for new websites
   * Shows products slowly to simulate activity
   */
  private getGradualRollout(allProducts: Product[], batchSize: number): Product[] {
    // Sort by freshness and engagement
    const sorted = [...allProducts].sort((a, b) => {
      // Prioritize new products
      const aAge = a.createdAt ? (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
      const bAge = b.createdAt ? (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
      
      if (aAge !== bAge) return aAge - bAge;

      // Then by engagement
      const aEngagement = (a.views || 0) + (a.rating || 0) * 10;
      const bEngagement = (b.views || 0) + (b.rating || 0) * 10;
      return bEngagement - aEngagement;
    });

    // Add some randomness for variety
    const result = this.shuffleArray(sorted).slice(0, batchSize);

    // Track viewed products
    result.forEach(p => this.viewedProducts.add(p.id));

    return result;
  }

  /**
   * Update user preferences based on interactions
   */
  updatePreferences(product: Product, interactionType: UserInteraction['type']) {
    // Update category preference
    if (product.category) {
      const currentCount = this.likedCategories.get(product.category) || 0;
      const weight = this.getInteractionWeight(interactionType);
      this.likedCategories.set(product.category, currentCount + weight);
    }

    // Update price preference
    if (product.price) {
      const currentMin = this.userPreferences.priceRange[0];
      const currentMax = this.userPreferences.priceRange[1];
      
      // Gradually adjust price range
      if (product.price < currentMin) {
        this.userPreferences.priceRange[0] = Math.max(0, product.price - 500);
      }
      if (product.price > currentMax) {
        this.userPreferences.priceRange[1] = product.price + 500;
      }
    }

    // Update average rating preference
    if (product.rating) {
      const currentAvg = this.userPreferences.avgRating;
      this.userPreferences.avgRating = (currentAvg + product.rating) / 2;
    }
  }

  /**
   * Get weight for different interaction types
   */
  private getInteractionWeight(type: UserInteraction['type']): number {
    const weights: Record<UserInteraction['type'], number> = {
      'view': 1,
      'click': 2,
      'like': 5,
      'save': 4,
      'share': 6,
      'add_to_cart': 8
    };
    return weights[type] || 1;
  }

  /**
   * Get reason for score
   */
  private getScoreReason(product: Product): string {
    const reasons: string[] = [];

    if (product.createdAt) {
      const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 1) reasons.push('New');
    }

    if ((product.views || 0) > 100) reasons.push('Trending');
    if ((product.rating || 0) >= 4.5) reasons.push('Highly Rated');
    if (product.category && this.likedCategories.has(product.category)) reasons.push('Your Interest');

    return reasons.join(', ') || 'Recommended';
  }

  /**
   * Shuffle array for randomness
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get algorithm stats for debugging
   */
  getStats() {
    return {
      totalInteractions: this.userInteractions.length,
      viewedProducts: this.viewedProducts.size,
      likedCategories: Array.from(this.likedCategories.entries()),
      userPreferences: this.userPreferences
    };
  }
}

// Singleton instance
let algorithmInstance: YouTubeAlgorithm | null = null;

export const getAlgorithmInstance = (): YouTubeAlgorithm => {
  if (!algorithmInstance) {
    algorithmInstance = new YouTubeAlgorithm();
    algorithmInstance.loadInteractions();
  }
  return algorithmInstance;
};

export const trackProductInteraction = (productId: string, type: UserInteraction['type']) => {
  getAlgorithmInstance().trackInteraction(productId, type);
};

export const getPersonalizedFeed = (
  products: Product[],
  batchSize?: number,
  userHasInteractions?: boolean
): Product[] => {
  return getAlgorithmInstance().getPersonalizedFeed(products, batchSize, userHasInteractions);
};

export const updateUserPreferences = (product: Product, interactionType: UserInteraction['type']) => {
  getAlgorithmInstance().updatePreferences(product, interactionType);
};

export const getAlgorithmStats = () => {
  return getAlgorithmInstance().getStats();
};
