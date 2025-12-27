'use client'

import { useState, useEffect } from 'react'
import { AvailabilityStatus } from '@/lib/types/database'
import { useAvailabilitySubscription } from '@/lib/hooks'
import { withNetworkErrorBoundary } from './withErrorBoundary'
import { AvailabilityFallback } from './FallbackComponents'

interface AvailabilityIndicatorProps {
  categoryId: string
  fallbackStatus?: AvailabilityStatus
  showTimestamp?: boolean
  className?: string
}

const statusConfig = {
  in_stock: {
    label: 'In Stock',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
    icon: '🟢'
  },
  limited: {
    label: 'Limited Stock',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500',
    icon: '🟡'
  },
  out_of_stock: {
    label: 'Out of Stock',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-500',
    icon: '🔴'
  },
  on_order: {
    label: 'Available on Order',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    dotColor: 'bg-blue-500',
    icon: '🔵'
  }
}

// Skeleton loader component - mobile optimized
const SkeletonLoader = () => (
  <div className="flex items-center space-x-2 animate-pulse">
    <div className="w-3 h-3 sm:w-3 sm:h-3 bg-gray-300 rounded-full"></div>
    <div className="h-4 bg-gray-300 rounded w-20 sm:w-24"></div>
  </div>
)

function AvailabilityIndicatorCore({
  categoryId,
  fallbackStatus,
  showTimestamp = false,
  className = ''
}: AvailabilityIndicatorProps) {
  const { availabilityData, loading, error } = useAvailabilitySubscription()
  const [localError, setLocalError] = useState<string | null>(null)

  // Get availability data for this specific category
  const availabilityInfo = availabilityData[categoryId]

  // Show skeleton loader while loading - with accessibility
  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`} role="status" aria-label="Loading availability status">
        <SkeletonLoader />
        <span className="sr-only">Loading product availability status...</span>
      </div>
    )
  }

  // Show error state or fallback - mobile optimized with accessibility
  if ((error || localError) && !availabilityInfo) {
    return (
      <div 
        className={`inline-flex items-center space-x-2 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Product availability status unavailable, please contact us for current status"
      >
        <div className="w-3 h-3 bg-gray-400 rounded-full" aria-hidden="true"></div>
        <span className="text-sm text-gray-500 text-readable">
          <span className="hidden sm:inline">Contact for status</span>
          <span className="sm:hidden">Contact us</span>
        </span>
      </div>
    )
  }

  // Use fallback if no data available
  const statusData = availabilityInfo || (fallbackStatus ? {
    status: fallbackStatus,
    lastUpdated: new Date().toISOString()
  } : null)

  if (!statusData) {
    return null
  }

  const config = statusConfig[statusData.status]
  const lastUpdated = new Date(statusData.lastUpdated)
  const isRecent = Date.now() - lastUpdated.getTime() < 5 * 60 * 1000 // 5 minutes

  return (
    <div 
      className={`inline-flex items-center space-x-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Product availability: ${config.label}${showTimestamp ? `, last updated ${formatTimestamp(lastUpdated)}` : ''}`}
    >
      {/* Status indicator dot - larger on mobile for better touch targets */}
      <div 
        className={`w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 rounded-full ${config.dotColor} ${isRecent ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      ></div>
      
      {/* Status text - responsive sizing */}
      <span className={`text-sm sm:text-sm md:text-sm font-medium ${config.color} text-readable`}>
        {config.label}
      </span>
      
      {/* Optional timestamp - responsive display */}
      {showTimestamp && (
        <span className="text-xs sm:text-xs text-gray-500 hidden sm:inline" aria-label={`Last updated ${formatTimestamp(lastUpdated)}`}>
          Updated {formatTimestamp(lastUpdated)}
        </span>
      )}
      
      {/* Mobile-only abbreviated timestamp */}
      {showTimestamp && (
        <span className="text-xs text-gray-500 sm:hidden" aria-label={`Updated ${formatTimestamp(lastUpdated)}`}>
          {formatTimestamp(lastUpdated).replace(' ago', '')}
        </span>
      )}
    </div>
  )
}

// Helper function to format timestamp
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Wrap with error boundary and export
const AvailabilityIndicator = withNetworkErrorBoundary(
  AvailabilityIndicatorCore,
  'AvailabilityIndicator'
)

export default AvailabilityIndicator

// Export the status configuration for use in other components
export { statusConfig }