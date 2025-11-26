import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByhCgo_k9i8_AstSaZkZ3Atv5Rt2eOjhc",
  authDomain: "zaillisy.firebaseapp.com",
  databaseURL: "https://zaillisy-default-rtdb.firebaseio.com",
  projectId: "zaillisy",
  storageBucket: "zaillisy.firebasestorage.app",
  messagingSenderId: "984913226421",
  appId: "1:984913226421:web:c648bbccdd5055cf6cecfc",
  measurementId: "G-95WJ280TC9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed Categories
const seedCategories = async () => {
  const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
      icon: '📱',
      isActive: true,
      sortOrder: 1,
      subcategories: [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Laptops', slug: 'laptops' },
        { name: 'Tablets', slug: 'tablets' },
        { name: 'Accessories', slug: 'accessories' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'fashion',
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing and fashion accessories',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
      icon: '👗',
      isActive: true,
      sortOrder: 2,
      subcategories: [
        { name: 'Men\'s Clothing', slug: 'mens-clothing' },
        { name: 'Women\'s Clothing', slug: 'womens-clothing' },
        { name: 'Shoes', slug: 'shoes' },
        { name: 'Accessories', slug: 'accessories' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'beauty',
      name: 'Beauty & Health',
      slug: 'beauty',
      description: 'Beauty products and health items',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      icon: '💄',
      isActive: true,
      sortOrder: 3,
      subcategories: [
        { name: 'Skincare', slug: 'skincare' },
        { name: 'Makeup', slug: 'makeup' },
        { name: 'Hair Care', slug: 'hair-care' },
        { name: 'Health', slug: 'health' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'home',
      name: 'Home & Garden',
      slug: 'home',
      description: 'Home improvement and garden supplies',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      icon: '🏠',
      isActive: true,
      sortOrder: 4,
      subcategories: [
        { name: 'Furniture', slug: 'furniture' },
        { name: 'Decor', slug: 'decor' },
        { name: 'Kitchen', slug: 'kitchen' },
        { name: 'Garden', slug: 'garden' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      slug: 'sports',
      description: 'Sports equipment and fitness gear',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      icon: '⚽',
      isActive: true,
      sortOrder: 5,
      subcategories: [
        { name: 'Fitness', slug: 'fitness' },
        { name: 'Outdoor', slug: 'outdoor' },
        { name: 'Team Sports', slug: 'team-sports' },
        { name: 'Water Sports', slug: 'water-sports' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const category of categories) {
    await setDoc(doc(db, 'categories', category.id), category);
    console.log(`✅ Category added: ${category.name}`);
  }
};

// Seed Demo Users
const seedUsers = async () => {
  const users = [
    {
      id: 'demo-user-1',
      uid: 'demo-user-1',
      name: 'John Doe',
      email: 'john@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      bio: 'I love shopping for electronics!',
      role: 'user',
      approved: true,
      verified: false,
      followers: 25,
      following: 10,
      rating: 4.8,
      reviews: 15,
      totalSales: 0,
      totalProducts: 0,
      totalOrders: 5,
      totalRefunds: 0,
      location: 'Lahore, Pakistan',
      joinedAt: new Date(),
      phone: '+92-300-1234567',
      website: '',
      socialLinks: {
        instagram: '@johndoe',
        facebook: 'johndoe',
        twitter: '@johndoe'
      },
      businessInfo: {
        businessName: '',
        businessType: '',
        registrationNumber: '',
        taxId: ''
      },
      preferences: {
        notifications: true,
        emailMarketing: false,
        publicProfile: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-seller-1',
      uid: 'demo-seller-1',
      name: 'Tech Store',
      email: 'techstore@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechStore',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechStore',
      bio: 'Your trusted electronics store',
      role: 'seller',
      approved: true,
      verified: true,
      followers: 150,
      following: 5,
      rating: 4.9,
      reviews: 200,
      totalSales: 50000,
      totalProducts: 25,
      totalOrders: 150,
      totalRefunds: 2,
      location: 'Karachi, Pakistan',
      joinedAt: new Date(),
      phone: '+92-300-9876543',
      website: 'https://techstore.com',
      socialLinks: {
        instagram: '@techstore',
        facebook: 'techstore',
        twitter: '@techstore'
      },
      businessInfo: {
        businessName: 'Tech Store Pvt Ltd',
        businessType: 'retail',
        registrationNumber: 'REG123456',
        taxId: 'TAX789012'
      },
      preferences: {
        notifications: true,
        emailMarketing: true,
        publicProfile: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-admin-1',
      uid: 'demo-admin-1',
      name: 'Admin User',
      email: 'admin@zaillisy.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      bio: 'Zaillisy Platform Administrator',
      role: 'admin',
      approved: true,
      verified: true,
      followers: 0,
      following: 0,
      rating: 0,
      reviews: 0,
      totalSales: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRefunds: 0,
      location: 'Lahore, Pakistan',
      joinedAt: new Date(),
      phone: '+92-300-5555555',
      website: 'https://zaillisy.com',
      socialLinks: {
        instagram: '@zaillisy',
        facebook: 'zaillisy',
        twitter: '@zaillisy'
      },
      businessInfo: {
        businessName: 'Zaillisy Platform',
        businessType: 'platform',
        registrationNumber: 'REG000001',
        taxId: 'TAX000001'
      },
      preferences: {
        notifications: true,
        emailMarketing: false,
        publicProfile: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), user);
    console.log(`✅ User added: ${user.name} (${user.role})`);
  }
};

// Seed Demo Products
const seedProducts = async () => {
  const products = [
    {
      id: 'demo-product-1',
      title: 'iPhone 15 Pro',
      description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
      price: 150000,
      originalPrice: 160000,
      category: 'electronics',
      subcategory: 'smartphones',
      brand: 'Apple',
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'
      ],
      sellerId: 'demo-seller-1',
      sellerName: 'Tech Store',
      status: 'active',
      stock: 10,
      sku: 'IPH15PRO-001',
      tags: ['smartphone', 'apple', 'premium', '5g'],
      specifications: {
        color: 'Space Black',
        storage: '256GB',
        ram: '8GB',
        display: '6.1 inch Super Retina XDR',
        camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto'
      },
      shipping: {
        weight: '0.5kg',
        dimensions: '15x8x1cm',
        freeShipping: true
      },
      likes: ['demo-user-1'],
      views: 150,
      rating: 4.8,
      reviewCount: 25,
      comments: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-product-2',
      title: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone with S Pen and advanced AI features.',
      price: 140000,
      originalPrice: 150000,
      category: 'electronics',
      subcategory: 'smartphones',
      brand: 'Samsung',
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'
      ],
      sellerId: 'demo-seller-1',
      sellerName: 'Tech Store',
      status: 'active',
      stock: 8,
      sku: 'SGS24U-001',
      tags: ['smartphone', 'samsung', 'android', 's-pen'],
      specifications: {
        color: 'Titanium Black',
        storage: '512GB',
        ram: '12GB',
        display: '6.8 inch Dynamic AMOLED 2X',
        camera: '200MP Main + 50MP Periscope + 10MP Telephoto + 12MP Ultra Wide'
      },
      shipping: {
        weight: '0.6kg',
        dimensions: '16x8x1cm',
        freeShipping: true
      },
      likes: ['demo-user-1'],
      views: 120,
      rating: 4.7,
      reviewCount: 18,
      comments: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-product-3',
      title: 'MacBook Pro M3',
      description: 'Powerful laptop with M3 chip, perfect for professionals and creators.',
      price: 250000,
      originalPrice: 270000,
      category: 'electronics',
      subcategory: 'laptops',
      brand: 'Apple',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'
      ],
      sellerId: 'demo-seller-1',
      sellerName: 'Tech Store',
      status: 'active',
      stock: 5,
      sku: 'MBPM3-001',
      tags: ['laptop', 'apple', 'macbook', 'm3'],
      specifications: {
        color: 'Space Gray',
        storage: '512GB SSD',
        ram: '16GB',
        display: '14.2 inch Liquid Retina XDR',
        processor: 'Apple M3 chip'
      },
      shipping: {
        weight: '1.6kg',
        dimensions: '31x22x2cm',
        freeShipping: true
      },
      likes: [],
      views: 80,
      rating: 4.9,
      reviewCount: 12,
      comments: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const product of products) {
    await setDoc(doc(db, 'products', product.id), product);
    console.log(`✅ Product added: ${product.title}`);
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedCategories();
    await seedUsers();
    await seedProducts();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('🎉 Your Zaillisy platform is ready with demo data!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run the seed function
seedDatabase();
