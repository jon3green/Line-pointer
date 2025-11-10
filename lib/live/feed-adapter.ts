import type { Sport } from '@/lib/types';

export type LiveFeedEventType =
  | 'play'
  | 'drive'
  | 'score'
  | 'injury'
  | 'timeout'
  | 'odds_update'
  | 'status';

export interface LiveFeedEventBase {
  eventId: string;
  gameId: string;
  league: Sport;
  receivedAt: string;
  provider?: string;
}

export interface PlayEvent extends LiveFeedEventBase {
  type: 'play';
  possession: 'home' | 'away';
  period: number;
  clock: string;
  down?: number;
  yardsToGo?: number;
  yardLine?: string;
  description: string;
  yardsGained?: number;
  playType?: string;
}

export interface DriveEvent extends LiveFeedEventBase {
  type: 'drive';
  driveId: string;
  startedAt: string;
  endedAt?: string;
  result?: string;
  plays: number;
  yards: number;
  team: 'home' | 'away';
}

export interface ScoreEvent extends LiveFeedEventBase {
  type: 'score';
  points: number;
  homeScore: number;
  awayScore: number;
  scorer?: string;
  description?: string;
}

export interface OddsUpdateEvent extends LiveFeedEventBase {
  type: 'odds_update';
  providerName: string;
  moneyline?: {
    home?: number;
    away?: number;
  };
  spread?: {
    home?: number;
    away?: number;
  };
  total?: {
    line?: number;
    over?: number;
    under?: number;
  };
}

export interface StatusEvent extends LiveFeedEventBase {
  type: 'status';
  status: 'scheduled' | 'live' | 'completed' | 'delayed';
  message?: string;
}

export type LiveFeedEvent =
  | PlayEvent
  | DriveEvent
  | ScoreEvent
  | OddsUpdateEvent
  | StatusEvent
  | (LiveFeedEventBase & { type: LiveFeedEventType });

export interface LiveFeedSubscriber {
  onEvent(event: LiveFeedEvent): Promise<void> | void;
  onError?(error: unknown): Promise<void> | void;
}

export interface LiveFeedAdapter {
  readonly provider: string;
  readonly sports: Sport[];

  start(subscriber: LiveFeedSubscriber): Promise<void>;
  stop(): Promise<void>;
}

export function createProviderKey(provider: string, league: Sport) {
  return `${provider}:${league}`;
}

const adapters = new Map<string, LiveFeedAdapter>();

export function registerLiveFeedAdapter(adapter: LiveFeedAdapter) {
  for (const league of adapter.sports) {
    adapters.set(createProviderKey(adapter.provider, league), adapter);
  }
}

export function getLiveFeedAdapter(provider: string, league: Sport) {
  return adapters.get(createProviderKey(provider, league)) ?? null;
}
