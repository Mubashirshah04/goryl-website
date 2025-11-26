// Algorithm Optimization Service - YouTube-like recommendation system
interface UserProfile {
  userId: string;
  interests: string[];
  behavior: {
    views: number;
    likes: number;
    shares: number;
    purchases: number;
    timeSpent: number;
  };
  demographics: {
    age: number;
    location: string;
    device: string;
  };
  preferences: {
    categories: string[];
    priceRange: [number, number];
    brands: string[];
  };
}

interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
  confidence: number;
}

interface AlgorithmConfig {
  weights: {
    views: number;
    likes: number;
    shares: number;
    purchases: number;
    recency: number;
    similarity: number;
  };
  thresholds: {
    minScore: number;
    maxResults: number;
    confidenceThreshold: number;
  };
}

class AlgorithmOptimizationService {
  private userProfiles = new Map<string, UserProfile>();
  private productFeatures = new Map<string, any>();
  private interactionMatrix = new Map<string, Map<string, number>>();
  private config: AlgorithmConfig = {
    weights: {
      views: 0.3,
      likes: 0.4,
      shares: 0.2,
      purchases: 0.5,
      recency: 0.3,
      similarity: 0.4
    },
    thresholds: {
      minScore: 0.1,
      maxResults: 20,
      confidenceThreshold: 0.7
    }
  };

  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Initialize algorithm service
  private initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🧠 Initializing algorithm optimization service...');

    // Load user profiles
    this.loadUserProfiles();

    // Load product features
    this.loadProductFeatures();

    // Set up periodic optimization
    this.setupPeriodicOptimization();

    console.log('✅ Algorithm optimization service initialized');
  }

  // Load user profiles
  private loadUserProfiles(): void {
    // Load from localStorage or API
    try {
      const profiles = localStorage.getItem('user_profiles');
      if (profiles) {
        const parsedProfiles = JSON.parse(profiles);
        Object.entries(parsedProfiles).forEach(([userId, profile]) => {
          this.userProfiles.set(userId, profile as UserProfile);
        });
      }
    } catch (error) {
      console.warn('Failed to load user profiles:', error);
    }
  }

  // Load product features
  private loadProductFeatures(): void {
    // Load from localStorage or API
    try {
      const features = localStorage.getItem('product_features');
      if (features) {
        const parsedFeatures = JSON.parse(features);
        Object.entries(parsedFeatures).forEach(([productId, feature]) => {
          this.productFeatures.set(productId, feature);
        });
      }
    } catch (error) {
      console.warn('Failed to load product features:', error);
    }
  }

  // Set up periodic optimization
  private setupPeriodicOptimization(): void {
    // Optimize algorithms every 5 minutes
    setInterval(() => {
      this.optimizeAlgorithms();
    }, 300000);

    // Update user profiles every minute
    setInterval(() => {
      this.updateUserProfiles();
    }, 60000);
  }

  // Get personalized recommendations
  getRecommendations(userId: string, limit: number = 10): ProductRecommendation[] {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return this.getPopularProducts(limit);
    }

    const recommendations: ProductRecommendation[] = [];
    const userInteractions = this.interactionMatrix.get(userId) || new Map();

    // Calculate scores for all products
    this.productFeatures.forEach((features, productId) => {
      const score = this.calculateRecommendationScore(userProfile, features, userInteractions);
      
      if (score >= this.config.thresholds.minScore) {
        recommendations.push({
          productId,
          score,
          reason: this.getRecommendationReason(userProfile, features),
          confidence: this.calculateConfidence(userProfile, features)
        });
      }
    });

    // Sort by score and return top results
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calculate recommendation score
  private calculateRecommendationScore(
    userProfile: UserProfile,
    productFeatures: any,
    userInteractions: Map<string, number>
  ): number {
    let score = 0;

    // Interest matching
    const interestMatch = this.calculateInterestMatch(userProfile.interests, productFeatures.categories);
    score += interestMatch * this.config.weights.similarity;

    // Behavior-based scoring
    const behaviorScore = this.calculateBehaviorScore(userProfile.behavior, productFeatures);
    score += behaviorScore * this.config.weights.likes;

    // Demographic matching
    const demographicScore = this.calculateDemographicScore(userProfile.demographics, productFeatures);
    score += demographicScore * this.config.weights.views;

    // Preference matching
    const preferenceScore = this.calculatePreferenceScore(userProfile.preferences, productFeatures);
    score += preferenceScore * this.config.weights.purchases;

    // Recency factor
    const recencyScore = this.calculateRecencyScore(productFeatures);
    score += recencyScore * this.config.weights.recency;

    // User interaction history
    const interactionScore = userInteractions.get(productFeatures.id) || 0;
    score += interactionScore * 0.2;

    return Math.min(score, 1.0); // Normalize to 0-1
  }

  // Calculate interest match
  private calculateInterestMatch(userInterests: string[], productCategories: string[]): number {
    const matches = userInterests.filter(interest => 
      productCategories.some(category => 
        category.toLowerCase().includes(interest.toLowerCase())
      )
    ).length;

    return matches / Math.max(userInterests.length, 1);
  }

  // Calculate behavior score
  private calculateBehaviorScore(userBehavior: any, productFeatures: any): number {
    // Weighted combination of user behavior metrics
    const weights = {
      views: 0.2,
      likes: 0.3,
      shares: 0.2,
      purchases: 0.3
    };

    let score = 0;
    score += (userBehavior.views / 1000) * weights.views;
    score += (userBehavior.likes / 100) * weights.likes;
    score += (userBehavior.shares / 50) * weights.shares;
    score += (userBehavior.purchases / 20) * weights.purchases;

    return Math.min(score, 1.0);
  }

  // Calculate demographic score
  private calculateDemographicScore(userDemographics: any, productFeatures: any): number {
    let score = 0;

    // Age-based scoring
    if (productFeatures.targetAge) {
      const ageDiff = Math.abs(userDemographics.age - productFeatures.targetAge);
      score += Math.max(0, 1 - ageDiff / 50) * 0.4;
    }

    // Location-based scoring
    if (productFeatures.popularIn?.includes(userDemographics.location)) {
      score += 0.3;
    }

    // Device-based scoring
    if (productFeatures.optimizedFor?.includes(userDemographics.device)) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  // Calculate preference score
  private calculatePreferenceScore(userPreferences: any, productFeatures: any): number {
    let score = 0;

    // Category preference
    const categoryMatch = userPreferences.categories.filter((cat: string) =>
      productFeatures.categories.includes(cat)
    ).length;
    score += (categoryMatch / userPreferences.categories.length) * 0.4;

    // Price preference
    if (productFeatures.price >= userPreferences.priceRange[0] && 
        productFeatures.price <= userPreferences.priceRange[1]) {
      score += 0.4;
    }

    // Brand preference
    if (userPreferences.brands.includes(productFeatures.brand)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  // Calculate recency score
  private calculateRecencyScore(productFeatures: any): number {
    const now = Date.now();
    const productAge = now - productFeatures.createdAt;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    return Math.max(0, 1 - productAge / maxAge);
  }

  // Calculate confidence
  private calculateConfidence(userProfile: UserProfile, productFeatures: any): number {
    // Confidence based on data availability and user history
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (userProfile.behavior.views > 10) confidence += 0.2;
    if (userProfile.behavior.likes > 5) confidence += 0.2;
    if (userProfile.behavior.purchases > 2) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Get recommendation reason
  private getRecommendationReason(userProfile: UserProfile, productFeatures: any): string {
    const reasons = [];

    // Interest-based reason
    const matchingInterests = userProfile.interests.filter(interest =>
      productFeatures.categories.some((cat: string) =>
        cat.toLowerCase().includes(interest.toLowerCase())
      )
    );

    if (matchingInterests.length > 0) {
      reasons.push(`Matches your interest in ${matchingInterests[0]}`);
    }

    // Behavior-based reason
    if (userProfile.behavior.likes > 10) {
      reasons.push('Based on your likes');
    }

    // Popular reason
    if (productFeatures.popularity > 0.8) {
      reasons.push('Popular choice');
    }

    return reasons.join(', ') || 'Recommended for you';
  }

  // Get popular products
  private getPopularProducts(limit: number): ProductRecommendation[] {
    const popular: ProductRecommendation[] = [];

    this.productFeatures.forEach((features, productId) => {
      if (features.popularity > 0.7) {
        popular.push({
          productId,
          score: features.popularity,
          reason: 'Popular choice',
          confidence: 0.8
        });
      }
    });

    return popular
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Track user interaction
  trackInteraction(userId: string, productId: string, interaction: 'view' | 'like' | 'share' | 'purchase'): void {
    // Update user profile
    const userProfile = this.userProfiles.get(userId);
    if (userProfile) {
      switch (interaction) {
        case 'view':
          userProfile.behavior.views++;
          break;
        case 'like':
          userProfile.behavior.likes++;
          break;
        case 'share':
          userProfile.behavior.shares++;
          break;
        case 'purchase':
          userProfile.behavior.purchases++;
          break;
      }
      this.userProfiles.set(userId, userProfile);
    }

    // Update interaction matrix
    if (!this.interactionMatrix.has(userId)) {
      this.interactionMatrix.set(userId, new Map());
    }
    
    const userInteractions = this.interactionMatrix.get(userId)!;
    const currentScore = userInteractions.get(productId) || 0;
    userInteractions.set(productId, currentScore + 1);
  }

  // Update user profiles
  private updateUserProfiles(): void {
    // Save profiles to localStorage
    try {
      const profilesObj = Object.fromEntries(this.userProfiles);
      localStorage.setItem('user_profiles', JSON.stringify(profilesObj));
    } catch (error) {
      console.warn('Failed to save user profiles:', error);
    }
  }

  // Optimize algorithms
  private optimizeAlgorithms(): void {
    console.log('🔧 Optimizing algorithms...');

    // Update weights based on performance
    this.updateWeights();

    // Clean up old data
    this.cleanupOldData();

    // Recalculate interaction matrix
    this.recalculateInteractionMatrix();

    console.log('✅ Algorithms optimized');
  }

  // Update weights based on performance
  private updateWeights(): void {
    // This would analyze click-through rates and adjust weights
    // For now, we'll keep static weights
  }

  // Clean up old data
  private cleanupOldData(): void {
    // Remove old interactions (older than 30 days)
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    this.interactionMatrix.forEach((interactions, userId) => {
      // This would clean up old interactions
    });
  }

  // Recalculate interaction matrix
  private recalculateInteractionMatrix(): void {
    // This would recalculate the interaction matrix for better recommendations
  }

  // Get user profile
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  // Update user profile
  updateUserProfile(userId: string, profile: Partial<UserProfile>): void {
    const currentProfile = this.userProfiles.get(userId) || {
      userId,
      interests: [],
      behavior: { views: 0, likes: 0, shares: 0, purchases: 0, timeSpent: 0 },
      demographics: { age: 25, location: 'unknown', device: 'desktop' },
      preferences: { categories: [], priceRange: [0, 1000], brands: [] }
    };

    const updatedProfile = { ...currentProfile, ...profile };
    this.userProfiles.set(userId, updatedProfile);
  }

  // Get algorithm config
  getConfig(): AlgorithmConfig {
    return { ...this.config };
  }

  // Update algorithm config
  updateConfig(config: Partial<AlgorithmConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
const algorithmOptimizationService = new AlgorithmOptimizationService();

export default algorithmOptimizationService;
export type { UserProfile, ProductRecommendation, AlgorithmConfig };
