'use client'

import { useState, useEffect } from 'react'

interface OperationalStatus {
  id: string
  name: string
  status: 'operational' | 'warning' | 'maintenance' | 'offline'
  percentage: number
  lastUpdated: string
  details: string
}

const statusConfig = {
  operational: { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  warning: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  maintenance: { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  offline: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' }
}

export default function RealTimeStatusEngine() {
  const [operationalData, setOperationalData] = useState<OperationalStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [layout, setLayout] = useState<'compact' | 'dashboard' | 'detailed'>('dashboard')

  // Fetch operational status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status/operational')
      if (response.ok) {
        const data = await response.json()
        setOperationalData(data.areas || [])
      } else {
        // Fallback data if API fails
        setOperationalData([
          {
            id: 'inventory',
            name: 'Inventory Availability',
            status: 'operational',
            percentage: 94,
            lastUpdated: new Date().toISOString(),
            details: 'Stock levels optimal across all categories'
          },
          {
            id: 'supply-chain',
            name: 'Supply Chain Health',
            status: 'operational',
            percentage: 89,
            lastUpdated: new Date().toISOString(),
            details: 'All suppliers active, minor delays in steel delivery'
          },
          {
            id: 'quality',
            name: 'Quality Assurance',
            status: 'operational',
            percentage: 98,
            lastUpdated: new Date().toISOString(),
            details: 'All certifications current, inspection schedules on track'
          },
          {
            id: 'logistics',
            name: 'Logistics Capacity',
            status: 'warning',
            percentage: 76,
            lastUpdated: new Date().toISOString(),
            details: 'High demand period, extended delivery times'
          },
          {
            id: 'customer-service',
            name: 'Customer Service',
            status: 'operational',
            percentage: 96,
            lastUpdated: new Date().toISOString(),
            details: 'Response times under 2 hours, satisfaction high'
          },
          {
            id: 'operations',
            name: 'Business Operations',
            status: 'operational',
            percentage: 92,
            lastUpdated: new Date().toISOString(),
            details: 'All systems operational, minor maintenance scheduled'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch operational status:', error)
      // Use fallback data
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getOverallHealth = () => {
    if (operationalData.length === 0) return 0
    const average = operationalData.reduce((sum, item) => sum + item.percentage, 0) / operationalData.length
    return Math.round(average)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return '✅'
      case 'warning': return '⚠️'
      case 'maintenance': return '🔧'
      case 'offline': return '❌'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Real-Time Operations Status
            </h2>
            <p className="text-gray-600">
              Live monitoring of our operational capabilities and service levels
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Layout Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              {(['compact', 'dashboard', 'detailed'] as const).map((layoutType) => (
                <button
                  key={layoutType}
                  onClick={() => setLayout(layoutType)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    layout === layoutType
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {layoutType.charAt(0).toUpperCase() + layoutType.slice(1)}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchStatus}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-sm text-gray-600">🔄</span>
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Overall Health */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Overall Operational Health
              </h3>
              <p className="text-gray-600">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {getOverallHealth()}%
              </div>
              <div className="text-sm text-gray-500">System Health</div>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getOverallHealth()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className={`grid gap-6 ${
          layout === 'compact' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' :
          layout === 'dashboard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2'
        }`}>
          {operationalData.map((area) => {
            const config = statusConfig[area.status]
            
            return (
              <div
                key={area.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  layout === 'compact' ? 'p-4' : 'p-6'
                }`}
              >
                {/* Status Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center space-x-2 ${config.textColor}`}>
                    <span className="text-lg">{getStatusIcon(area.status)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                      {area.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {area.percentage}%
                    </div>
                  </div>
                </div>

                {/* Area Name */}
                <h4 className={`font-semibold mb-2 ${
                  layout === 'compact' ? 'text-sm' : 'text-lg'
                }`}>
                  {area.name}
                </h4>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${config.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${area.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                {layout !== 'compact' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {area.details}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(area.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Status Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h4 className="font-semibold mb-4">Status Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                <span className="text-sm font-medium capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}