'use client'

import { useEffect, useState } from 'react'
import { authClient, type AuthSession } from '@/lib/auth-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ProductCategory {
  id: string
  name: string
  slug: string
}

interface AvailabilityStatus {
  id: string
  category_id: string
  status: 'in_stock' | 'limited' | 'out_of_stock' | 'on_order'
  notes?: string
  admin_override: boolean
  last_updated: string
  product_categories: ProductCategory
}

interface BulkUpdateData {
  categoryIds: string[]
  status: 'in_stock' | 'limited' | 'out_of_stock' | 'on_order'
  notes?: string
}

const statusOptions = [
  { value: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-800', icon: '🟢' },
  { value: 'limited', label: 'Limited Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' },
  { value: 'on_order', label: 'Available on Order', color: 'bg-blue-100 text-blue-800', icon: '🔵' }
]

export default function AvailabilityManagementPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [availabilityData, setAvailabilityData] = useState<AvailabilityStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [bulkUpdateData, setBulkUpdateData] = useState<BulkUpdateData>({
    categoryIds: [],
    status: 'in_stock'
  })
  const [previewChanges, setPreviewChanges] = useState<{[key: string]: any}>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await authClient.getAuthSession()
        setSession(sessionData)

        if (sessionData) {
          await loadAvailabilityData()
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const loadAvailabilityData = async () => {
    try {
      const response = await fetch('/api/admin/availability')
      if (response.ok) {
        const result = await response.json()
        setAvailabilityData(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load availability data:', error)
    }
  }

  const updateAvailabilityStatus = async (
    categoryId: string, 
    status: string, 
    notes?: string, 
    adminOverride?: boolean
  ) => {
    setIsUpdating(categoryId)
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          status,
          notes,
          adminOverride
        }),
      })

      if (response.ok) {
        await loadAvailabilityData()
        // Clear preview for this item
        setPreviewChanges(prev => {
          const updated = { ...prev }
          delete updated[categoryId]
          return updated
        })
      } else {
        const error = await response.json()
        alert(`Failed to update status: ${error.error}`)
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update availability status')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) return

    setIsUpdating('bulk')
    try {
      const promises = selectedItems.map(categoryId =>
        updateAvailabilityStatus(categoryId, bulkUpdateData.status, bulkUpdateData.notes, true)
      )
      
      await Promise.all(promises)
      setSelectedItems([])
      setShowBulkUpdate(false)
      setBulkUpdateData({ categoryIds: [], status: 'in_stock' })
    } catch (error) {
      console.error('Bulk update failed:', error)
      alert('Some updates failed. Please check and try again.')
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleItemSelection = (categoryId: string) => {
    setSelectedItems(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectAllItems = () => {
    if (selectedItems.length === availabilityData.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(availabilityData.map(item => item.category_id))
    }
  }

  const previewStatusChange = (categoryId: string, newStatus: string) => {
    setPreviewChanges(prev => ({
      ...prev,
      [categoryId]: { status: newStatus, timestamp: new Date() }
    }))
  }

  const getStatusOption = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to manage availability status.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Product Availability Management
            </h1>
            <p className="text-gray-600">
              Update product category availability status and manage inventory information.
            </p>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-center space-x-4">
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                <Button
                  onClick={() => setShowBulkUpdate(true)}
                  size="sm"
                  disabled={isUpdating === 'bulk'}
                >
                  Bulk Update
                </Button>
              </div>
            )}
            <Button
              onClick={selectAllItems}
              variant="outline"
              size="sm"
            >
              {selectedItems.length === availabilityData.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Bulk Update Availability
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Update {selectedItems.length} selected categories to:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={bulkUpdateData.status}
                  onChange={(e) => setBulkUpdateData(prev => ({ 
                    ...prev, 
                    status: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bulkUpdateData.notes || ''}
                  onChange={(e) => setBulkUpdateData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes about this status change..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowBulkUpdate(false)}
                variant="outline"
                disabled={isUpdating === 'bulk'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={isUpdating === 'bulk'}
              >
                {isUpdating === 'bulk' ? 'Updating...' : 'Update All'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Availability Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availabilityData.map((item) => {
          const currentStatus = previewChanges[item.category_id]?.status || item.status
          const statusOption = getStatusOption(currentStatus)
          const isPreview = !!previewChanges[item.category_id]
          
          return (
            <Card key={item.id} className={`p-6 ${isPreview ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              {/* Selection Checkbox */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.category_id)}
                    onChange={() => toggleItemSelection(item.category_id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <h3 className="ml-3 text-lg font-medium text-gray-900">
                    {item.product_categories.name}
                  </h3>
                </div>
                {isPreview && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Preview
                  </span>
                )}
              </div>

              {/* Current Status */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{statusOption.icon}</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusOption.color}`}>
                    {statusOption.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(item.last_updated).toLocaleString()}
                </p>
                {item.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Status Update Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => previewStatusChange(item.category_id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isUpdating === item.category_id}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isPreview && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => updateAvailabilityStatus(item.category_id, currentStatus)}
                      size="sm"
                      disabled={isUpdating === item.category_id}
                      className="flex-1"
                    >
                      {isUpdating === item.category_id ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={() => setPreviewChanges(prev => {
                        const updated = { ...prev }
                        delete updated[item.category_id]
                        return updated
                      })}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Real-time Preview */}
              {isPreview && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> This category will be marked as "{statusOption.label}" 
                    when you save the changes.
                  </p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {availabilityData.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="text-lg mb-2">📦</p>
            <p className="text-lg font-medium mb-2">No Product Categories Found</p>
            <p className="text-sm">
              Product categories will appear here once they are created in the system.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}