// Example React component demonstrating the use of marketplace services
import React, { useState, useEffect } from 'react';
import { 
  marketplaceService,
  getCurrentUser,
  isSeller
} from './index';
import { Product, Reel, Cart, Order } from './types';
import { Story } from './storiesService';

const MarketplaceExample: React.FC = () => {
  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserSeller, setIsUserSeller] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0
  });
  
  const [reelForm, setReelForm] = useState({
    videoUrl: '',
    caption: ''
  });
  
  const [applicationForm, setApplicationForm] = useState({
    requestedType: 'personal_seller' as 'personal_seller' | 'brand' | 'company',
    businessDescription: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  // Initialize user and check seller status
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      isSeller(user.sub).then(setIsUserSeller);
    }
  }, []);

  // Subscribe to real-time data
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Subscribe to products
    const unsubscribeProducts = marketplaceService.subscribeToProducts(setProducts);
    unsubscribes.push(unsubscribeProducts);
    
    // Subscribe to reels
    const unsubscribeReels = marketplaceService.subscribeToReels(setReels);
    unsubscribes.push(unsubscribeReels);
    
    // Subscribe to stories
    const unsubscribeStories = marketplaceService.subscribeToStories(setStories);
    unsubscribes.push(unsubscribeStories);
    
    // Subscribe to cart (if user is logged in)
    if (currentUser) {
      const unsubscribeCart = marketplaceService.subscribeToCart(setCart);
      unsubscribes.push(unsubscribeCart);
      
      // Subscribe to user orders
      const unsubscribeOrders = marketplaceService.subscribeToUserOrders(setOrders);
      unsubscribes.push(unsubscribeOrders);
      
      // Subscribe to user applications
      const unsubscribeApplications = marketplaceService.subscribeToMyApplications(setApplications);
      unsubscribes.push(unsubscribeApplications);
    }
    
    // Cleanup subscriptions
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  // Handle product form changes
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  // Handle reel form changes
  const handleReelFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReelForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle application form changes
  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setApplicationForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof applicationForm],
          [child]: value
        }
      }));
    } else {
      setApplicationForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Create product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productId = await marketplaceService.createProduct({
        ...productForm,
        images: [] // In a real app, you would upload images first
      });
      console.log('Product created:', productId);
      // Reset form
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: '',
        stock: 0
      });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  // Create reel
  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reelId = await marketplaceService.createReel(reelForm);
      console.log('Reel created:', reelId);
      // Reset form
      setReelForm({
        videoUrl: '',
        caption: ''
      });
    } catch (error) {
      console.error('Error creating reel:', error);
    }
  };

  // Submit seller application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const applicationId = await marketplaceService.submitSellerApplication(applicationForm);
      console.log('Application submitted:', applicationId);
      // Reset form
      setApplicationForm({
        requestedType: 'personal_seller',
        businessDescription: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  // Add to cart
  const handleAddToCart = async (productId: string) => {
    try {
      await marketplaceService.addToCart(productId, 1);
      console.log('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Create order
  const handleCreateOrder = async () => {
    try {
      // In a real app, you would collect shipping address
      const shippingAddress = {
        id: '',
        userId: currentuser?.sub || '',
        type: 'home' as const,
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'Country',
        phone: '123-456-7890',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const orderId = await marketplaceService.createOrder(shippingAddress);
      console.log('Order created:', orderId);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  // Like reel
  const handleLikeReel = async (reelId: string) => {
    try {
      await marketplaceService.likeReel(reelId);
      console.log('Reel liked');
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  return (
    <div className="marketplace-example">
      <h1>Marketplace Example</h1>
      
      {/* User Info */}
      <div className="user-info">
        <h2>User Information</h2>
        {currentUser ? (
          <div>
            <p>User ID: {currentuser.sub}</p>
            <p>Email: {currentUser.email}</p>
            <p>Is Seller: {isUserSeller ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>Please sign in to use the marketplace</p>
        )}
      </div>
      
      {/* Seller Application (for non-sellers) */}
      {!isUserSeller && currentUser && (
        <div className="seller-application">
          <h2>Apply to Become a Seller</h2>
          <form onSubmit={handleSubmitApplication}>
            <div>
              <label>Account Type:</label>
              <select 
                name="requestedType" 
                value={applicationForm.requestedType}
                onChange={handleApplicationFormChange}
              >
                <option value="personal_seller">Personal Seller</option>
                <option value="brand">Brand</option>
                <option value="company">Company</option>
              </select>
            </div>
            
            <div>
              <label>Business Description:</label>
              <textarea 
                name="businessDescription"
                value={applicationForm.businessDescription}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <div>
              <label>Phone:</label>
              <input 
                type="text"
                name="phone"
                value={applicationForm.phone}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <h3>Address</h3>
            <div>
              <label>Street:</label>
              <input 
                type="text"
                name="address.street"
                value={applicationForm.address.street}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <div>
              <label>City:</label>
              <input 
                type="text"
                name="address.city"
                value={applicationForm.address.city}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <div>
              <label>State:</label>
              <input 
                type="text"
                name="address.state"
                value={applicationForm.address.state}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <div>
              <label>ZIP Code:</label>
              <input 
                type="text"
                name="address.zipCode"
                value={applicationForm.address.zipCode}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <div>
              <label>Country:</label>
              <input 
                type="text"
                name="address.country"
                value={applicationForm.address.country}
                onChange={handleApplicationFormChange}
                required
              />
            </div>
            
            <button type="submit">Submit Application</button>
          </form>
          
          <h3>My Applications</h3>
          <ul>
            {applications.map(app => (
              <li key={app.id}>
                <p>Type: {app.requestedType}</p>
                <p>Status: {app.status}</p>
                {app.rejectionReason && <p>Reason: {app.rejectionReason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Product Creation (for sellers) */}
      {isUserSeller && (
        <div className="product-creation">
          <h2>Create Product</h2>
          <form onSubmit={handleCreateProduct}>
            <div>
              <label>Name:</label>
              <input 
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleProductFormChange}
                required
              />
            </div>
            
            <div>
              <label>Description:</label>
              <textarea 
                name="description"
                value={productForm.description}
                onChange={handleProductFormChange}
                required
              />
            </div>
            
            <div>
              <label>Price:</label>
              <input 
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleProductFormChange}
                required
              />
            </div>
            
            <div>
              <label>Category:</label>
              <input 
                type="text"
                name="category"
                value={productForm.category}
                onChange={handleProductFormChange}
                required
              />
            </div>
            
            <div>
              <label>Stock:</label>
              <input 
                type="number"
                name="stock"
                value={productForm.stock}
                onChange={handleProductFormChange}
                required
              />
            </div>
            
            <button type="submit">Create Product</button>
          </form>
        </div>
      )}
      
      {/* Reel Creation (for sellers) */}
      {isUserSeller && (
        <div className="reel-creation">
          <h2>Create Reel</h2>
          <form onSubmit={handleCreateReel}>
            <div>
              <label>Video URL:</label>
              <input 
                type="text"
                name="videoUrl"
                value={reelForm.videoUrl}
                onChange={handleReelFormChange}
                required
              />
            </div>
            
            <div>
              <label>Caption:</label>
              <textarea 
                name="caption"
                value={reelForm.caption}
                onChange={handleReelFormChange}
              />
            </div>
            
            <button type="submit">Create Reel</button>
          </form>
        </div>
      )}
      
      {/* Product Feed */}
      <div className="product-feed">
        <h2>Products</h2>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Price: ${product.price}</p>
              <p>Stock: {product.stock}</p>
              {currentUser && (
                <button onClick={() => handleAddToCart(product.id || '')}>
                  Add to Cart
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Cart */}
      {currentUser && cart && (
        <div className="cart">
          <h2>Cart ({cart.itemCount} items)</h2>
          <ul>
            {cart.items.map(item => (
              <li key={item.id}>
                {item.product.title} - Quantity: {item.quantity}
              </li>
            ))}
          </ul>
          <p>Total: ${cart.subtotal.toFixed(2)}</p>
          <button onClick={handleCreateOrder}>Checkout</button>
        </div>
      )}
      
      {/* Orders */}
      {currentUser && orders.length > 0 && (
        <div className="orders">
          <h2>My Orders</h2>
          <ul>
            {orders.map(order => (
              <li key={order.id}>
                <p>Order ID: {order.id}</p>
                <p>Status: {order.status}</p>
                <p>Total: ${order.total.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Reels */}
      <div className="reels">
        <h2>Reels</h2>
        <div className="reels-grid">
          {reels.map(reel => (
            <div key={reel.id} className="reel-card">
              <video src={reel.videoUrl} controls />
              <p>{reel.caption}</p>
              <p>Likes: {reel.likesCount}</p>
              {currentUser && (
                <button onClick={() => reel.id && handleLikeReel(reel.id)}>
                  Like
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Stories */}
      <div className="stories">
        <h2>Stories</h2>
        <div className="stories-grid">
          {stories.map(story => (
            <div key={story.id} className="story-card">
              {story.mediaType === 'image' ? (
                <img src={story.storyImage} alt="Story" />
              ) : (
                <video src={story.storyVideo} controls />
              )}
              <p>{story.userName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceExample;
