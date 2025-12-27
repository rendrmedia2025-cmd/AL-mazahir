'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authClient, type AuthSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: string
  requiredRole?: 'admin' | 'manager'
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: '🏠' },
  { name: 'Availability', href: '/admin/availability', icon: '📦' },
  { name: 'Leads', href: '/admin/leads', icon: '👥' },
  { name: 'Content', href: '/admin/content', icon: '✏️' },
  { name: 'Monitoring', href: '/admin/monitoring', icon: '📊', requiredRole: 'admin' },
  { name: 'Feature Flags', href: '/admin/feature-flags', icon: '🚩', requiredRole: 'admin' },
  { name: 'Users', href: '/admin/users', icon: '🔐', requiredRole: 'admin' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check initial session
    authClient.getAuthSession().then((session) => {
      setSession(session)
      setIsLoading(false)
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = authClient.onAuthStateChange((session) => {
      setSession(session)
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      } else if (session && pathname === '/admin/login') {
        router.push('/admin')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const canAccessNavItem = (item: NavigationItem): boolean => {
    if (!item.requiredRole) return true
    if (!session) return false
    
    if (item.requiredRole === 'admin') {
      return session.adminProfile.role === 'admin'
    }
    
    return session.adminProfile.role === 'admin' || session.adminProfile.role === 'manager'
  }

  const isActiveRoute = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!session && pathname !== '/admin/login') {
    return null // Will redirect via useEffect
  }

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Show admin layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <div className="text-2xl mr-3">🏢</div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Al Mazahir Admin
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Enterprise Management Panel
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <div className="font-medium">
                  {session?.adminProfile.full_name || session?.user.email}
                </div>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session?.adminProfile.role}
                  </span>
                  {session?.adminProfile.last_login && (
                    <span className="ml-2 text-xs text-gray-500">
                      Last login: {new Date(session.adminProfile.last_login).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>

            {/* Mobile menu button - Enhanced accessibility */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 touch-target"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              >
                <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
                {isMobileMenuOpen ? (
                  <span className="text-xl" aria-hidden="true">✕</span>
                ) : (
                  <span className="text-xl" aria-hidden="true">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - Enhanced accessibility */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden border-t border-gray-200 bg-white"
            id="mobile-menu"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {session?.adminProfile.full_name || session?.user.email}
                </div>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session?.adminProfile.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2">
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full touch-target"
                aria-label="Sign out of admin panel"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Admin Navigation - Enhanced accessibility */}
      <nav 
        className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-40"
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8" role="menubar">
            {navigationItems
              .filter(canAccessNavItem)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 ${
                    isActiveRoute(item.href)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  role="menuitem"
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto py-2 space-x-4" role="menubar" aria-label="Mobile admin navigation">
              {navigationItems
                .filter(canAccessNavItem)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex-shrink-0 py-2 px-3 rounded-md text-sm font-medium flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 touch-target ${
                      isActiveRoute(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                    aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Enhanced accessibility */}
      <main 
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
        role="main"
        aria-label="Admin panel main content"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © 2024 Al Mazahir Trading Est. - Admin Panel
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-700">
                View Website
              </Link>
              <span>•</span>
              <span>Version 2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}