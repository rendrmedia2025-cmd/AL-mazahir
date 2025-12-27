'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authClient, type AuthSession } from '@/lib/auth-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface DashboardStats {
  totalLeads: number
  newLeads: number
  activeCategories: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const sessionData = await authClient.getAuthSession()
        setSession(sessionData)

        if (sessionData) {
          // Load dashboard statistics
          const response = await fetch('/api/admin/dashboard-stats')
          if (response.ok) {
            const statsData = await response.json()
            setStats(statsData)
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Product Availability',
      description: 'Update product category availability status',
      href: '/admin/availability',
      icon: '📦',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Lead Management',
      description: 'View and manage customer inquiries',
      href: '/admin/leads',
      icon: '👥',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Content Management',
      description: 'Update website content and settings',
      href: '/admin/content',
      icon: '✏️',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ]

  // Add user management for admin role
  if (session.adminProfile.role === 'admin') {
    quickActions.push({
      title: 'User Management',
      description: 'Manage admin users and permissions',
      href: '/admin/users',
      icon: '🔐',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
      buttonColor: 'bg-orange-600 hover:bg-orange-700'
    })
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      {/* Welcome Section - Mobile optimized */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          <span className="hidden sm:inline">Welcome back, {session.adminProfile.full_name || session.user.email}</span>
          <span className="sm:hidden">Welcome back</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-readable">
          <span className="hidden sm:inline">Manage your Al Mazahir Trading Est. website content and business operations.</span>
          <span className="sm:hidden">Manage your Al Mazahir website.</span>
        </p>
      </div>

      {/* Statistics Cards - Mobile optimized */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">🆕</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">New Leads</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.newLeads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">Active Categories</span>
                  <span className="sm:hidden">Categories</span>
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.activeCategories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">🕒</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">Last Updated</span>
                  <span className="sm:hidden">Updated</span>
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{stats.lastUpdated}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions - Mobile optimized */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className={`p-4 sm:p-6 ${action.color} border-2 hover:shadow-md transition-shadow`}>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{action.icon}</div>
                <h3 className={`text-sm sm:text-base lg:text-lg font-medium ${action.textColor} mb-2`}>
                  {action.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 text-readable">
                  {action.description}
                </p>
                <Link href={action.href}>
                  <Button 
                    className={`w-full text-white ${action.buttonColor} touch-target`}
                    size="sm"
                  >
                    Manage
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <p className="mb-2">📈</p>
            <p>Recent activity will be displayed here</p>
            <p className="text-sm">Check back later for updates on leads, availability changes, and system activity.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}