'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

interface CLVMetricsProps {
  sport?: 'NFL' | 'NCAAF' | 'all';
  compact?: boolean;
}

interface CLVData {
  totalPredictions: number;
  avgSpreadCLV: number;
  avgTotalCLV: number;
  beatCloseRate: number;
  beatCloseWinRate: number;
  spreadCLVDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function CLVMetrics({ sport = 'all', compact = false }: CLVMetricsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['clv-metrics', sport],
    queryFn: async () => {
      const url = sport === 'all'
        ? '/api/clv/metrics'
        : `/api/clv/metrics?sport=${sport}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch CLV metrics');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const metrics: CLVData | undefined = data?.data;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.totalPredictions === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Closing Line Value (CLV)</h3>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No CLV data available yet</p>
          <p className="text-sm text-slate-500 mt-1">
            CLV metrics will appear after games complete
          </p>
        </div>
      </div>
    );
  }

  // Determine CLV quality rating
  const getCLVRating = (avgCLV: number) => {
    if (avgCLV >= 1.0) return { label: 'Excellent', color: 'text-green-400' };
    if (avgCLV >= 0.5) return { label: 'Good', color: 'text-emerald-400' };
    if (avgCLV >= 0) return { label: 'Average', color: 'text-yellow-400' };
    if (avgCLV >= -0.5) return { label: 'Below Average', color: 'text-orange-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const spreadRating = getCLVRating(metrics.avgSpreadCLV);
  const beatCloseRating = getCLVRating(metrics.beatCloseRate - 50); // 50% is break-even

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/20 to-slate-800/50 rounded-lg border border-emerald-700/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">CLV Performance</div>
            <div className="text-xl font-bold text-emerald-400">
              {metrics.avgSpreadCLV >= 0 ? '+' : ''}
              {metrics.avgSpreadCLV.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">Beat Close Rate</div>
            <div className="text-xl font-bold text-white">
              {metrics.beatCloseRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Closing Line Value (CLV)</h3>
        </div>
        <div className="text-xs text-slate-400">
          {metrics.totalPredictions} predictions
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Average Spread CLV */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-xs text-slate-400">Avg Spread CLV</div>
          </div>
          <div className={`text-2xl font-bold ${spreadRating.color}`}>
            {metrics.avgSpreadCLV >= 0 ? '+' : ''}
            {metrics.avgSpreadCLV.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{spreadRating.label}</div>
        </div>

        {/* Beat Close Rate */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-slate-400">Beat Close Rate</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.beatCloseRate.toFixed(1)}%
          </div>
          <div className={`text-xs ${beatCloseRating.color} mt-1`}>
            {beatCloseRating.label}
          </div>
        </div>

        {/* Average Total CLV */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <div className="text-xs text-slate-400">Avg Total CLV</div>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {metrics.avgTotalCLV >= 0 ? '+' : ''}
            {metrics.avgTotalCLV.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Points</div>
        </div>

        {/* Win Rate When Beating Close */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <div className="text-xs text-slate-400">Beat Close Win Rate</div>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {metrics.beatCloseWinRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            When ahead of market
          </div>
        </div>
      </div>

      {/* CLV Distribution */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <div className="text-xs font-semibold text-slate-300 mb-3">
          Spread CLV Distribution
        </div>
        <div className="flex gap-2 h-8 rounded overflow-hidden">
          {/* Positive CLV */}
          <div
            className="bg-green-500 flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{
              width: `${
                (metrics.spreadCLVDistribution.positive /
                  metrics.totalPredictions) *
                100
              }%`,
            }}
            title={`${metrics.spreadCLVDistribution.positive} positive`}
          >
            {metrics.spreadCLVDistribution.positive > 0 &&
              `${metrics.spreadCLVDistribution.positive}`}
          </div>

          {/* Neutral CLV */}
          {metrics.spreadCLVDistribution.neutral > 0 && (
            <div
              className="bg-slate-600 flex items-center justify-center text-xs font-bold text-white transition-all"
              style={{
                width: `${
                  (metrics.spreadCLVDistribution.neutral /
                    metrics.totalPredictions) *
                  100
                }%`,
              }}
              title={`${metrics.spreadCLVDistribution.neutral} neutral`}
            >
              {metrics.spreadCLVDistribution.neutral}
            </div>
          )}

          {/* Negative CLV */}
          <div
            className="bg-red-500 flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{
              width: `${
                (metrics.spreadCLVDistribution.negative /
                  metrics.totalPredictions) *
                100
              }%`,
            }}
            title={`${metrics.spreadCLVDistribution.negative} negative`}
          >
            {metrics.spreadCLVDistribution.negative > 0 &&
              `${metrics.spreadCLVDistribution.negative}`}
          </div>
        </div>

        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            Positive
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-600 rounded"></div>
            Neutral
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            Negative
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-emerald-900/10 border border-emerald-700/30 rounded-lg">
        <p className="text-xs text-emerald-300/80">
          <strong>What is CLV?</strong> Closing Line Value measures if you got better odds
          than the final line before the game. Consistently positive CLV is the #1
          indicator of long-term betting profitability.
        </p>
      </div>
    </div>
  );
}
