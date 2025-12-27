/**
 * Enterprise Feature Flag System
 * Enables gradual rollout and zero-downtime deployment capabilities
 * Requirements: 9.1, 9.4
 */

import { createClient } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';

export type FeatureFlagStatus = 'disabled' | 'enabled' | 'rollout' | 'deprecated';
export type RolloutStrategy = 'all_users' | 'percentage' | 'user_list' | 'admin_only';

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  status: FeatureFlagStatus;
  rollout_strategy: RolloutStrategy;
  rollout_percentage: number;
  rollout_user_list?: string[];
  environment: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface FeatureFlagEvaluationContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  isAdmin?: boolean;
  email?: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagAnalytics {
  feature_flag_id: string;
  user_id?: string;
  session_id?: string;
  flag_evaluated: boolean;
  flag_enabled: boolean;
  evaluation_context?: Record<string, any>;
}

/**
 * Client-side feature flag service
 */
export class FeatureFlagService {
  private supabase = createClient();
  private cache = new Map<string, { flag: FeatureFlag; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a feature flag is enabled for the current context
   */
  async isEnabled(
    flagName: string, 
    context: FeatureFlagEvaluationContext = {}
  ): Promise<boolean> {
    try {
      const flag = await this.getFlag(flagName);
      if (!flag) {
        await this.logAnalytics(flagName, false, false, context);
        return false;
      }

      const enabled = await this.evaluateFlag(flag, context);
      await this.logAnalytics(flag.id, true, enabled, context);
      
      return enabled;
    } catch (error) {
      console.error(`Error evaluating feature flag ${flagName}:`, error);
      await this.logAnalytics(flagName, false, false, context);
      return false;
    }
  }

  /**
   * Get multiple feature flags at once
   */
  async getFlags(flagNames: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      flagNames.map(async (name) => {
        results[name] = await this.isEnabled(name);
      })
    );

    return results;
  }

  /**
   * Get all active feature flags for the current environment
   */
  async getAllActiveFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await this.supabase
      .from('feature_flags')
      .select('*')
      .in('status', ['enabled', 'rollout'])
      .eq('environment', process.env.NODE_ENV || 'production')
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a specific feature flag
   */
  private async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(flagName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.flag;
    }

    const { data, error } = await this.supabase
      .from('feature_flags')
      .select('*')
      .eq('name', flagName)
      .eq('environment', process.env.NODE_ENV || 'production')
      .single();

    if (error || !data) {
      return null;
    }

    // Cache the result
    this.cache.set(flagName, { flag: data, timestamp: Date.now() });
    return data;
  }

  /**
   * Evaluate if a flag should be enabled based on its configuration
   */
  private async evaluateFlag(
    flag: FeatureFlag, 
    context: FeatureFlagEvaluationContext
  ): Promise<boolean> {
    // Check if flag is expired
    if (flag.expires_at && new Date(flag.expires_at) < new Date()) {
      return false;
    }

    // Check status
    if (flag.status === 'disabled' || flag.status === 'deprecated') {
      return false;
    }

    if (flag.status === 'enabled') {
      return true;
    }

    // Handle rollout strategy
    if (flag.status === 'rollout') {
      return this.evaluateRolloutStrategy(flag, context);
    }

    return false;
  }

  /**
   * Evaluate rollout strategy
   */
  private evaluateRolloutStrategy(
    flag: FeatureFlag, 
    context: FeatureFlagEvaluationContext
  ): boolean {
    switch (flag.rollout_strategy) {
      case 'all_users':
        return true;

      case 'admin_only':
        return context.isAdmin === true;

      case 'user_list':
        if (!flag.rollout_user_list || flag.rollout_user_list.length === 0) {
          return false;
        }
        return flag.rollout_user_list.includes(context.userId || '') ||
               flag.rollout_user_list.includes(context.email || '');

      case 'percentage':
        // Use consistent hashing based on user ID or session ID
        const identifier = context.userId || context.sessionId || 'anonymous';
        const hash = this.simpleHash(identifier + flag.name);
        const percentage = hash % 100;
        return percentage < flag.rollout_percentage;

      default:
        return false;
    }
  }

  /**
   * Simple hash function for consistent percentage rollouts
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Log feature flag analytics
   */
  private async logAnalytics(
    flagIdOrName: string,
    evaluated: boolean,
    enabled: boolean,
    context: FeatureFlagEvaluationContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('feature_flag_analytics')
        .insert({
          feature_flag_id: flagIdOrName,
          user_id: context.userId,
          session_id: context.sessionId,
          flag_evaluated: evaluated,
          flag_enabled: enabled,
          evaluation_context: {
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
            isAdmin: context.isAdmin,
            customAttributes: context.customAttributes
          }
        });
    } catch (error) {
      // Don't throw on analytics errors
      console.warn('Failed to log feature flag analytics:', error);
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Server-side feature flag service
 */
export class ServerFeatureFlagService {
  private supabase = createServerClient();

  /**
   * Check if a feature flag is enabled (server-side)
   */
  async isEnabled(
    flagName: string, 
    context: FeatureFlagEvaluationContext = {}
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('name', flagName)
        .eq('environment', process.env.NODE_ENV || 'production')
        .single();

      if (error || !data) {
        return false;
      }

      return this.evaluateFlag(data, context);
    } catch (error) {
      console.error(`Error evaluating server feature flag ${flagName}:`, error);
      return false;
    }
  }

  /**
   * Get all feature flags for admin interface
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await this.supabase
      .from('feature_flags')
      .select('*')
      .eq('environment', process.env.NODE_ENV || 'production')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch feature flags: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new feature flag
   */
  async createFlag(flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>): Promise<FeatureFlag> {
    const { data, error } = await this.supabase
      .from('feature_flags')
      .insert(flag)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create feature flag: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a feature flag
   */
  async updateFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const { data, error } = await this.supabase
      .from('feature_flags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update feature flag: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('feature_flags')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete feature flag: ${error.message}`);
    }
  }

  /**
   * Get feature flag analytics
   */
  async getAnalytics(flagId: string, days: number = 7): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('feature_flag_analytics')
      .select('*')
      .eq('feature_flag_id', flagId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    return data || [];
  }

  private evaluateFlag(flag: FeatureFlag, context: FeatureFlagEvaluationContext): boolean {
    // Same evaluation logic as client-side
    if (flag.expires_at && new Date(flag.expires_at) < new Date()) {
      return false;
    }

    if (flag.status === 'disabled' || flag.status === 'deprecated') {
      return false;
    }

    if (flag.status === 'enabled') {
      return true;
    }

    if (flag.status === 'rollout') {
      return this.evaluateRolloutStrategy(flag, context);
    }

    return false;
  }

  private evaluateRolloutStrategy(flag: FeatureFlag, context: FeatureFlagEvaluationContext): boolean {
    switch (flag.rollout_strategy) {
      case 'all_users':
        return true;
      case 'admin_only':
        return context.isAdmin === true;
      case 'user_list':
        if (!flag.rollout_user_list || flag.rollout_user_list.length === 0) {
          return false;
        }
        return flag.rollout_user_list.includes(context.userId || '') ||
               flag.rollout_user_list.includes(context.email || '');
      case 'percentage':
        const identifier = context.userId || context.sessionId || 'anonymous';
        const hash = this.simpleHash(identifier + flag.name);
        const percentage = hash % 100;
        return percentage < flag.rollout_percentage;
      default:
        return false;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Singleton instances
export const featureFlags = new FeatureFlagService();
export const serverFeatureFlags = new ServerFeatureFlagService();

// React hook for client-side feature flag usage
export function useFeatureFlag(flagName: string, context?: FeatureFlagEvaluationContext) {
  const [isEnabled, setIsEnabled] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        const enabled = await featureFlags.isEnabled(flagName, context);
        if (mounted) {
          setIsEnabled(enabled);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error checking feature flag ${flagName}:`, error);
        if (mounted) {
          setIsEnabled(false);
          setIsLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagName, context]);

  return { isEnabled, isLoading };
}

// Import React for the hook
import React from 'react';