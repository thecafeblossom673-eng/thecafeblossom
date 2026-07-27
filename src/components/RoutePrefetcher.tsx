'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PREFETCH_ROUTES = [
  '/admin',
  '/inventory',
  '/order',
  '/offers',
  '/history',
];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all key routes in background immediately after page mount
    const timer = setTimeout(() => {
      PREFETCH_ROUTES.forEach(route => {
        try {
          router.prefetch(route);
        } catch (e) {
          // Ignore prefetch failures gracefully
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
