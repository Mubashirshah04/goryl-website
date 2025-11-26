'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Globe,
  DollarSign,
  FileText,
  Flag,
  UserCheck,
  Moon,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStoreCognito'
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from '@/lib/firestore'
import { toast } from 'sonner'
import AdminRouteGuard from '@/components/AdminRouteGuard'

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  actions?: React.ReactNode
}

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
    id: 'conversions',
    label: 'Account Conversions',
    icon: UserCheck,
    href: '/admin/account-conversions',
    description: 'Review account conversion requests'
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
    id: 'finance',
    label: 'Finance & Accounts',
    icon: DollarSign,
    href: '/admin/finance',
    description: 'Platform earnings and seller payments'
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
    id: 'reports',
    label: 'Reports',
    icon: Flag,
    href: '/admin/reports',
    description: 'Manage content reports and moderation'
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
    description: 'Platform configuration'
  }
]

export default function AdminLayout({
  children,
  title,
  subtitle = "Manage your platform",
  searchPlaceholder = "Search...",
  onSearch,
  actions
}: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userData, signOut: logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile sidebar state
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message?: string
    type?: string
    unread: boolean
    createdAt?: any
    time?: string
    data?: any
  }>>([])

  // Force dark mode for admin panel - override global theme provider
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')

    // Also store dark theme in localStorage to prevent conflicts
    localStorage.setItem('theme', 'dark')

    // Clean up light theme classes if they exist
    document.documentElement.classList.remove('light')

    // Create an observer to maintain dark mode if other components try to change it
    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark')
      }
      if (document.documentElement.classList.contains('light')) {
        document.documentElement.classList.remove('light')
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Close sidebar on mobile when navigating to different pages
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [pathname])

  // Handle window resize to ensure proper sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // If screen becomes desktop size, close mobile sidebar
      if (window.innerWidth >= 1024 && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) {
          setIsSidebarOpen(false)
        }
        if (showNotifications) {
          setShowNotifications(false)
        }
        if (showProfileMenu) {
          setShowProfileMenu(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen, showNotifications, showProfileMenu])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('[data-notifications-dropdown]')) {
        setShowNotifications(false)
      }
      if (showProfileMenu && !target.closest('[data-profile-menu]')) {
        setShowProfileMenu(false)
      }
    }

    if (showNotifications || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications, showProfileMenu])

  // Subscribe to admin notifications
  useEffect(() => {
    if (!user?.sub) return

    let unsubscribeNotifications: (() => void) | null = null

    try {
      // TODO: Implement AWS-based notifications subscription
      console.log('⚠️ Admin notifications: AWS implementation pending')
      // Subscribe to admin-specific notifications
      // const notificationsQuery = query(
      //   collection(db, 'notifications'),
      //   where('userId', '==', user.sub),
      //   orderBy('createdAt', 'desc')
      // )

      // unsubscribeNotifications = onSnapshot(
      //   notificationsQuery,
      //   (snapshot: any) => {
      //     const adminNotifications = snapshot.docs
      //       .map((doc: any) => {
      //         const data = doc.data()
      //         const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      //         // ... notification mapping logic
      //       })
      //       .slice(0, 20)
      //     setNotifications(adminNotifications)
      //   },
      //   (error: any) => {
      //     console.error('Error fetching admin notifications:', error)
      //   }
      // )
    } catch (error) {
      console.error('Error setting up notifications query:', error)
    }

    // TODO: Implement AWS-based reports subscription
    console.log('⚠️ Admin reports: AWS implementation pending')
    // Also listen to reports collection for pending reports
    // const reportsQuery = query(
    //   collection(db, 'reports'),
    //   where('status', '==', 'pending'),
    //   orderBy('createdAt', 'desc')
    // )

    // const unsubscribeReports = onSnapshot(reportsQuery, (snapshot: any) => {
    //   const pendingReportsCount = snapshot.docs.length
    //   if (pendingReportsCount > 0) {
    //     // Add system notification for pending reports
    //     setNotifications(prev => {
    //       // ... notification logic
    //     })
    //   }
    // }, (error: any) => {
    //   console.error('Error fetching pending reports:', error)
    // })

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications()
      }
      // unsubscribeReports()
    }
  }, [user?.sub])

  // Debounced search handler
  const debouncedOnSearch = useMemo(
    () => onSearch ? debounce(onSearch, 300) : null,
    [onSearch]
  )

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (debouncedOnSearch) {
      debouncedOnSearch(query)
    }
  }, [debouncedOnSearch])



  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update in Firestore if it's a real notification
      if (notificationId !== 'pending_reports') {
        await updateDoc(doc(db, 'notifications', notificationId), {
          read: true,
          updatedAt: new Date()
        })
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Still update local state even if Firestore update fails
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        )
      )
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.unread && n.id !== 'pending_reports')

      // Update all unread notifications in Firestore
      await Promise.all(
        unreadNotifications.map(notif =>
          updateDoc(doc(db, 'notifications', notif.id), {
            read: true,
            updatedAt: new Date()
          })
        )
      )

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all as read')
    }
  }, [notifications])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <AdminRouteGuard>
      <div className="min-h-screen transition-colors duration-300 dark bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 -right-4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-2xl border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
            {/* Logo */}
            <div className="p-4 lg:p-6 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-2 lg:space-x-3"
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50 animate-pulse">
                    <span className="text-white font-bold text-lg lg:text-xl">G</span>
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent">Goryl Admin</h1>
                    <p className="text-xs font-semibold text-cyan-300">Premium Dashboard 🚀</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 lg:space-x-2">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-xl transition-all duration-300 lg:hidden hover:scale-110 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                    title="Close sidebar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
              <ul className="space-y-1 lg:space-y-2">
                {sidebarItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li
                      key={item.id}
                    >
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={() => {
                          // Close sidebar on mobile when navigation link is clicked
                          if (window.innerWidth < 1024) {
                            setIsSidebarOpen(false)
                          }
                        }}
                        className={`group relative w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${isActive
                          ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 text-white shadow-2xl shadow-cyan-500/50 border border-cyan-400/50'
                          : 'text-cyan-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-indigo-500/20 hover:text-white hover:border hover:border-cyan-500/30'
                          }`}
                      >
                        <Icon className={`w-4 h-4 lg:w-5 lg:h-5 transition-colors ${isActive ? 'text-white' : 'group-hover:text-cyan-400'
                          }`} />
                        <span className="ml-2 lg:ml-3 font-medium text-sm lg:text-base">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 lg:p-4 border-t border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10">
              <div className="flex items-center justify-center">
                <div className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-200 border border-cyan-500/20">
                  <Moon className="w-4 h-4" />
                  <span className="ml-3 font-medium text-sm">Dark Mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`transition-all duration-300 lg:ml-64`}>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-2xl border-b border-cyan-500/30 shadow-xl shadow-cyan-500/10">
            <div className="px-4 lg:px-6 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Top Row - Mobile Menu & Title */}
                <div className="flex items-center justify-between lg:justify-start lg:space-x-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-xl transition-all duration-300 lg:hidden hover:scale-105 hover:bg-white/10 text-white"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  <div className="flex-1 lg:flex-none">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent">{title}</h2>
                    <p className="text-xs sm:text-sm font-medium text-cyan-300">{subtitle}</p>
                  </div>

                  {/* Mobile Search Toggle */}
                  {onSearch && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchQuery('')}
                      className="p-2 rounded-xl transition-all duration-300 md:hidden hover:bg-white/10 text-white"
                    >
                      <Search className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {/* Bottom Row - Search & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Search Bar */}
                  {onSearch && (
                    <div className="relative flex-1 sm:flex-none sm:w-64 lg:w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 text-white placeholder-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/30"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end space-x-2">


                    {/* Notifications */}
                    <div className="relative" data-notifications-dropdown>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2.5 rounded-xl transition-all duration-300 relative hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 text-white hover:shadow-lg hover:shadow-cyan-500/30 border border-transparent hover:border-cyan-500/30"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </motion.button>

                      {/* Notification Dropdown */}
                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl shadow-cyan-500/20 z-50 bg-gradient-to-b from-slate-900/98 via-blue-900/95 to-indigo-900/95 backdrop-blur-2xl border border-cyan-500/30 max-h-96 overflow-hidden flex flex-col"
                          >
                            <div className="p-4 border-b border-white/20 flex items-center justify-between">
                              <h3 className="font-bold text-white">Notifications</h3>
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                  Mark all as read
                                </button>
                              )}
                            </div>

                            <div className="overflow-y-auto flex-1">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                  <Bell className="w-12 h-12 text-purple-300 mx-auto mb-3 opacity-50" />
                                  <p className="text-purple-200 text-sm">No notifications</p>
                                </div>
                              ) : (
                                notifications.map((notification) => (
                                  <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={async () => {
                                      if (notification.unread) {
                                        await markNotificationAsRead(notification.id)
                                      }
                                      if (notification.type === 'pending_reports') {
                                        router.push('/admin/reports')
                                        setShowNotifications(false)
                                      }
                                    }}
                                    className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-300 ${notification.unread
                                      ? 'bg-white/5 hover:bg-white/10'
                                      : 'hover:bg-white/5'
                                      }`}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.unread ? 'bg-red-500' : 'bg-transparent'
                                        }`} />
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${notification.unread ? 'text-white' : 'text-purple-200'
                                          }`}>
                                          {notification.title}
                                        </p>
                                        {notification.message && (
                                          <p className="text-xs text-purple-300 mt-1 line-clamp-2">
                                            {notification.message}
                                          </p>
                                        )}
                                        <p className="text-xs text-purple-400 mt-1">
                                          {notification.time || 'Recently'}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                            </div>

                            {notifications.length > 0 && (
                              <div className="p-3 border-t border-white/20">
                                <Link
                                  href="/admin/notifications"
                                  onClick={() => setShowNotifications(false)}
                                  className="block text-center text-sm text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                  View All Notifications
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative" data-profile-menu>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center space-x-2 p-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="hidden sm:block font-medium">Admin</span>
                        <ChevronDown className="w-4 h-4" />
                      </motion.button>

                      {/* Profile Dropdown */}
                      <AnimatePresence>
                        {showProfileMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl shadow-cyan-500/20 z-50 bg-gradient-to-b from-slate-900/98 via-blue-900/95 to-indigo-900/95 backdrop-blur-2xl border border-cyan-500/30"
                          >
                            <div className="p-4">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-white">{userData?.name || user?.name || 'Admin User'}</p>
                                  <p className="text-sm text-purple-200">{user?.email || userData?.email || 'No email'}</p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <button
                                  onClick={async () => {
                                    try {
                                      setShowProfileMenu(false)
                                      await logout()
                                      toast.success('Signed out successfully')
                                      router.push('/')
                                    } catch (error) {
                                      console.error('Sign out error:', error)
                                      toast.error('Failed to sign out')
                                    }
                                  }}
                                  className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 w-full text-left hover:bg-red-500/20 text-red-400"
                                >
                                  <LogOut className="w-4 h-4" />
                                  <span>Sign Out</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Page Actions */}
                    {actions && (
                      <div className="flex items-center space-x-2">
                        {actions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-3 sm:p-4 lg:p-6 relative">
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  )
}

