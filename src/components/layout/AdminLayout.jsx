'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Users, Package, ShoppingCart, Shield, Settings, BarChart3, Globe, CreditCard, Search, ChevronDown, Moon, Bell, Home, FileText, Star, LogOut, Menu, X as CloseIcon, User, HelpCircle } from 'lucide-react';
const sidebarItems = [
    {
        id: 'overview',
        label: 'Overview',
        icon: Home,
        href: '/admin',
        description: 'Dashboard overview and analytics'
    },
    {
        id: 'users',
        label: 'User Management',
        icon: Users,
        href: '/admin/users',
        description: 'Manage users and permissions'
    },
    {
        id: 'applications',
        label: 'Applications',
        icon: Shield,
        href: '/admin/applications',
        description: 'Review seller applications'
    },
    {
        id: 'products',
        label: 'Product Management',
        icon: Package,
        href: '/admin/products',
        description: 'Manage product listings'
    },
    {
        id: 'orders',
        label: 'Orders & Payments',
        icon: ShoppingCart,
        href: '/admin/orders',
        description: 'Track orders and payments'
    },
    {
        id: 'payments',
        label: 'Payouts',
        icon: CreditCard,
        href: '/admin/payments',
        description: 'Manage seller payouts'
    },
    {
        id: 'reviews',
        label: 'Reviews & Reports',
        icon: Star,
        href: '/admin/reviews',
        description: 'Moderate reviews and reports'
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
        description: 'Advanced analytics and insights'
    },
    {
        id: 'fees',
        label: 'Country Fees',
        icon: Globe,
        href: '/admin/fees',
        description: 'Manage regional fees'
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/admin/notifications',
        description: 'Send global notifications'
    },
    {
        id: 'audit',
        label: 'Audit Log',
        icon: FileText,
        href: '/admin/audit',
        description: 'System activity logs'
    },
    {
        id: 'settings',
        label: 'System Settings',
        icon: Settings,
        href: '/admin/settings',
        description: 'Platform configuration'
    }
];
export default function AdminLayout({ children, title, subtitle = "Manage your platform", searchPlaceholder = "Search...", onSearch, actions }) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New seller application', time: '2m ago', unread: true },
        { id: 2, title: 'Payment processed', time: '5m ago', unread: true },
        { id: 3, title: 'System update completed', time: '1h ago', unread: false }
    ]);
    // Force dark mode for admin panel - override global theme provider
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        // Also store dark theme in localStorage to prevent conflicts
        localStorage.setItem('theme', 'dark');
        // Clean up light theme classes if they exist
        document.documentElement.classList.remove('light');
        // Create an observer to maintain dark mode if other components try to change it
        const observer = new MutationObserver(() => {
            if (!document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.add('dark');
            }
            if (document.documentElement.classList.contains('light')) {
                document.documentElement.classList.remove('light');
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        return () => observer.disconnect();
    }, []);
    // Close sidebar on mobile when navigating to different pages
    useEffect(() => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [pathname]);
    // Handle window resize to ensure proper sidebar behavior
    useEffect(() => {
        const handleResize = () => {
            // If screen becomes desktop size, close mobile sidebar
            if (window.innerWidth >= 1024 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isSidebarOpen) {
                    setIsSidebarOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch === null || onSearch === void 0 ? void 0 : onSearch(query);
    };
    const markNotificationAsRead = (id) => {
        setNotifications(prev => prev.map(notif => notif.id === id ? Object.assign(Object.assign({}, notif), { unread: false }) : notif));
    };
    const unreadCount = notifications.filter(n => n.unread).length;
    return (<div className="min-h-screen transition-colors duration-300 dark bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}/>)}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col h-full bg-white/10 backdrop-blur-xl border-r border-white/20">
          {/* Logo */}
          <div className="p-4 lg:p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg lg:text-xl">G</span>
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-white">Zaillisy Admin</h1>
                  <p className="text-xs text-purple-200">Premium Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 lg:space-x-2">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl transition-all duration-300 lg:hidden hover:scale-110 hover:bg-red-500/20 text-red-400 border border-red-500/30" title="Close sidebar">
                  <CloseIcon className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
            <ul className="space-y-1 lg:space-y-2">
                             {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (<li key={item.id}>
                    <a href={item.href} onClick={() => {
                    // Close sidebar on mobile when navigation link is clicked
                    if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                    }
                }} className={`group relative w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${isActive
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}>
                      <Icon className={`w-4 h-4 lg:w-5 lg:h-5 transition-colors ${isActive ? 'text-white' : 'group-hover:text-purple-400'}`}/>
                      <span className="ml-2 lg:ml-3 font-medium text-sm lg:text-base">{item.label}</span>
                    </a>
                  </li>);
        })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 lg:p-4 border-t border-white/20">
            <div className="flex items-center justify-center">
              <div className="flex items-center px-3 py-2 rounded-xl bg-white/5 text-purple-200">
                <Moon className="w-4 h-4"/>
                <span className="ml-3 font-medium text-sm">Dark Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 lg:ml-64`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Top Row - Mobile Menu & Title */}
              <div className="flex items-center justify-between lg:justify-start lg:space-x-4">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl transition-all duration-300 lg:hidden hover:scale-105 hover:bg-white/10 text-white">
                  <Menu className="w-5 h-5"/>
                </button>
                
                <div className="flex-1 lg:flex-none">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{title}</h2>
                  <p className="text-xs sm:text-sm text-purple-200">{subtitle}</p>
                </div>

                {/* Mobile Search Toggle */}
                {onSearch && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSearchQuery('')} className="p-2 rounded-xl transition-all duration-300 md:hidden hover:bg-white/10 text-white">
                    <Search className="w-5 h-5"/>
                  </motion.button>)}
              </div>
              
              {/* Bottom Row - Search & Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search Bar */}
                {onSearch && (<div className="relative flex-1 sm:flex-none sm:w-64 lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300"/>
                    <input type="text" placeholder={searchPlaceholder} value={searchQuery} onChange={handleSearch} className="w-full pl-10 pr-4 py-2 rounded-xl transition-all duration-300 bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent"/>
                  </div>)}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end space-x-2">


                  {/* Notifications */}
                  <div className="relative">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-xl transition-all duration-300 relative hover:bg-white/10 text-white">
                      <Bell className="w-5 h-5"/>
                      {unreadCount > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>)}
                    </motion.button>
                  </div>

                  {/* Profile Menu */}
                  <div className="relative">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-2 p-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-white">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white"/>
                      </div>
                      <span className="hidden sm:block font-medium">Admin</span>
                      <ChevronDown className="w-4 h-4"/>
                    </motion.button>
                    
                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {showProfileMenu && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 bg-white/10 backdrop-blur-xl border border-white/20">
                          <div className="p-4">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white"/>
                              </div>
                              <div>
                                <p className="font-bold text-white">Admin User</p>
                                <p className="text-sm text-purple-200">admin@goryl.com</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <a href="/admin/profile" className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 text-white">
                                <User className="w-4 h-4"/>
                                <span>Profile</span>
                              </a>
                              <a href="/admin/settings" className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 text-white">
                                <Settings className="w-4 h-4"/>
                                <span>Settings</span>
                              </a>
                              <a href="/admin/help" className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 text-white">
                                <HelpCircle className="w-4 h-4"/>
                                <span>Help</span>
                              </a>
                              <div className="border-t border-white/20 my-2"></div>
                              <button className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 w-full text-left hover:bg-red-500/20 text-red-400">
                                <LogOut className="w-4 h-4"/>
                                <span>Sign Out</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>)}
                    </AnimatePresence>
                  </div>

                  {/* Page Actions */}
                  {actions && (<div className="flex items-center space-x-2">
                      {actions}
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>);
}
