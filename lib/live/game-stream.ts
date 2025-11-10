import { fetchGames } from '@/lib/api/sports-data';
import type { Game, Sport } from '@/lib/types';
import { computeLiveMetrics, type LiveMetricsSnapshot } from './live-metrics';

type Listener = (payload: BroadcastPayload) => void;

interface BroadcastPayload {
  league: Sport;
  games: Game[];
  metrics: LiveMetricsSnapshot[];
  updatedAt: string;
}

const DEFAULT_INTERVAL = 10_000;

class GameStream {
  private listeners = new Set<Listener>();

  private timer: NodeJS.Timeout | null = null;

  private latestPayload: BroadcastPayload | null = null;

  private latestSignature = '';

  constructor(private readonly league: Sport, private readonly interval = DEFAULT_INTERVAL) {}

  private start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.interval);
    void this.tick();
  }

  private stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    try {
      const games = await fetchGames(this.league);
      const metrics = computeLiveMetrics(games);
      const signature = JSON.stringify(games.map((game) => ({
        id: game.id,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        updatedAt: game.date,
      })));

      if (signature === this.latestSignature && this.latestPayload) {
        return;
      }

      this.latestSignature = signature;
      this.latestPayload = {
        league: this.league,
        games,
        metrics,
        updatedAt: new Date().toISOString(),
      };

      for (const listener of this.listeners) {
        try {
          listener(this.latestPayload);
        } catch (error) {
          console.error('[game-stream] listener error', error);
        }
      }
    } catch (error) {
      console.error(`[game-stream] failed to fetch games for ${this.league}:`, error);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.start();

    if (this.latestPayload) {
      try {
        listener(this.latestPayload);
      } catch (error) {
        console.error('[game-stream] initial listener error', error);
      }
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __gameStreamRegistry: Map<Sport, GameStream> | undefined;
}

const registry: Map<Sport, GameStream> = globalThis.__gameStreamRegistry ?? new Map();
if (!globalThis.__gameStreamRegistry) {
  globalThis.__gameStreamRegistry = registry;
}

export function getGameStream(league: Sport, interval = DEFAULT_INTERVAL) {
  if (!registry.has(league)) {
    registry.set(league, new GameStream(league, interval));
  }
  return registry.get(league)!;
}
