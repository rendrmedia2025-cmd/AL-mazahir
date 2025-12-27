'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SecurityStats {
  failedLogins: number
  blockedIPs: number
  suspiciousActivities: number
  criticalAlerts: number
}

interface BlockedIP {
  ip: string
  lockoutTime: Date
  attempts: number
}

interface SecurityAlert {
  id: string
  action: string
  new_values: {
    alertType: string
    severity: string
    message: string
    details: any
    timestamp: string
  }
  ip_address: string | null
  created_at: string
}

export default function SecurityPage() {
  const [stats, setStats] = useState<SecurityStats>({
    failedLogins: 0,
    blockedIPs: 0,
    suspiciousActivities: 0,
    criticalAlerts: 0
  })
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([])
  const [hourlyTrends, setHourlyTrends] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [timeWindow, setTimeWindow] = useState(24) // hours

  useEffect(() => {
    fetchSecurityData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000)
    return () => clearInterval(interval)
  }, [timeWindow])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/security/monitoring?timeWindow=${timeWindow * 60 * 60 * 1000}`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.data.stats)
        setBlockedIPs(data.data.blockedIPs)
        setRecentAlerts(data.data.recentAlerts)
        setHourlyTrends(data.data.hourlyTrends)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const unblockIP = async (ip: string) => {
    try {
      const response = await fetch(`/api/admin/security/blocked-ips?ip=${encodeURIComponent(ip)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh data
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error unblocking IP:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatColor = (value: number, type: string) => {
    if (type === 'criticalAlerts' && value > 0) return 'text-red-600'
    if (type === 'blockedIPs' && value > 5) return 'text-orange-600'
    if (type === 'failedLogins' && value > 20) return 'text-yellow-600'
    return 'text-gray-900'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
          </select>
          <Button onClick={fetchSecurityData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading security data...</p>
        </div>
      ) : (
        <>
          {/* Security Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                  <p className={`text-2xl font-bold ${getStatColor(stats.failedLogins, 'failedLogins')}`}>
                    {stats.failedLogins}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🔐</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
                  <p className={`text-2xl font-bold ${getStatColor(stats.blockedIPs, 'blockedIPs')}`}>
                    {stats.blockedIPs}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🚫</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Suspicious Activities</p>
                  <p className={`text-2xl font-bold ${getStatColor(stats.suspiciousActivities, 'suspiciousActivities')}`}>
                    {stats.suspiciousActivities}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className={`text-2xl font-bold ${getStatColor(stats.criticalAlerts, 'criticalAlerts')}`}>
                    {stats.criticalAlerts}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">🚨</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Blocked IPs */}
          {blockedIPs.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Blocked IP Addresses</h2>
              <div className="space-y-3">
                {blockedIPs.map((blockedIP) => (
                  <div key={blockedIP.ip} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{blockedIP.ip}</p>
                      <p className="text-sm text-gray-600">
                        {blockedIP.attempts} failed attempts • Locked until {new Date(blockedIP.lockoutTime).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => unblockIP(blockedIP.ip)}
                      variant="outline"
                      size="sm"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Security Alerts */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Alerts</h2>
            {recentAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No security alerts in the selected time window.</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-lg ${getSeverityColor(alert.new_values.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.new_values.severity)}`}>
                            {alert.new_values.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {alert.new_values.alertType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-2">
                          {alert.new_values.message}
                        </p>
                        
                        {alert.ip_address && (
                          <p className="text-xs text-gray-600">
                            <strong>IP:</strong> {alert.ip_address}
                          </p>
                        )}
                        
                        {alert.new_values.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              View Details
                            </summary>
                            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(alert.new_values.details, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        {formatDate(alert.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Failed Login Trends */}
          {Object.keys(hourlyTrends).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Failed Login Trends (Hourly)</h2>
              <div className="space-y-2">
                {Object.entries(hourlyTrends)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([hour, count]) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(hour).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit',
                          hour12: false
                        })}:00
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (count / Math.max(...Object.values(hourlyTrends))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}