"use client";

import { useState, useEffect, useCallback } from 'react';
import type { LicenseStatusResponse } from '@/lib/license-service';

interface UseLicenseStatusReturn {
  status: LicenseStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLicenseStatus(): UseLicenseStatusReturn {
  const [status, setStatus] = useState<LicenseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/license/status');
      if (res.ok) {
        setStatus(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.reason || 'Falha ao buscar status');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
