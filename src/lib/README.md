# Firebase Marketplace Backend Implementation

This document describes the complete backend implementation for the React eCommerce + Instagram-style marketplace using Firebase.

## Overview

The implementation provides a fully functional backend with:
- User authentication and account management
- Seller application and approval workflow
- Product management for approved sellers
- Social features (stories and reels)
- Shopping cart and order management
- Real-time updates using Firestore listeners
- Proper security rules enforcement

## Firebase Collections Structure

### Users Collection
```
users/{userId}
- id: string
- email: string
- name: string
- displayName: string (optional)
- username: string (optional)
- avatar: string (optional)
- role: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin'
- accountType: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin'
- isVerified: boolean
- isVerifiedSeller: boolean
- isActive: boolean
- createdAt: Date
- updatedAt: Date
```

### Products Collection
```
products/{productId}
- id: string (optional)
- sellerId: string
- name: string
- description: string
- price: number
- images: string[]
- category: string
- stock: number
- createdAt: any
- [additional fields as needed]
```

### Orders Collection
```
orders/{orderId}
- buyerId: string
- items: OrderItem[]
- subtotal: number
- tax: number
- shipping: number
- discount: number
- total: number
- currency: string
- status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
- paymentMethod: 'cod' | 'online' | 'bank_transfer'
- shippingAddress: Address
- createdAt: any
- updatedAt: any
```

### Carts Collection
```
carts/{userId}
- userId: string
- items: CartItem[]
- itemCount: number
- subtotal: number
- updatedAt: Date
```

### Applications Collection
```
applications/{applicationId}
- id: string (optional)
- userId: string
- requestedType: 'personal_seller' | 'brand' | 'company'
- businessName: string (optional)
- businessDescription: string
- status: 'pending' | 'approved' | 'rejected'
- submittedAt: any
- approvedAt: any (optional)
- rejectionReason: string (optional)
- documents: string[] (optional)
- phone: string
- address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
```

### Stories Collection
```
stories/{storyId}
- userId: string
- userName: string
- userPhoto: string
- storyImage: string
- storyImagePath: string
- storyVideo: string (optional)
- storyVideoPath: string (optional)
- mediaType: 'image' | 'video'
- privacy: 'public' | 'followers' | 'close_friends'
- createdAt: any
- expiresAt: any
- views: string[]
- isActive: boolean
```

### Reels Collection
```
reels/{reelId}
- userId: string
- productId: string (optional)
- product: Product (optional)
- videoUrl: string
- thumbnailUrl: string (optional)
- caption: string (optional)
- tags: string[] (optional)
- duration: number (optional)
- likesCount: number (optional)
- commentsCount: number (optional)
- sharesCount: number (optional)
- viewsCount: number (optional)
- likedBy: string[] (optional)
- status: 'active' | 'inactive' | 'pending' (optional)
- createdAt: any
- updatedAt: any
```

### Reels Comments Subcollection
```
reels/{reelId}/comments/{commentId}
- userId: string
- userName: string
- userPhoto: string
- content: string
- likesCount: number
- createdAt: any
- updatedAt: any
```

## Key Services

### Authentication Service (`auth.ts`)
- User sign up and sign in
- Google authentication
- User role and account type management
- Admin and seller verification

### Marketplace Service (`marketplaceService.ts`)
- Seller application submission and management
- Admin application approval/rejection
- Product creation and management
- Story and reel creation
- Cart management
- Order creation
- Real-time subscriptions for all collections

### Product Service (`productService.ts`)
- Product CRUD operations
- Product search and filtering
- Product likes and views

### Cart Service (`cartService.ts`)
- Cart CRUD operations
- Real-time cart updates

### Order Service (`orderService.ts`)
- Order creation and management
- Order status updates

### Reels Service (`reelsService.ts`)
- Reel CRUD operations
- Reel interactions (likes, comments)
- Real-time updates

### Stories Service (`storiesService.ts`)
- Story CRUD operations
- Story management

### Application Service (`applicationService.ts`)
- Seller application management
- Application status updates

## Security Rules

The Firestore and Storage security rules have been updated to enforce:
- Only authenticated users can create data
- Only owners or admins can edit/delete data
- Only approved sellers/brands/companies can create products, stories, or reels
- Applications can only be updated by admin

## Real-time Features

All major collections support real-time updates through Firestore listeners:
- Product feeds
- Stories and reels
- Cart updates
- Order status changes
- Comments and likes

## Usage Examples

### User Authentication
```typescript
import { signUp, signIn, getCurrentUser } from './lib';

// Sign up a new user
const user = await signUp('user@example.com', 'password', 'User Name');

// Sign in existing user
const user = await signIn('user@example.com', 'password');

// Get current user
const currentUser = getCurrentUser();
```

### Seller Application
```typescript
import { marketplaceService } from './lib';

// Submit seller application
const applicationId = await marketplaceService.submitSellerApplication({
  requestedType: 'personal_seller',
  businessDescription: 'My business description',
  phone: '123-456-7890',
  address: {
    street: '123 Main St',
    city: 'City',
    state: 'State',
    zipCode: '12345',
    country: 'Country'
  }
});
```

### Product Management
```typescript
import { marketplaceService } from './lib';

// Create a product (only for approved sellers)
const productId = await marketplaceService.createProduct({
  name: 'Product Name',
  description: 'Product Description',
  price: 29.99,
  images: ['image-url-1', 'image-url-2'],
  category: 'Electronics',
  stock: 100
});

// Upload product image
const imageUrl = await marketplaceService.uploadProductImage(file, productId);
```

### Cart Management
```typescript
import { marketplaceService } from './lib';

// Add to cart
await marketplaceService.addToCart(productId, 2);

// Remove from cart
await marketplaceService.removeFromCart(productId);

// Clear cart
await marketplaceService.clearCart();

// Subscribe to cart updates
const unsubscribe = marketplaceService.subscribeToCart((cart) => {
  console.log('Cart updated:', cart);
});
```

### Order Management
```typescript
import { marketplaceService } from './lib';

// Create order
const orderId = await marketplaceService.createOrder(shippingAddress);

// Get user orders
const orders = await marketplaceService.getUserOrders();

// Subscribe to order updates
const unsubscribe = marketplaceService.subscribeToUserOrders((orders) => {
  console.log('Orders updated:', orders);
});
```

### Social Features
```typescript
import { marketplaceService } from './lib';

// Create reel
const reelId = await marketplaceService.createReel({
  videoUrl: 'video-url',
  caption: 'My reel caption'
});

// Like reel
await marketplaceService.likeReel(reelId);

// Add comment to reel
const commentId = await marketplaceService.addReelComment(reelId, 'Great reel!');

// Create story
const storyId = await marketplaceService.createStory(storyData);

// Subscribe to reels
const unsubscribe = marketplaceService.subscribeToReels((reels) => {
  console.log('Reels updated:', reels);
});
```

## React Hooks Usage

Custom React hooks are provided in `exampleUsage.ts` for easy integration:

```typescript
// In your React component
import { useCart, useProductFeed, useReels } from './lib/exampleUsage';

const MyComponent = () => {
  const { cart, addToCart, removeFromCart } = useCart();
  const { products } = useProductFeed();
  const { reels, likeReel, addReelComment } = useReels();

  return (
    <div>
      {/* Render products, cart, reels, etc. */}
    </div>
  );
};
```

## Implementation Notes

1. All services properly handle authentication state and permissions
2. Real-time updates are implemented using Firestore `onSnapshot` listeners
3. Security rules enforce proper access control based on user roles
4. Media uploads are handled through Firebase Storage with proper security rules
5. All operations include proper error handling and logging
6. The implementation maintains compatibility with existing frontend components
7. Type safety is enforced through TypeScript interfaces

This implementation provides a complete backend foundation for the marketplace application with all requested features properly integrated with Firebase.