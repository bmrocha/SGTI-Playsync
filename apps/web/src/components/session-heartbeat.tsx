'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export function SessionHeartbeat() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await fetch('/api/auth/heartbeat', { method: 'POST' });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    }, 60 * 1000); // Every 1 minute

    // Initial call
    fetch('/api/auth/heartbeat', { method: 'POST' }).catch(() => {});

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
}
