/**
 * Feature Flag Wrapper Component
 * Conditionally renders children based on feature flag status
 * Requirements: 9.1, 9.4
 */

'use client';

import React from 'react';
import { useFeatureFlag } from './FeatureFlagProvider';
import { FeatureFlagEvaluationContext } from '@/lib/feature-flags';

interface FeatureFlagProps {
  flag: string;
  context?: FeatureFlagEvaluationContext;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureFlag({ 
  flag, 
  context, 
  fallback = null, 
  loading = null, 
  children 
}: FeatureFlagProps) {
  const { isEnabled, isLoading } = useFeatureFlag(flag, context);

  if (isLoading) {
    return <>{loading}</>;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

interface FeatureFlagGateProps {
  flags: string[];
  mode?: 'all' | 'any'; // 'all' requires all flags to be enabled, 'any' requires at least one
  context?: FeatureFlagEvaluationContext;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureFlagGate({ 
  flags, 
  mode = 'all', 
  context, 
  fallback = null, 
  loading = null, 
  children 
}: FeatureFlagGateProps) {
  const flagResults = flags.map(flag => useFeatureFlag(flag, context));
  
  const isLoading = flagResults.some(result => result.isLoading);
  const enabledFlags = flagResults.filter(result => result.isEnabled).length;
  
  if (isLoading) {
    return <>{loading}</>;
  }

  const shouldRender = mode === 'all' 
    ? enabledFlags === flags.length 
    : enabledFlags > 0;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

// Higher-order component for feature flag wrapping
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: string,
  context?: FeatureFlagEvaluationContext,
  fallback?: React.ComponentType<P>
) {
  return function FeatureFlagWrappedComponent(props: P) {
    const { isEnabled, isLoading } = useFeatureFlag(flag, context);

    if (isLoading) {
      return null; // or a loading component
    }

    if (!isEnabled) {
      return fallback ? <fallback {...props} /> : null;
    }

    return <Component {...props} />;
  };
}