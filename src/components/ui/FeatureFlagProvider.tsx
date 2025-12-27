/**
 * Feature Flag Provider Component
 * Provides feature flag context throughout the application
 * Requirements: 9.1, 9.4
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { featureFlags, FeatureFlagEvaluationContext } from '@/lib/feature-flags';

interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  checkFlag: (flagName: string, context?: FeatureFlagEvaluationContext) => Promise<boolean>;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialFlags?: string[];
  context?: FeatureFlagEvaluationContext;
}

export function FeatureFlagProvider({ 
  children, 
  initialFlags = [], 
  context = {} 
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadFlags = async (flagNames: string[]) => {
    try {
      const flagResults = await featureFlags.getFlags(flagNames);
      setFlags(prev => ({ ...prev, ...flagResults }));
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  };

  const checkFlag = async (flagName: string, flagContext?: FeatureFlagEvaluationContext) => {
    const mergedContext = { ...context, ...flagContext };
    const enabled = await featureFlags.isEnabled(flagName, mergedContext);
    setFlags(prev => ({ ...prev, [flagName]: enabled }));
    return enabled;
  };

  const refreshFlags = async () => {
    setIsLoading(true);
    featureFlags.clearCache();
    await loadFlags(Object.keys(flags));
    setIsLoading(false);
  };

  useEffect(() => {
    const initializeFlags = async () => {
      if (initialFlags.length > 0) {
        await loadFlags(initialFlags);
      }
      setIsLoading(false);
    };

    initializeFlags();
  }, [initialFlags]);

  const value: FeatureFlagContextType = {
    flags,
    isLoading,
    checkFlag,
    refreshFlags
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

export function useFeatureFlag(flagName: string, context?: FeatureFlagEvaluationContext) {
  const { flags, checkFlag } = useFeatureFlags();
  const [isEnabled, setIsEnabled] = useState<boolean>(flags[flagName] || false);
  const [isLoading, setIsLoading] = useState<boolean>(!(flagName in flags));

  useEffect(() => {
    if (flagName in flags) {
      setIsEnabled(flags[flagName]);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      checkFlag(flagName, context).then(enabled => {
        setIsEnabled(enabled);
        setIsLoading(false);
      });
    }
  }, [flagName, flags, checkFlag, context]);

  return { isEnabled, isLoading };
}