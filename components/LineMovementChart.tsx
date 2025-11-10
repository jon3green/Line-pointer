'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { useMemo } from 'react';

interface LineMovementChartProps {
  gameId: string;
  type?: 'spread' | 'total' | 'moneyline';
  showBookmakers?: boolean;
}

interface OddsSnapshot {
  id: string;
  timestamp: string;
  bookmaker: string;
  spread?: number | null;
  total?: number | null;
  homeML?: number | null;
  awayML?: number | null;
  isSignificantMove: boolean;
  isSteamMove: boolean;
  isRLM: boolean;
  sharpMoney: boolean;
}

interface OddsHistory {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  snapshots: OddsSnapshot[];
  summary: {
    totalSnapshots: number;
    bookmakers: string[];
    spreadMovement: number;
    totalMovement: number;
    significantMoves: number;
    steamMoves: number;
    volatilityScore: number;
  };
}

export default function LineMovementChart({
  gameId,
  type = 'spread',
  showBookmakers = false,
}: LineMovementChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['odds-history', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/odds/history/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch odds history');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const oddsHistory: OddsHistory | undefined = data?.data;

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!oddsHistory || oddsHistory.snapshots.length === 0) return [];

    // Group by timestamp and aggregate
    const byTimestamp = new Map<string, any>();

    oddsHistory.snapshots.forEach((snapshot) => {
      const timestamp = new Date(snapshot.timestamp).getTime();
      const key = timestamp.toString();

      if (!byTimestamp.has(key)) {
        byTimestamp.set(key, {
          timestamp,
          formattedTime: new Date(snapshot.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          count: 0,
          isSteamMove: false,
          isSignificantMove: false,
        });
      }

      const entry = byTimestamp.get(key);
      entry.count++;

      // Aggregate by bookmaker if showing multiple
      if (showBookmakers) {
        if (type === 'spread' && snapshot.spread !== null) {
          entry[`${snapshot.bookmaker}_spread`] = snapshot.spread;
        } else if (type === 'total' && snapshot.total !== null) {
          entry[`${snapshot.bookmaker}_total`] = snapshot.total;
        } else if (type === 'moneyline' && snapshot.homeML !== null) {
          entry[`${snapshot.bookmaker}_ml`] = snapshot.homeML;
        }
      } else {
        // Average across bookmakers
        if (type === 'spread' && snapshot.spread !== null) {
          entry.value = entry.value
            ? (entry.value + snapshot.spread) / 2
            : snapshot.spread;
        } else if (type === 'total' && snapshot.total !== null) {
          entry.value = entry.value
            ? (entry.value + snapshot.total) / 2
            : snapshot.total;
        } else if (type === 'moneyline' && snapshot.homeML !== null) {
          entry.value = entry.value
            ? (entry.value + snapshot.homeML) / 2
            : snapshot.homeML;
        }
      }

      // Mark special events
      if (snapshot.isSteamMove) entry.isSteamMove = true;
      if (snapshot.isSignificantMove) entry.isSignificantMove = true;
    });

    return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [oddsHistory, type, showBookmakers]);

  // Calculate opening line for reference
  const openingLine = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    return chartData[0].value;
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !oddsHistory) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Unable to load line movement data</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No line movement data available yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Data will appear after odds collection begins
          </p>
        </div>
      </div>
    );
  }

  const { summary } = oddsHistory;
  const movement = type === 'spread' ? summary.spreadMovement : summary.totalMovement;
  const isMovingUp = movement > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Line Movement - {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {oddsHistory.awayTeam} @ {oddsHistory.homeTeam}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-bold ${
              isMovingUp ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isMovingUp ? '+' : ''}
            {movement.toFixed(1)}
          </div>
          <p className="text-xs text-slate-400">Total Movement</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400">Snapshots</div>
          <div className="text-lg font-bold text-white">{summary.totalSnapshots}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400">Significant Moves</div>
          <div className="text-lg font-bold text-orange-400">
            {summary.significantMoves}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Steam Moves
          </div>
          <div className="text-lg font-bold text-red-400">{summary.steamMoves}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400">Volatility</div>
          <div className="text-lg font-bold text-yellow-400">
            {summary.volatilityScore}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

            <XAxis
              dataKey="formattedTime"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              domain={['auto', 'auto']}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#fff' }}
            />

            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
              iconType="line"
            />

            {/* Opening line reference */}
            {openingLine !== null && (
              <ReferenceLine
                y={openingLine}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{
                  value: 'Opening',
                  fill: '#64748b',
                  fontSize: 12,
                }}
              />
            )}

            {/* Gradient area under line */}
            <Area
              type="monotone"
              dataKey="value"
              fill="url(#lineGradient)"
              stroke="none"
            />

            {/* Main line */}
            {showBookmakers ? (
              // Show individual bookmaker lines
              summary.bookmakers.map((bookmaker, idx) => (
                <Line
                  key={bookmaker}
                  type="monotone"
                  dataKey={`${bookmaker}_${type === 'spread' ? 'spread' : type === 'total' ? 'total' : 'ml'}`}
                  name={bookmaker}
                  stroke={['#3b82f6', '#10b981', '#f59e0b'][idx % 3]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                name="Line"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isSteamMove) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }
                  if (payload.isSignificantMove) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />;
                }}
                activeDot={{ r: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for dots */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Significant Move</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Steam Move</span>
        </div>
      </div>
    </div>
  );
}
