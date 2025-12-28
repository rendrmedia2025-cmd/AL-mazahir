'use client'

import { useState, useEffect } from 'react'

interface AvailabilityData {
  category: string
  available: number
  total: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  lastUpdated: string
}

export default function AvailabilityIndicator() {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching availability data
    const fetchAvailability = () => {
      const mockData: AvailabilityData[] = [
        {
          category: 'Safety Equipment',
          available: 1247,
          total: 1350,
          status: 'in-stock',
          lastUpdated: new Date().toISOString()
        },
        {
          category: 'Construction Materials',
          available: 892,
          total: 950,
          status: 'in-stock',
          lastUpdated: new Date().toISOString()
        },
        {
          category: 'Tools & Machinery',
          available: 156,
          total: 200,
          status: 'low-stock',
          lastUpdated: new Date().toISOString()
        },
        {
          category: 'Industrial Supplies',
          available: 2341,
          total: 2500,
          status: 'in-stock',
          lastUpdated: new Date().toISOString()
        },
        {
          category: 'Fire Safety',
          available: 45,
          total: 180,
          status: 'low-stock',
          lastUpdated: new Date().toISOString()
        },
        {
          category: 'Rental Equipment',
          available: 23,
          total: 35,
          status: 'in-stock',
          lastUpdated: new Date().toISOString()
        }
      ]
      
      setAvailabilityData(mockData)
      setLoading(false)
    }

    fetchAvailability()
    const interval = setInterval(fetchAvailability, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'text-green-600 bg-green-50'
      case 'low-stock': return 'text-yellow-600 bg-yellow-50'
      case 'out-of-stock': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return '✅'
      case 'low-stock': return '⚠️'
      case 'out-of-stock': return '❌'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real-Time Inventory Status
          </h2>
          <p className="text-gray-600">
            Live availability updates across all product categories
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Inventory Dashboard</h3>
                <div className="text-sm opacity-90">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4">
                {availabilityData.map((item, index) => {
                  const percentage = Math.round((item.available / item.total) * 100)
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                          <span className="mr-1">{getStatusIcon(item.status)}</span>
                          {item.status.replace('-', ' ').toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.category}</h4>
                          <p className="text-sm text-gray-600">
                            {item.available} of {item.total} items available
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {percentage}%
                          </div>
                          <div className="text-sm text-gray-500">Available</div>
                        </div>
                        
                        <div className="w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                percentage >= 80 ? 'bg-green-500' :
                                percentage >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {availabilityData.reduce((sum, item) => sum + item.available, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Available</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {availabilityData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Inventory</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        (availabilityData.reduce((sum, item) => sum + item.available, 0) /
                         availabilityData.reduce((sum, item) => sum + item.total, 0)) * 100
                      )}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Availability</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Request Stock Alert
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Get Quote
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}