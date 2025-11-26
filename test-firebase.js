// Simple Firebase connection test
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBN-PcNZHKSUy6S6E5xO4VXZyyHo_So_a0",
  authDomain: "gorel-c2897.firebaseapp.com",
  databaseURL: "https://gorel-c2897-default-rtdb.firebaseio.com",
  projectId: "gorel-c2897",
  storageBucket: "gorel-c2897.firebasestorage.app",
  messagingSenderId: "50178725411",
  appId: "1:50178725411:web:ebb8c57ac66e1cc08e0396",
  measurementId: "G-4JRQV4F939"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const testProducts = [
  {
    title: "Premium Cotton T-Shirt",
    description: "High-quality cotton t-shirt with a comfortable fit. Perfect for everyday wear.",
    price: 25.99,
    category: "Fashion & Clothing",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"
    ],
    stock: 50,
    sellerId: "demo-seller-1",
    sellerName: "Fashion Store",
    likes: [],
    views: 120,
    rating: 4.5,
    reviewCount: 8,
    status: "active",
    createdAt: new Date()
  },
  {
    title: "Wireless Bluetooth Headphones",
    description: "Premium wireless headphones with noise cancellation. Perfect for music lovers.",
    price: 89.99,
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop"
    ],
    stock: 25,
    sellerId: "demo-seller-2",
    sellerName: "Tech Gadgets",
    likes: [],
    views: 85,
    rating: 4.8,
    reviewCount: 12,
    status: "active",
    createdAt: new Date()
  },
  {
    title: "Organic Face Cream",
    description: "Natural and organic face cream with anti-aging properties. Suitable for all skin types.",
    price: 34.99,
    category: "Beauty & Health",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop"
    ],
    stock: 30,
    sellerId: "demo-seller-3",
    sellerName: "Beauty Essentials",
    likes: [],
    views: 95,
    rating: 4.6,
    reviewCount: 15,
    status: "active",
    createdAt: new Date()
  }
];

async function testFirebaseConnection() {
  try {
    console.log('🔗 Testing Firebase connection...');
    
    // Test reading from Firestore
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    console.log(`✅ Successfully connected to Firebase! Found ${snapshot.size} existing products.`);
    
    // Add test products if none exist
    if (snapshot.size === 0) {
      console.log('📦 Adding test products...');
      for (const product of testProducts) {
        await addDoc(productsRef, product);
        console.log(`✅ Added: ${product.title}`);
      }
      console.log('🎉 Test products added successfully!');
    } else {
      console.log('📦 Products already exist, skipping test data creation.');
    }
    
    // List all products
    const allProducts = await getDocs(productsRef);
    console.log('\n📋 Current products in database:');
    allProducts.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.title} ($${data.price}) by ${data.sellerName}`);
    });
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

testFirebaseConnection();
