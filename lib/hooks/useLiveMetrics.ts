'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveMetricsSnapshot } from '@/lib/live/live-metrics';
import type { Sport } from '@/lib/types';

interface LivePayload {
  league: Sport;
  metrics: LiveMetricsSnapshot[];
  updatedAt: string;
}

type MetricsMap = Record<string, LiveMetricsSnapshot['metrics']>;

function createEventSource(league: Sport) {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return null;
  }
  const url = `/api/live/games?league=${encodeURIComponent(league)}`;
  return new window.EventSource(url);
}

export function useLiveMetrics(league: Sport) {
  const [metrics, setMetrics] = useState<MetricsMap>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = createEventSource(league);
    if (!source) {
      return () => {};
    }
    sourceRef.current = source;

    const handleUpdate = (event: MessageEvent<string>) => {
      try {
        const payload: LivePayload = JSON.parse(event.data);
        const map: MetricsMap = {};
        for (const snapshot of payload.metrics) {
          map[snapshot.gameId] = snapshot.metrics;
        }
        setMetrics(map);
        setUpdatedAt(payload.updatedAt);
      } catch (error) {
        console.error('[useLiveMetrics] failed to parse update', error);
      }
    };

    source.addEventListener('update', handleUpdate as EventListener);

    return () => {
      source.removeEventListener('update', handleUpdate as EventListener);
      source.close();
      sourceRef.current = null;
    };
  }, [league]);

  return useMemo(() => ({ metrics, updatedAt }), [metrics, updatedAt]);
}

export function useLiveGameMetrics(gameId: string, league: Sport) {
  const { metrics } = useLiveMetrics(league);
  return metrics[gameId] ?? null;
}
