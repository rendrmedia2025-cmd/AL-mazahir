/**
 * Feature Flags Admin Interface
 * Allows admins to manage feature flags and rollout strategies
 * Requirements: 9.1, 9.4
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FeatureFlag, FeatureFlagStatus, RolloutStrategy } from '@/lib/feature-flags';

interface FeatureFlagFormData {
  name: string;
  description: string;
  status: FeatureFlagStatus;
  rollout_strategy: RolloutStrategy;
  rollout_percentage: number;
  rollout_user_list: string[];
  expires_at?: string;
}

export default function FeatureFlagsAdminPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any>>({});

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) {
        throw new Error('Failed to load feature flags');
      }
      const data = await response.json();
      setFlags(data.flags || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (flagId: string) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(prev => ({ ...prev, [flagId]: data }));
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleCreateFlag = async (formData: FeatureFlagFormData) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create feature flag');
      }

      await loadFlags();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flag');
    }
  };

  const handleUpdateFlag = async (id: string, updates: Partial<FeatureFlag>) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update feature flag');
      }

      await loadFlags();
      setEditingFlag(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flag');
    }
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete feature flag');
      }

      await loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flag');
    }
  };

  const getStatusColor = (status: FeatureFlagStatus) => {
    switch (status) {
      case 'enabled': return 'text-green-600 bg-green-100';
      case 'rollout': return 'text-yellow-600 bg-yellow-100';
      case 'disabled': return 'text-gray-600 bg-gray-100';
      case 'deprecated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Feature Flag
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {flags.map(flag => (
          <Card key={flag.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flag.status)}`}>
                    {flag.status}
                  </span>
                  {flag.status === 'rollout' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {flag.rollout_strategy === 'percentage' 
                        ? `${flag.rollout_percentage}%` 
                        : flag.rollout_strategy}
                    </span>
                  )}
                </div>
                
                {flag.description && (
                  <p className="text-gray-600 mb-3">{flag.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Environment: {flag.environment}</span>
                  <span>Updated: {new Date(flag.updated_at).toLocaleDateString()}</span>
                  {flag.expires_at && (
                    <span>Expires: {new Date(flag.expires_at).toLocaleDateString()}</span>
                  )}
                </div>

                {flag.status === 'rollout' && flag.rollout_strategy === 'user_list' && flag.rollout_user_list && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Users: </span>
                    <span className="text-sm text-gray-700">{flag.rollout_user_list.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAnalytics(flag.id)}
                >
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFlag(flag)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteFlag(flag.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>

            {analytics[flag.id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Analytics (Last 7 days)</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Evaluations: </span>
                    <span className="font-medium">{analytics[flag.id].total_evaluations || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Enabled: </span>
                    <span className="font-medium">{analytics[flag.id].enabled_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Success Rate: </span>
                    <span className="font-medium">
                      {analytics[flag.id].total_evaluations 
                        ? Math.round((analytics[flag.id].enabled_count / analytics[flag.id].total_evaluations) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {flags.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No feature flags found</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Feature Flag
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFlag) && (
        <FeatureFlagModal
          flag={editingFlag}
          onSave={editingFlag 
            ? (data) => handleUpdateFlag(editingFlag.id, data)
            : handleCreateFlag
          }
          onClose={() => {
            setShowCreateModal(false);
            setEditingFlag(null);
          }}
        />
      )}
    </div>
  );
}

interface FeatureFlagModalProps {
  flag?: FeatureFlag | null;
  onSave: (data: FeatureFlagFormData) => void;
  onClose: () => void;
}

function FeatureFlagModal({ flag, onSave, onClose }: FeatureFlagModalProps) {
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    name: flag?.name || '',
    description: flag?.description || '',
    status: flag?.status || 'disabled',
    rollout_strategy: flag?.rollout_strategy || 'all_users',
    rollout_percentage: flag?.rollout_percentage || 0,
    rollout_user_list: flag?.rollout_user_list || [],
    expires_at: flag?.expires_at ? flag.expires_at.split('T')[0] : ''
  });

  const [userListText, setUserListText] = useState(
    flag?.rollout_user_list?.join('\n') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      rollout_user_list: userListText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0),
      expires_at: formData.expires_at || undefined
    };

    onSave(data);
  };

  return (
    <Modal isOpen onClose={onClose} title={flag ? 'Edit Feature Flag' : 'Create Feature Flag'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!!flag} // Don't allow editing name of existing flags
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FeatureFlagStatus }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="disabled">Disabled</option>
            <option value="enabled">Enabled</option>
            <option value="rollout">Rollout</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>

        {formData.status === 'rollout' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rollout Strategy
              </label>
              <select
                value={formData.rollout_strategy}
                onChange={(e) => setFormData(prev => ({ ...prev, rollout_strategy: e.target.value as RolloutStrategy }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all_users">All Users</option>
                <option value="percentage">Percentage</option>
                <option value="user_list">User List</option>
                <option value="admin_only">Admin Only</option>
              </select>
            </div>

            {formData.rollout_strategy === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollout Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.rollout_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {formData.rollout_strategy === 'user_list' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User List (one per line)
                </label>
                <textarea
                  value={userListText}
                  onChange={(e) => setUserListText(e.target.value)}
                  placeholder="user@example.com&#10;user123&#10;another@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expires At (optional)
          </label>
          <input
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {flag ? 'Update' : 'Create'} Feature Flag
          </Button>
        </div>
      </form>
    </Modal>
  );
}