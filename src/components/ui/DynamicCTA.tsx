'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { AvailabilityStatus } from '@/lib/types/database'
import { useAvailabilitySubscription } from '@/lib/hooks'
import { event } from '@/lib/analytics'
import { withNetworkErrorBoundary } from './withErrorBoundary'
import { CTAFallback } from './FallbackComponents'

interface DynamicCTAProps {
  categoryId: string
  availabilityStatus?: AvailabilityStatus
  onAction?: (action: CTAAction) => void
  fallbackText?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

interface CTAAction {
  type: 'quote' | 'availability' | 'notify' | 'alternative' | 'lead_time'
  categoryId: string
  metadata: ActionMetadata
}

interface ActionMetadata {
  timestamp: Date
  availabilityStatus: AvailabilityStatus
  source: 'dynamic_cta'
  userAgent?: string
}

// CTA configuration based on availability status
const ctaConfig = {
  in_stock: {
    text: 'Request Quote',
    type: 'quote' as const,
    variant: 'primary' as const,
    description: 'Get pricing for available products'
  },
  limited: {
    text: 'Check Availability',
    type: 'availability' as const,
    variant: 'primary' as const,
    description: 'Confirm current stock levels'
  },
  out_of_stock: {
    text: 'Notify Me',
    type: 'notify' as const,
    variant: 'secondary' as const,
    description: 'Get notified when back in stock'
  },
  on_order: {
    text: 'Request Lead Time',
    type: 'lead_time' as const,
    variant: 'outline' as const,
    description: 'Get delivery timeline information'
  }
}

// Skeleton loader for CTA button - mobile optimized
const CTASkeleton = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-11 w-28 sm:w-32',
    md: 'h-12 w-32 sm:w-36',
    lg: 'h-14 w-36 sm:w-40'
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-md animate-pulse`}></div>
  )
}

function DynamicCTACore({
  categoryId,
  availabilityStatus,
  onAction,
  fallbackText = 'Enquire Now',
  className = '',
  variant,
  size = 'md'
}: DynamicCTAProps) {
  const { availabilityData, loading, error } = useAvailabilitySubscription()
  const [isProcessing, setIsProcessing] = useState(false)

  // Get availability data for this specific category
  const availabilityInfo = availabilityData[categoryId]
  
  // Determine the current availability status
  const currentStatus = availabilityInfo?.status || availabilityStatus
  
  // Show skeleton loader while loading - with accessibility
  if (loading && !currentStatus) {
    return (
      <div className={className} role="status" aria-label="Loading call-to-action button">
        <CTASkeleton size={size} />
        <span className="sr-only">Loading call-to-action button...</span>
      </div>
    )
  }

  // Get CTA configuration based on availability status
  const config = currentStatus ? ctaConfig[currentStatus] : null
  
  // Use fallback if no configuration available
  const buttonText = config?.text || fallbackText
  const buttonVariant = variant || config?.variant || 'primary'
  const actionType = config?.type || 'quote'

  const handleClick = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    
    try {
      // Create action metadata
      const metadata: ActionMetadata = {
        timestamp: new Date(),
        availabilityStatus: currentStatus || 'in_stock',
        source: 'dynamic_cta',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      }

      // Create CTA action
      const action: CTAAction = {
        type: actionType,
        categoryId,
        metadata
      }

      // Track analytics event
      event({
        action: 'dynamic_cta_click',
        category: 'engagement',
        label: `${actionType}_${categoryId}`,
        value: 1
      })

      // Track specific CTA type
      event({
        action: `cta_${actionType}`,
        category: 'conversion',
        label: categoryId
      })

      // Call the onAction callback if provided
      if (onAction) {
        await onAction(action)
      }

      // Default behavior: scroll to contact form or open WhatsApp
      if (!onAction) {
        const contactSection = document.getElementById('contact')
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' })
        }
      }

    } catch (error) {
      console.error('Error handling CTA click:', error)
      
      // Track error event
      event({
        action: 'cta_error',
        category: 'error',
        label: `${actionType}_${categoryId}`
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Show error state with fallback CTA - with accessibility
  if (error && !currentStatus) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size={size}
          onClick={handleClick}
          disabled={isProcessing}
          title="Contact us for current availability and assistance"
          aria-label={`${fallbackText} - availability status unavailable`}
        >
          {isProcessing ? 'Processing...' : fallbackText}
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={isProcessing}
        title={config?.description || 'Contact us for more information'}
        aria-label={`${buttonText}${currentStatus ? ` - current status: ${currentStatus.replace('_', ' ')}` : ''}`}
        aria-describedby={config?.description ? `cta-desc-${categoryId}` : undefined}
      >
        {isProcessing ? (
          <>
            <span className="sr-only">Processing your request...</span>
            <span aria-hidden="true">Processing...</span>
          </>
        ) : (
          buttonText
        )}
      </Button>
      {config?.description && (
        <span id={`cta-desc-${categoryId}`} className="sr-only">
          {config.description}
        </span>
      )}
    </div>
  )
}

// Wrap with error boundary and export
const DynamicCTA = withNetworkErrorBoundary(
  DynamicCTACore,
  'DynamicCTA'
)

export default DynamicCTA

// Export types and configuration for use in other components
export type { DynamicCTAProps, CTAAction, ActionMetadata }
export { ctaConfig }