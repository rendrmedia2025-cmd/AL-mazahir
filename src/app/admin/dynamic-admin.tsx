/**
 * Dynamic admin component loader
 * Implements code splitting for admin features to reduce main bundle size
 */

'use client';

import { Suspense } from 'react';
import { LazyAdminPanel, AdminLoadingFallback } from '@/lib/lazy-loading';

export default function DynamicAdminPanel() {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <LazyAdminPanel />
    </Suspense>
  );
}