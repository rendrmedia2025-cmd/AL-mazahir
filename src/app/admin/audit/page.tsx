'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin_profiles?: {
    full_name: string
    role: string
  }
}

interface SecurityEvent {
  id: string
  action: string
  new_values: {
    eventType: string
    severity: string
    description: string
    metadata?: any
  }
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'audit' | 'security'>('audit')
  const [filters, setFilters] = useState({
    resourceType: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    severity: ''
  })

  useEffect(() => {
    fetchAuditData()
  }, [filters])

  const fetchAuditData = async () => {
    try {
      setLoading(true)
      
      // Fetch audit logs
      const auditParams = new URLSearchParams()
      if (filters.resourceType) auditParams.set('resourceType', filters.resourceType)
      if (filters.action) auditParams.set('action', filters.action)
      if (filters.dateFrom) auditParams.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) auditParams.set('dateTo', filters.dateTo)

      const auditResponse = await fetch(`/api/admin/audit/logs?${auditParams}`)
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditLogs(auditData.data || [])
      }

      // Fetch security events
      const securityParams = new URLSearchParams()
      if (filters.severity) securityParams.set('severity', filters.severity)
      if (filters.dateFrom) securityParams.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) securityParams.set('dateTo', filters.dateTo)

      const securityResponse = await fetch(`/api/admin/audit/security?${securityParams}`)
      if (securityResponse.ok) {
        const securityData = await securityResponse.json()
        setSecurityEvents(securityData.data || [])
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const exportAuditData = async () => {
    try {
      const response = await fetch('/api/admin/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, type: activeTab })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting audit data:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <Button onClick={exportAuditData} variant="outline">
          Export Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin Actions ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security Events ({securityEvents.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {activeTab === 'audit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="availability_status">Availability</option>
                  <option value="product_categories">Categories</option>
                  <option value="enhanced_leads">Leads</option>
                  <option value="admin_profiles">Admin Users</option>
                  <option value="business_insights">Insights</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'security' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ resourceType: '', action: '', dateFrom: '', dateTo: '', severity: '' })}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading audit data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'audit' && (
            <>
              {auditLogs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">No audit logs found for the selected criteria.</p>
                </Card>
              ) : (
                auditLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.resource_type}
                          </span>
                          {log.resource_id && (
                            <span className="text-xs text-gray-400">
                              ID: {log.resource_id}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>User:</strong> {log.admin_profiles?.full_name || 'System'} 
                          ({log.admin_profiles?.role || 'system'})
                        </div>
                        
                        {log.ip_address && (
                          <div className="text-xs text-gray-500 mb-1">
                            <strong>IP:</strong> {log.ip_address}
                          </div>
                        )}
                        
                        {(log.old_values || log.new_values) && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              View Changes
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              {log.old_values && (
                                <div className="mb-2">
                                  <strong>Before:</strong>
                                  <pre className="mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <strong>After:</strong>
                                  <pre className="mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}

          {activeTab === 'security' && (
            <>
              {securityEvents.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">No security events found for the selected criteria.</p>
                </Card>
              ) : (
                securityEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.new_values.severity)}`}>
                            {event.new_values.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {event.new_values.eventType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-800 mb-2">
                          {event.new_values.description}
                        </div>
                        
                        {event.ip_address && (
                          <div className="text-xs text-gray-500 mb-1">
                            <strong>IP:</strong> {event.ip_address}
                          </div>
                        )}
                        
                        {event.new_values.metadata && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              View Details
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(event.new_values.metadata, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        {formatDate(event.created_at)}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}