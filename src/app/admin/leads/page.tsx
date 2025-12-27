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

interface EnhancedLead {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
  product_category?: string
  urgency: 'immediate' | '1-2_weeks' | 'planning'
  quantity_estimate?: string
  message?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  source_section?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
  created_at: string
  updated_at: string
  product_categories?: ProductCategory
}

interface LeadsResponse {
  success: boolean
  data: EnhancedLead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    statusCounts: { [key: string]: number }
  }
}

interface Filters {
  status: string
  category: string
  dateFrom: string
  dateTo: string
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' }
]

const urgencyOptions = [
  { value: 'immediate', label: 'Immediate', color: 'bg-red-100 text-red-800' },
  { value: '1-2_weeks', label: '1-2 Weeks', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' }
]

export default function LeadsManagementPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [leads, setLeads] = useState<EnhancedLead[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    total: 0,
    statusCounts: {} as { [key: string]: number }
  })
  const [filters, setFilters] = useState<Filters>({
    status: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [selectedLead, setSelectedLead] = useState<EnhancedLead | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await authClient.getAuthSession()
        setSession(sessionData)

        if (sessionData) {
          await loadLeadsData()
          await loadCategories()
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (session) {
      loadLeadsData()
    }
  }, [filters, pagination.page, session])

  const loadLeadsData = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/admin/leads?${params}`)
      if (response.ok) {
        const result: LeadsResponse = await response.json()
        setLeads(result.data)
        setPagination(result.pagination)
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Failed to load leads data:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/content')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const exportLeads = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export leads')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export leads')
    } finally {
      setIsExporting(false)
    }
  }

  const resetFilters = () => {
    setFilters({
      status: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusOption = (status: string) => {
    return statusOptions.find(option => option.value === status)
  }

  const getUrgencyOption = (urgency: string) => {
    return urgencyOptions.find(option => option.value === urgency)
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
        <p className="text-gray-600">Please log in to manage leads.</p>
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
              Leads Management
            </h1>
            <p className="text-gray-600">
              View and manage customer inquiries and leads.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => exportLeads('csv')}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              onClick={() => exportLeads('json')}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Leads</p>
          </div>
        </Card>
        
        {statusOptions.slice(1).map((status) => (
          <Card key={status.value} className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.statusCounts[status.value] || 0}
              </p>
              <p className="text-sm text-gray-600">{status.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Name, email, company..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category & Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => {
                const statusOption = getStatusOption(lead.status)
                const urgencyOption = getUrgencyOption(lead.urgency)
                
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.email}
                        </div>
                        {lead.company && (
                          <div className="text-sm text-gray-500">
                            {lead.company}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-sm text-gray-500">
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {lead.product_categories?.name || 'No category'}
                        </div>
                        {urgencyOption && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyOption.color}`}>
                            {urgencyOption.label}
                          </span>
                        )}
                        {lead.quantity_estimate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Qty: {lead.quantity_estimate}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusOption && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption.color}`}>
                          {statusOption.label}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {lead.source_section && (
                          <div>{lead.source_section}</div>
                        )}
                        {lead.device_type && (
                          <div className="text-xs">
                            {lead.device_type}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => setSelectedLead(lead)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {leads.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="text-lg mb-2">👥</p>
            <p className="text-lg font-medium mb-2">No Leads Found</p>
            <p className="text-sm">
              Customer inquiries will appear here once they start submitting the contact form.
            </p>
          </div>
        </Card>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Lead Details
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedLead.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedLead.email}</p>
                </div>
                
                {selectedLead.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="text-sm text-gray-900">{selectedLead.company}</p>
                  </div>
                )}
                
                {selectedLead.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedLead.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Category</label>
                  <p className="text-sm text-gray-900">
                    {selectedLead.product_categories?.name || 'No category'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Urgency</label>
                  <p className="text-sm text-gray-900">
                    {getUrgencyOption(selectedLead.urgency)?.label || selectedLead.urgency}
                  </p>
                </div>
                
                {selectedLead.quantity_estimate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Estimate</label>
                    <p className="text-sm text-gray-900">{selectedLead.quantity_estimate}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">
                    {getStatusOption(selectedLead.status)?.label || selectedLead.status}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source Section</label>
                  <p className="text-sm text-gray-900">{selectedLead.source_section || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Type</label>
                  <p className="text-sm text-gray-900">{selectedLead.device_type || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLead.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLead.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedLead.message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setSelectedLead(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}