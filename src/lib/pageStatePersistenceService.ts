// Page State Persistence Service - Prevent page reloads on back navigation
interface PageState {
  pathname: string;
  scrollPosition: number;
  timestamp: number;
  data?: any;
}

class PageStatePersistenceService {
  private pageStates = new Map<string, PageState>();
  private readonly MAX_STATES = 20;
  private currentPath = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNavigationListeners();
    }
  }

  // Set up navigation listeners
  private setupNavigationListeners(): void {
    // Listen for beforeunload to save current state
    window.addEventListener('beforeunload', () => {
      this.saveCurrentState();
    });

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.restoreState();
    });

    // Listen for route changes
    this.setupRouteChangeListener();
  }

  // Set up route change listener
  private setupRouteChangeListener(): void {
    // Override pushState and replaceState to track navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.saveCurrentState();
      originalPushState.apply(history, args);
      this.currentPath = window.location.pathname;
      this.restoreState();
    };

    history.replaceState = (...args) => {
      this.saveCurrentState();
      originalReplaceState.apply(history, args);
      this.currentPath = window.location.pathname;
    };
  }

  // Save current page state
  saveCurrentState(): void {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    const state: PageState = {
      pathname,
      scrollPosition,
      timestamp: Date.now(),
      data: this.getPageData()
    };

    this.pageStates.set(pathname, state);
    this.currentPath = pathname;

    // Clean up old states
    this.cleanupOldStates();
  }

  // Restore page state
  restoreState(): void {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    const state = this.pageStates.get(pathname);

    if (state) {
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, state.scrollPosition);
      }, 100);

      // Restore page data
      this.restorePageData(state.data);
    }
  }

  // Get page-specific data
  private getPageData(): any {
    const pathname = window.location.pathname;
    
    // Get data based on page type
    if (pathname === '/') {
      return {
        products: this.getProductsData(),
        filters: this.getFiltersData()
      };
    } else if (pathname.startsWith('/profile/')) {
      return {
        profile: this.getProfileData(),
        posts: this.getPostsData()
      };
    } else if (pathname === '/explore') {
      return {
        categories: this.getCategoriesData(),
        searchQuery: this.getSearchQuery()
      };
    }
    
    return null;
  }

  // Restore page-specific data
  private restorePageData(data: any): void {
    if (!data) return;

    const pathname = window.location.pathname;
    
    if (pathname === '/' && data.products) {
      this.restoreProductsData(data.products);
      this.restoreFiltersData(data.filters);
    } else if (pathname.startsWith('/profile/') && data.profile) {
      this.restoreProfileData(data.profile);
      this.restorePostsData(data.posts);
    } else if (pathname === '/explore' && data.categories) {
      this.restoreCategoriesData(data.categories);
      this.restoreSearchQuery(data.searchQuery);
    }
  }

  // Helper methods for getting data
  private getProductsData(): any {
    // Get products from DOM or state
    const products = document.querySelectorAll('[data-product]');
    return Array.from(products).map(el => ({
      id: el.getAttribute('data-product-id'),
      name: el.querySelector('[data-product-name]')?.textContent,
      price: el.querySelector('[data-product-price]')?.textContent
    }));
  }

  private getFiltersData(): any {
    // Get filter state
    const filters = document.querySelectorAll('[data-filter]');
    return Array.from(filters).map(el => ({
      name: el.getAttribute('data-filter'),
      value: el.getAttribute('data-value'),
      checked: el.checked
    }));
  }

  private getProfileData(): any {
    // Get profile data
    const profileEl = document.querySelector('[data-profile]');
    if (profileEl) {
      return {
        name: profileEl.querySelector('[data-profile-name]')?.textContent,
        bio: profileEl.querySelector('[data-profile-bio]')?.textContent,
        followers: profileEl.querySelector('[data-profile-followers]')?.textContent
      };
    }
    return null;
  }

  private getPostsData(): any {
    // Get posts data
    const posts = document.querySelectorAll('[data-post]');
    return Array.from(posts).map(el => ({
      id: el.getAttribute('data-post-id'),
      content: el.querySelector('[data-post-content]')?.textContent
    }));
  }

  private getCategoriesData(): any {
    // Get categories data
    const categories = document.querySelectorAll('[data-category]');
    return Array.from(categories).map(el => ({
      name: el.getAttribute('data-category'),
      count: el.getAttribute('data-count')
    }));
  }

  private getSearchQuery(): string {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    return searchInput?.value || '';
  }

  // Helper methods for restoring data
  private restoreProductsData(products: any[]): void {
    // Restore products state
    products.forEach(product => {
      const el = document.querySelector(`[data-product-id="${product.id}"]`);
      if (el) {
        // Restore product state
      }
    });
  }

  private restoreFiltersData(filters: any[]): void {
    // Restore filter state
    filters.forEach(filter => {
      const el = document.querySelector(`[data-filter="${filter.name}"]`);
      if (el && el instanceof HTMLInputElement) {
        el.checked = filter.checked;
      }
    });
  }

  private restoreProfileData(profile: any): void {
    // Restore profile state
    const profileEl = document.querySelector('[data-profile]');
    if (profileEl && profile) {
      const nameEl = profileEl.querySelector('[data-profile-name]');
      const bioEl = profileEl.querySelector('[data-profile-bio]');
      const followersEl = profileEl.querySelector('[data-profile-followers]');
      
      if (nameEl) nameEl.textContent = profile.name;
      if (bioEl) bioEl.textContent = profile.bio;
      if (followersEl) followersEl.textContent = profile.followers;
    }
  }

  private restorePostsData(posts: any[]): void {
    // Restore posts state
    posts.forEach(post => {
      const el = document.querySelector(`[data-post-id="${post.id}"]`);
      if (el) {
        const contentEl = el.querySelector('[data-post-content]');
        if (contentEl) contentEl.textContent = post.content;
      }
    });
  }

  private restoreCategoriesData(categories: any[]): void {
    // Restore categories state
    categories.forEach(category => {
      const el = document.querySelector(`[data-category="${category.name}"]`);
      if (el) {
        el.setAttribute('data-count', category.count);
      }
    });
  }

  private restoreSearchQuery(query: string): void {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = query;
    }
  }

  // Clean up old states
  private cleanupOldStates(): void {
    if (this.pageStates.size > this.MAX_STATES) {
      const states = Array.from(this.pageStates.entries());
      states.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = states.slice(0, states.length - this.MAX_STATES);
      toDelete.forEach(([pathname]) => {
        this.pageStates.delete(pathname);
      });
    }
  }

  // Clear all states
  clearAllStates(): void {
    this.pageStates.clear();
  }

  // Get state for specific path
  getState(pathname: string): PageState | null {
    return this.pageStates.get(pathname) || null;
  }

  // Check if state exists for path
  hasState(pathname: string): boolean {
    return this.pageStates.has(pathname);
  }
}

// Singleton instance
const pageStatePersistenceService = new PageStatePersistenceService();

export default pageStatePersistenceService;
