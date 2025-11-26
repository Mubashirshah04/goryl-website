'use client';
import { useState, useEffect } from 'react';
import { Smartphone, Laptop, Tv, Headphones, Camera, Watch, Shirt, ShoppingBag, Diamond, Home, Sofa, Lamp, ChefHat, Heart, Sparkles, Scissors, Palette, Dumbbell, Bike, Gamepad2, Trophy, Search, BookOpen, GraduationCap, Car, PawPrint, Wrench, Baby, Users, Music, Gift, Zap, Star, ChevronRight, Tablet, Printer, Speaker, Keyboard, Gamepad, Monitor, Server, Wifi, Shield, Code, Database, Cloud, Globe, Coffee, Wine, Beer, Cake, Apple, Eye, Brain, Pill, Building, Factory, Hammer, Paintbrush, Calculator, Microscope, Map, Package, Truck, Droplets, Clock, Leaf, Newspaper, TrendingUp, User, Thermometer, Volume2, Mountain, Snowflake, Flag, Target, Puzzle, Blocks, Milk, Beef, Wheat, Store, Settings, Stethoscope, Wind, Bandage, Circle, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
// Default categories structure with icons and styling
const defaultCategories = [
    {
        id: 'electronics',
        name: 'Electronics & Tech',
        icon: Smartphone,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        description: 'Latest gadgets & technology',
        featured: true,
        subcategories: [
            { name: 'Smartphones', icon: Smartphone },
            { name: 'Laptops & PCs', icon: Laptop },
            { name: 'Tablets & iPads', icon: Tablet },
            { name: 'TVs & Audio', icon: Tv },
            { name: 'Cameras & Drones', icon: Camera },
            { name: 'Accessories', icon: Headphones },
            { name: 'Gaming', icon: Gamepad2 },
            { name: 'Smartwatches', icon: Watch },
            { name: 'Printers & Scanners', icon: Printer },
            { name: 'Speakers & Audio', icon: Speaker },
            { name: 'Keyboards & Mice', icon: Keyboard },
            { name: 'Monitors & Displays', icon: Monitor },
            { name: 'Servers & Networking', icon: Server },
            { name: 'WiFi & Internet', icon: Wifi },
            { name: 'Security & Surveillance', icon: Shield },
            { name: 'Software & Apps', icon: Code },
            { name: 'Data Storage', icon: Database },
            { name: 'Cloud Services', icon: Cloud }
        ]
    },
    {
        id: 'fashion',
        name: 'Fashion & Style',
        icon: Shirt,
        color: 'from-pink-500 to-rose-600',
        bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
        description: 'Trendy clothing & accessories',
        featured: true,
        subcategories: [
            { name: 'Men\'s Fashion', icon: Users },
            { name: 'Women\'s Fashion', icon: Sparkles },
            { name: 'Kids & Baby', icon: Baby },
            { name: 'Footwear', icon: ShoppingBag },
            { name: 'Jewelry & Watches', icon: Diamond },
            { name: 'Bags & Accessories', icon: ShoppingBag },
            { name: 'Sports Wear', icon: Dumbbell },
            { name: 'Formal Wear', icon: Shirt },
            { name: 'Swimwear', icon: Droplets },
            { name: 'Underwear & Lingerie', icon: Heart },
            { name: 'Costumes & Party', icon: Gift },
            { name: 'Vintage & Retro', icon: Clock },
            { name: 'Ethnic & Cultural', icon: Globe },
            { name: 'Maternity', icon: Heart },
            { name: 'Plus Size', icon: Users },
            { name: 'Petite', icon: Users },
            { name: 'Luxury & Designer', icon: Diamond },
            { name: 'Sustainable Fashion', icon: Leaf }
        ]
    },
    {
        id: 'home-garden',
        name: 'Home & Garden',
        icon: Home,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
        description: 'Everything for your home',
        featured: true,
        subcategories: [
            { name: 'Furniture', icon: Sofa },
            { name: 'Kitchen Appliances', icon: ChefHat },
            { name: 'Lighting & Decor', icon: Lamp },
            { name: 'Bedding & Bath', icon: Home },
            { name: 'Storage & Organization', icon: Package },
            { name: 'Garden & Outdoor', icon: Home },
            { name: 'Cleaning Supplies', icon: Sparkles },
            { name: 'Pet Supplies', icon: PawPrint },
            { name: 'Tools & Hardware', icon: Wrench },
            { name: 'Paint & DIY', icon: Paintbrush },
            { name: 'Home Security', icon: Shield },
            { name: 'Smart Home', icon: Wifi },
            { name: 'Home Office', icon: Monitor },
            { name: 'Baby & Kids Room', icon: Baby },
            { name: 'Laundry & Care', icon: Droplets },
            { name: 'Air Quality', icon: Wind },
            { name: 'Heating & Cooling', icon: Thermometer },
            { name: 'Plumbing', icon: Droplets }
        ]
    },
    {
        id: 'beauty-health',
        name: 'Beauty & Health',
        icon: Heart,
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
        description: 'Wellness & personal care',
        featured: true,
        subcategories: [
            { name: 'Skincare', icon: Sparkles },
            { name: 'Makeup & Cosmetics', icon: Palette },
            { name: 'Hair Care', icon: Scissors },
            { name: 'Fragrances', icon: Sparkles },
            { name: 'Health & Supplements', icon: Heart },
            { name: 'Personal Care', icon: Heart },
            { name: 'Dental Care', icon: Eye },
            { name: 'Medical Devices', icon: Thermometer },
            { name: 'Fitness & Wellness', icon: Dumbbell },
            { name: 'Mental Health', icon: Brain },
            { name: 'Alternative Medicine', icon: Leaf },
            { name: 'First Aid', icon: Bandage },
            { name: 'Vision Care', icon: Eye },
            { name: 'Hearing Aids', icon: Volume2 },
            { name: 'Mobility Aids', icon: Car },
            { name: 'Maternity Care', icon: Baby },
            { name: 'Senior Care', icon: Users },
            { name: 'Pet Health', icon: PawPrint }
        ]
    },
    {
        id: 'sports-fitness',
        name: 'Sports & Fitness',
        icon: Dumbbell,
        color: 'from-orange-500 to-red-600',
        bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
        description: 'Active lifestyle & fitness',
        featured: true,
        subcategories: [
            { name: 'Fitness Equipment', icon: Dumbbell },
            { name: 'Sports Gear', icon: Trophy },
            { name: 'Outdoor Sports', icon: Bike },
            { name: 'Team Sports', icon: Users },
            { name: 'Yoga & Meditation', icon: Heart },
            { name: 'Swimming', icon: Droplets },
            { name: 'Running', icon: Zap },
            { name: 'Cycling', icon: Bike },
            { name: 'Hiking & Camping', icon: Mountain },
            { name: 'Water Sports', icon: Droplets },
            { name: 'Winter Sports', icon: Snowflake },
            { name: 'Combat Sports', icon: Shield },
            { name: 'Dance & Gymnastics', icon: Music },
            { name: 'Golf', icon: Flag },
            { name: 'Tennis & Racquet', icon: Trophy },
            { name: 'Fishing', icon: Target },
            { name: 'Hunting', icon: Target },
            { name: 'Adventure Sports', icon: Mountain }
        ]
    },
    {
        id: 'books-education',
        name: 'Books & Education',
        icon: BookOpen,
        color: 'from-yellow-500 to-amber-600',
        bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        description: 'Knowledge & learning',
        featured: false,
        subcategories: [
            { name: 'Fiction', icon: BookOpen },
            { name: 'Non-Fiction', icon: GraduationCap },
            { name: 'Academic', icon: GraduationCap },
            { name: 'Children\'s Books', icon: Baby },
            { name: 'Magazines', icon: Newspaper },
            { name: 'E-Books', icon: Tablet },
            { name: 'Audiobooks', icon: Music },
            { name: 'Textbooks', icon: BookOpen },
            { name: 'Language Learning', icon: Globe },
            { name: 'Professional Development', icon: TrendingUp },
            { name: 'Cooking & Food', icon: ChefHat },
            { name: 'Travel Guides', icon: Map },
            { name: 'Self-Help', icon: Heart },
            { name: 'Biography & Memoir', icon: User },
            { name: 'Science & Technology', icon: Microscope },
            { name: 'History', icon: Clock },
            { name: 'Philosophy', icon: Brain },
            { name: 'Religious & Spiritual', icon: Heart }
        ]
    },
    {
        id: 'automotive',
        name: 'Automotive',
        icon: Car,
        color: 'from-gray-600 to-gray-800',
        bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
        description: 'Cars, parts & accessories',
        featured: false,
        subcategories: [
            { name: 'Car Parts', icon: Wrench },
            { name: 'Motorcycle Parts', icon: Bike },
            { name: 'Truck Parts', icon: Truck },
            { name: 'Accessories', icon: Package },
            { name: 'Tools & Equipment', icon: Wrench },
            { name: 'Oils & Fluids', icon: Droplets },
            { name: 'Tires & Wheels', icon: Circle },
            { name: 'Audio & Electronics', icon: Speaker },
            { name: 'Safety & Security', icon: Shield },
            { name: 'Cleaning & Care', icon: Sparkles },
            { name: 'Performance', icon: Zap },
            { name: 'Interior', icon: Sofa },
            { name: 'Exterior', icon: Car },
            { name: 'Lighting', icon: Lamp },
            { name: 'Navigation', icon: Map },
            { name: 'Towing', icon: Truck },
            { name: 'RV & Camping', icon: Home },
            { name: 'Vintage & Classic', icon: Clock }
        ]
    },
    {
        id: 'toys-games',
        name: 'Toys & Games',
        icon: Gamepad2,
        color: 'from-pink-400 to-purple-500',
        bgColor: 'bg-gradient-to-br from-pink-50 to-purple-50',
        description: 'Fun for all ages',
        featured: false,
        subcategories: [
            { name: 'Board Games', icon: Gamepad2 },
            { name: 'Video Games', icon: Gamepad },
            { name: 'Puzzles', icon: Puzzle },
            { name: 'Building Sets', icon: Blocks },
            { name: 'Action Figures', icon: Users },
            { name: 'Dolls & Accessories', icon: Baby },
            { name: 'Educational Toys', icon: GraduationCap },
            { name: 'Arts & Crafts', icon: Palette },
            { name: 'Outdoor Toys', icon: Bike },
            { name: 'Collectibles', icon: Diamond },
            { name: 'Model Kits', icon: Wrench },
            { name: 'RC Vehicles', icon: Car },
            { name: 'Magic & Science', icon: Sparkles },
            { name: 'Musical Instruments', icon: Music },
            { name: 'Party Supplies', icon: Gift },
            { name: 'Seasonal Toys', icon: Snowflake },
            { name: 'Baby Toys', icon: Baby },
            { name: 'Pet Toys', icon: PawPrint }
        ]
    },
    {
        id: 'food-beverages',
        name: 'Food & Beverages',
        icon: Coffee,
        color: 'from-orange-400 to-red-500',
        bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
        description: 'Delicious treats & drinks',
        featured: false,
        subcategories: [
            { name: 'Coffee & Tea', icon: Coffee },
            { name: 'Wine & Spirits', icon: Wine },
            { name: 'Beer & Cider', icon: Beer },
            { name: 'Snacks & Treats', icon: Cake },
            { name: 'Organic & Natural', icon: Leaf },
            { name: 'International Foods', icon: Globe },
            { name: 'Baking Supplies', icon: ChefHat },
            { name: 'Cooking Oils', icon: Droplets },
            { name: 'Spices & Seasonings', icon: Package },
            { name: 'Canned Goods', icon: Package },
            { name: 'Frozen Foods', icon: Snowflake },
            { name: 'Dairy & Eggs', icon: Milk },
            { name: 'Meat & Seafood', icon: Beef },
            { name: 'Fruits & Vegetables', icon: Apple },
            { name: 'Grains & Pasta', icon: Wheat },
            { name: 'Nuts & Seeds', icon: Leaf },
            { name: 'Supplements', icon: Pill },
            { name: 'Gourmet & Specialty', icon: Star }
        ]
    },
    {
        id: 'business-industrial',
        name: 'Business & Industrial',
        icon: Building,
        color: 'from-blue-600 to-indigo-700',
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        description: 'Professional equipment & supplies',
        featured: false,
        subcategories: [
            { name: 'Office Supplies', icon: PenTool },
            { name: 'Industrial Equipment', icon: Factory },
            { name: 'Medical Equipment', icon: Stethoscope },
            { name: 'Construction', icon: Hammer },
            { name: 'Agriculture', icon: Leaf },
            { name: 'Manufacturing', icon: Settings },
            { name: 'Safety Equipment', icon: Shield },
            { name: 'Tools & Machinery', icon: Wrench },
            { name: 'Electronics Components', icon: Code },
            { name: 'Packaging & Shipping', icon: Package },
            { name: 'Retail & Display', icon: Store },
            { name: 'Restaurant & Food Service', icon: ChefHat },
            { name: 'Beauty & Salon', icon: Scissors },
            { name: 'Fitness & Gym', icon: Dumbbell },
            { name: 'Automotive Service', icon: Car },
            { name: 'Printing & Publishing', icon: Printer },
            { name: 'Photography & Video', icon: Camera },
            { name: 'Music & Audio', icon: Music }
        ]
    },
    {
        id: 'books-media',
        name: 'Books & Media',
        icon: BookOpen,
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
        description: 'Books, movies & digital content',
        featured: false,
        subcategories: [
            { name: 'Fiction & Literature', icon: BookOpen },
            { name: 'Non-Fiction', icon: BookOpen },
            { name: 'Textbooks & Education', icon: GraduationCap },
            { name: 'Children\'s Books', icon: Baby },
            { name: 'Comics & Graphic Novels', icon: BookOpen },
            { name: 'Magazines & Newspapers', icon: Newspaper },
            { name: 'Movies & TV Shows', icon: Tv },
            { name: 'Music & Audio Books', icon: Music },
            { name: 'Video Games', icon: Gamepad },
            { name: 'Software & Apps', icon: Code },
            { name: 'Art & Photography', icon: Camera },
            { name: 'Religious & Spiritual', icon: Star },
            { name: 'Self-Help & Development', icon: Brain },
            { name: 'Business & Finance', icon: TrendingUp },
            { name: 'Health & Fitness', icon: Heart },
            { name: 'Cooking & Food', icon: ChefHat },
            { name: 'Travel & Geography', icon: Map },
            { name: 'History & Biography', icon: Clock }
        ]
    },
    {
        id: 'health-fitness',
        name: 'Health & Fitness',
        icon: Heart,
        color: 'from-red-500 to-pink-600',
        bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
        description: 'Wellness & fitness equipment',
        featured: false,
        subcategories: [
            { name: 'Fitness Equipment', icon: Dumbbell },
            { name: 'Sports & Recreation', icon: Trophy },
            { name: 'Yoga & Meditation', icon: Heart },
            { name: 'Supplements & Nutrition', icon: Pill },
            { name: 'Medical Supplies', icon: Stethoscope },
            { name: 'Personal Care', icon: Sparkles },
            { name: 'Massage & Therapy', icon: Heart },
            { name: 'First Aid & Safety', icon: Shield },
            { name: 'Monitoring Devices', icon: Watch },
            { name: 'Respiratory Care', icon: Wind },
            { name: 'Mobility Aids', icon: Users },
            { name: 'Sleep & Comfort', icon: Home },
            { name: 'Mental Health', icon: Brain },
            { name: 'Senior Care', icon: Users },
            { name: 'Baby & Child Health', icon: Baby },
            { name: 'Pet Health', icon: PawPrint },
            { name: 'Alternative Medicine', icon: Leaf },
            { name: 'Emergency Preparedness', icon: Shield }
        ]
    },
    {
        id: 'jewelry-watches',
        name: 'Jewelry & Watches',
        icon: Diamond,
        color: 'from-yellow-500 to-amber-600',
        bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        description: 'Luxury jewelry & timepieces',
        featured: false,
        subcategories: [
            { name: 'Rings', icon: Diamond },
            { name: 'Necklaces & Pendants', icon: Diamond },
            { name: 'Earrings', icon: Diamond },
            { name: 'Bracelets & Bangles', icon: Diamond },
            { name: 'Watches', icon: Watch },
            { name: 'Brooches & Pins', icon: Diamond },
            { name: 'Anklets', icon: Diamond },
            { name: 'Body Jewelry', icon: Diamond },
            { name: 'Men\'s Jewelry', icon: Diamond },
            { name: 'Wedding & Engagement', icon: Heart },
            { name: 'Vintage & Antique', icon: Clock },
            { name: 'Religious & Spiritual', icon: Star },
            { name: 'Fashion Jewelry', icon: Sparkles },
            { name: 'Fine Jewelry', icon: Diamond },
            { name: 'Luxury Watches', icon: Watch },
            { name: 'Smart Watches', icon: Watch },
            { name: 'Jewelry Boxes & Storage', icon: Package },
            { name: 'Jewelry Care & Cleaning', icon: Sparkles }
        ]
    },
    {
        id: 'musical-instruments',
        name: 'Musical Instruments',
        icon: Music,
        color: 'from-purple-500 to-indigo-600',
        bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50',
        description: 'Instruments & audio equipment',
        featured: false,
        subcategories: [
            { name: 'Guitars & Basses', icon: Music },
            { name: 'Pianos & Keyboards', icon: Music },
            { name: 'Drums & Percussion', icon: Music },
            { name: 'Wind Instruments', icon: Music },
            { name: 'String Instruments', icon: Music },
            { name: 'Brass Instruments', icon: Music },
            { name: 'Electronic Instruments', icon: Music },
            { name: 'Accessories & Parts', icon: Package },
            { name: 'Audio Equipment', icon: Speaker },
            { name: 'Recording Equipment', icon: Microscope },
            { name: 'Live Sound', icon: Volume2 },
            { name: 'DJ Equipment', icon: Music },
            { name: 'Sheet Music & Books', icon: BookOpen },
            { name: 'Cases & Bags', icon: Package },
            { name: 'Cables & Connectors', icon: Wifi },
            { name: 'Software & Apps', icon: Code },
            { name: 'Vintage & Collectibles', icon: Clock },
            { name: 'Educational Instruments', icon: GraduationCap }
        ]
    },
    {
        id: 'office-supplies',
        name: 'Office & School Supplies',
        icon: PenTool,
        color: 'from-gray-500 to-slate-600',
        bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
        description: 'Everything for work & study',
        featured: false,
        subcategories: [
            { name: 'Writing Instruments', icon: PenTool },
            { name: 'Paper & Notebooks', icon: BookOpen },
            { name: 'Folders & Binders', icon: Package },
            { name: 'Desk Accessories', icon: Monitor },
            { name: 'Storage & Organization', icon: Package },
            { name: 'Presentation Supplies', icon: Tv },
            { name: 'Calculators & Electronics', icon: Calculator },
            { name: 'Art & Craft Supplies', icon: Palette },
            { name: 'School Supplies', icon: GraduationCap },
            { name: 'Office Furniture', icon: Sofa },
            { name: 'Cleaning Supplies', icon: Sparkles },
            { name: 'Safety & Security', icon: Shield },
            { name: 'Shipping & Mailing', icon: Truck },
            { name: 'Labels & Stickers', icon: PenTool },
            { name: 'Calendars & Planners', icon: Clock },
            { name: 'Whiteboards & Bulletin Boards', icon: Monitor },
            { name: 'Computer Accessories', icon: Laptop },
            { name: 'Printing Supplies', icon: Printer }
        ]
    },
    {
        id: 'pet-supplies',
        name: 'Pet Supplies',
        icon: PawPrint,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
        description: 'Everything for your pets',
        featured: false,
        subcategories: [
            { name: 'Dog Supplies', icon: PawPrint },
            { name: 'Cat Supplies', icon: PawPrint },
            { name: 'Fish & Aquarium', icon: PawPrint },
            { name: 'Bird Supplies', icon: PawPrint },
            { name: 'Small Animal Supplies', icon: PawPrint },
            { name: 'Reptile Supplies', icon: PawPrint },
            { name: 'Pet Food & Treats', icon: Apple },
            { name: 'Pet Toys', icon: PawPrint },
            { name: 'Pet Grooming', icon: Scissors },
            { name: 'Pet Health & Medicine', icon: Stethoscope },
            { name: 'Pet Beds & Furniture', icon: Home },
            { name: 'Pet Carriers & Travel', icon: Truck },
            { name: 'Pet Training', icon: GraduationCap },
            { name: 'Pet Safety', icon: Shield },
            { name: 'Pet Clothing & Accessories', icon: Shirt },
            { name: 'Pet Cleaning Supplies', icon: Sparkles },
            { name: 'Pet Memorial & Urns', icon: Heart },
            { name: 'Pet Books & Media', icon: BookOpen }
        ]
    },
    {
        id: 'travel-luggage',
        name: 'Travel & Luggage',
        icon: Map,
        color: 'from-cyan-500 to-blue-600',
        bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
        description: 'Travel gear & accessories',
        featured: false,
        subcategories: [
            { name: 'Luggage & Suitcases', icon: Package },
            { name: 'Travel Bags', icon: Package },
            { name: 'Backpacks', icon: Package },
            { name: 'Travel Accessories', icon: Package },
            { name: 'Travel Electronics', icon: Smartphone },
            { name: 'Travel Clothing', icon: Shirt },
            { name: 'Travel Health & Safety', icon: Shield },
            { name: 'Travel Books & Guides', icon: BookOpen },
            { name: 'Camping & Outdoor', icon: Mountain },
            { name: 'Car Travel', icon: Car },
            { name: 'Air Travel', icon: Globe },
            { name: 'Business Travel', icon: Building },
            { name: 'Family Travel', icon: Users },
            { name: 'Adventure Travel', icon: Mountain },
            { name: 'Travel Photography', icon: Camera },
            { name: 'Travel Insurance', icon: Shield },
            { name: 'Travel Planning', icon: Map },
            { name: 'Travel Souvenirs', icon: Gift }
        ]
    },
    {
        id: 'collectibles-art',
        name: 'Collectibles & Art',
        icon: Palette,
        color: 'from-indigo-500 to-purple-600',
        bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
        description: 'Art, antiques & collectibles',
        featured: false,
        subcategories: [
            { name: 'Fine Art & Paintings', icon: Palette },
            { name: 'Sculptures & Statues', icon: Palette },
            { name: 'Antiques & Vintage', icon: Clock },
            { name: 'Coins & Currency', icon: Circle },
            { name: 'Stamps & Philately', icon: PenTool },
            { name: 'Sports Memorabilia', icon: Trophy },
            { name: 'Movie & TV Memorabilia', icon: Tv },
            { name: 'Music Memorabilia', icon: Music },
            { name: 'Comic Books & Trading Cards', icon: BookOpen },
            { name: 'Action Figures & Toys', icon: Users },
            { name: 'Jewelry & Watches', icon: Diamond },
            { name: 'Books & Manuscripts', icon: BookOpen },
            { name: 'Military & War', icon: Shield },
            { name: 'Religious & Spiritual', icon: Star },
            { name: 'Ethnic & Cultural', icon: Globe },
            { name: 'Scientific & Medical', icon: Microscope },
            { name: 'Decorative Arts', icon: Home },
            { name: 'Folk Art & Crafts', icon: Palette }
        ]
    }
];
export default function CategoriesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState(defaultCategories);
    const [loading, setLoading] = useState(true);
    // Load categories from Firebase
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const mod = await import('@/lib/services/categoryService');
                const firebaseCategories = (mod === null || mod === void 0 ? void 0 : mod.getCategories) ? await mod.getCategories() : [];
                // Merge Firebase data with default structure
                const mergedCategories = defaultCategories.map(defaultCat => {
                    const firebaseCat = firebaseCategories.find((fc) => fc.slug === defaultCat.id);
                    return Object.assign(Object.assign({}, defaultCat), { count: firebaseCat ? `${firebaseCat.productCount}+` : '0', realProductCount: (firebaseCat === null || firebaseCat === void 0 ? void 0 : firebaseCat.productCount) || 0 });
                });
                setCategories(mergedCategories);
            }
            catch (error) {
                console.error('Failed to load categories:', error);
                // Keep default categories if Firebase fails
                setCategories(defaultCategories.map(cat => (Object.assign(Object.assign({}, cat), { count: '0', realProductCount: 0 }))));
            }
            finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, []);
    const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return (<div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-white/20">
                <ShoppingBag className="w-6 h-6 text-gray-900 dark:text-white"/>
              </div>
              <h1 className="text-2xl font-bold mb-3">
                Categories
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-xs mx-auto font-light">
                Discover curated collections
              </p>
              
              {/* Premium Search Bar */}
              <div className="max-w-sm mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-purple-300 w-4 h-4"/>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories..." className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-200"/>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured Premium Categories */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">Featured Categories</h2>
          <p className="text-sm text-gray-600 dark:text-purple-200">Handpicked collections</p>
        </div>

        {loading ? (
        // Enhanced loading skeleton with interactive feedback
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, index) => (<div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 h-full animate-pulse cursor-pointer hover:bg-white/10 hover:border-purple-400/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                  <div className="text-right">
                    <div className="h-5 w-10 bg-gray-600 rounded mb-1"></div>
                    <div className="h-2 w-6 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-600 rounded mb-2"></div>
                <div className="h-2 bg-gray-600 rounded mb-3"></div>
                <div className="space-y-1">
                  {[...Array(3)].map((_, i) => (<div key={i} className="h-2 bg-gray-600 rounded"></div>))}
                </div>
              </div>))}
          </div>) : (
        // Main category grid - 2 columns on mobile, 3 columns on desktop
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCategories.map((category, index) => (<motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} className="group cursor-pointer">
              <Link href={`/categories/${category.id}`}>
                {/* Enhanced card with clear interactive feedback */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-3 h-full transition-all duration-300 
                  group-hover:bg-white dark:group-hover:bg-white/10 
                  group-hover:border-purple-400/30 
                  group-hover:shadow-xl group-hover:shadow-purple-500/10
                  active:scale-[0.98] active:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow`}>
                    <category.icon className="w-5 h-5 text-white"/>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{category.count}</span>
                    <p className="text-xs text-gray-600 dark:text-purple-200">products</p>
                  </div>
                </div>
                
                <h3 className="text-base font-bold mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{category.name}</h3>
                <p className="text-xs text-gray-600 dark:text-purple-200 mb-3 line-clamp-2">{category.description}</p>
                
                {category.featured && (<span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-medium mb-3 shadow">
                    ✨
                  </span>)}

                {/* Subcategories Preview */}
                <div className="space-y-1 mb-3">
                  {category.subcategories.slice(0, 3).map((sub, subIndex) => (<div key={subIndex} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-white/5 rounded px-2 py-1">
                      <span className="text-gray-700 dark:text-purple-100 truncate">{sub.name}</span>
                      <span className="text-gray-500 dark:text-purple-300 font-medium">✓</span>
                    </div>))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-purple-300 font-medium group-hover:text-purple-600 dark:group-hover:text-white transition-colors text-xs flex items-center">
                    Explore
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"/>
                  </span>
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChevronRight className="w-2.5 h-2.5 text-white"/>
                  </div>
                </div>
                </div>
              </Link>
            </motion.div>))}
        </div>)}

        {/* Premium Stats */}
        <div className="mt-8 bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">Why Choose Us?</h2>
            <p className="text-sm text-gray-600 dark:text-purple-200">Experience the difference</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow">
                <Package className="w-5 h-5 text-white"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">150K+ Products</h3>
              <p className="text-xs text-purple-200">Curated selection</p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow">
                <Truck className="w-5 h-5 text-white"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Fast Shipping</h3>
              <p className="text-xs text-purple-200">Express delivery</p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow">
                <Shield className="w-5 h-5 text-white"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Secure & Protected</h3>
              <p className="text-xs text-purple-200">Bank-level security</p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow">
                <Star className="w-5 h-5 text-white"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">5-Star Experience</h3>
              <p className="text-xs text-purple-200">Trusted by millions</p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
