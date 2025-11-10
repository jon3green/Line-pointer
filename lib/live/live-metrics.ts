import type { Game } from '@/lib/types';

export interface LiveGameMetrics {
  homeWinProbability: number;
  awayWinProbability: number;
  projectedSpread: number;
  projectedTotal: number;
  confidence: 'low' | 'medium' | 'high';
  driveSummary?: string;
}

export interface LiveMetricsSnapshot {
  gameId: string;
  metrics: LiveGameMetrics;
}

function normalizeClock(game: Game) {
  if (game.status !== 'live') {
    return {
      period: 4,
      secondsRemaining: 3600,
    };
  }

  const periodMatch = (game as any)?.statusText?.match?.(/Q(\d)/);
  const period = periodMatch ? Number(periodMatch[1]) : 4;

  const clockText: string | undefined = (game as any)?.clock;
  if (!clockText || !clockText.includes(':')) {
    return {
      period,
      secondsRemaining: Math.max(0, (4 - period) * 900),
    };
  }

  const [minutesRaw, secondsRaw] = clockText.split(':');
  const minutes = Number(minutesRaw);
  const seconds = Number(secondsRaw);
  const secondsRemaining = Math.max(0, (4 - period) * 900 + minutes * 60 + seconds);

  return {
    period,
    secondsRemaining,
  };
}

function estimateWinProbability(game: Game): LiveGameMetrics {
  const { secondsRemaining } = normalizeClock(game);
  const totalSeconds = 4 * 900;
  const timeRatio = secondsRemaining / totalSeconds;

  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const scoreDiff = homeScore - awayScore;

  const baseSpread = game.odds?.spread?.home ?? 0;
  const baseTotal = game.odds?.total?.line ?? 45;

  const spreadAdjustment = scoreDiff - baseSpread;
  const spreadVolatility = Math.max(1, Math.abs(spreadAdjustment));
  const timeFactor = Math.max(0.05, Math.pow(timeRatio, 0.75));

  const winProbability = 1 / (1 + Math.exp(-0.35 * spreadAdjustment / Math.max(1, timeFactor * 5)));
  const homeWinProbability = Math.min(0.99, Math.max(0.01, winProbability));
  const awayWinProbability = 1 - homeWinProbability;

  const projectedSpread = scoreDiff + baseSpread * timeRatio;
  const projectedTotal = homeScore + awayScore + baseTotal * timeRatio;

  const confidence = spreadVolatility > 10
    ? 'low'
    : spreadVolatility > 5
      ? 'medium'
      : 'high';

  let driveSummary: string | undefined;
  const possession = (game as any)?.possession as string | undefined;
  const downDistance = (game as any)?.downDistanceText as string | undefined;
  if (possession && downDistance) {
    driveSummary = `${possession} ball – ${downDistance}`;
  }

  return {
    homeWinProbability,
    awayWinProbability,
    projectedSpread,
    projectedTotal,
    confidence,
    driveSummary,
  };
}

export function computeLiveMetrics(games: Game[]): LiveMetricsSnapshot[] {
  return games.map((game) => ({
    gameId: game.id,
    metrics: estimateWinProbability(game),
  }));
}
