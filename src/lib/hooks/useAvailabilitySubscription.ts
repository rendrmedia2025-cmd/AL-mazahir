'use client'

import { useEffect, useState } from 'react'
import { AvailabilityStatus } from '@/lib/types/database'

interface AvailabilityData {
  [categoryId: string]: {
    status: AvailabilityStatus
    lastUpdated: string
  }
}

export function useAvailabilitySubscription() {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch without Supabase subscription
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/public/availability')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          // Transform the data to the expected format
          const transformedData: AvailabilityData = {}
          result.data.forEach((item: any) => {
            transformedData[item.category_id] = {
              status: item.status,
              lastUpdated: item.last_updated
            }
          })
          setAvailabilityData(transformedData)
          setError(null)
        } else {
          throw new Error('Failed to fetch availability data')
        }
      } catch (err) {
        console.error('Failed to fetch initial availability data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        
        // Set default availability data as fallback
        const defaultData: AvailabilityData = {
          'safety-equipment': { status: 'in_stock', lastUpdated: new Date().toISOString() },
          'fire-safety': { status: 'in_stock', lastUpdated: new Date().toISOString() },
          'construction-materials': { status: 'in_stock', lastUpdated: new Date().toISOString() },
          'tools-machinery': { status: 'in_stock', lastUpdated: new Date().toISOString() },
          'industrial-supplies': { status: 'in_stock', lastUpdated: new Date().toISOString() },
          'rental-equipment': { status: 'in_stock', lastUpdated: new Date().toISOString() }
        }
        setAvailabilityData(defaultData)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Simplified polling instead of real-time subscription
    const interval = setInterval(() => {
      fetchInitialData()
    }, 30000) // Poll every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  return {
    availabilityData,
    loading,
    error,
    refetch: () => {
      // Trigger a refetch by calling the initial fetch function
      setLoading(true)
      fetch('/api/public/availability')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            // Transform the data to the expected format
            const transformedData: AvailabilityData = {}
            data.data.forEach((item: any) => {
              transformedData[item.category_id] = {
                status: item.status,
                lastUpdated: item.last_updated
              }
            })
            setAvailabilityData(transformedData)
          }
        })
        .catch(err => {
          console.error('Failed to refetch availability data:', err)
          setError(err instanceof Error ? err.message : 'Unknown error')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }
}