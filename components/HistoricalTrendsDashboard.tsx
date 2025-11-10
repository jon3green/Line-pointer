'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Award,
  Flame,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface HistoricalTrendsDashboardProps {
  defaultPeriod?: 'week' | 'month' | 'season' | 'all';
  defaultSport?: 'NFL' | 'NCAAF' | null;
}

export default function HistoricalTrendsDashboard({
  defaultPeriod = 'month',
  defaultSport = null,
}: HistoricalTrendsDashboardProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [sport, setSport] = useState<string | null>(defaultSport);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-trends', period, sport],
    queryFn: async () => {
      const url = `/api/analytics/trends?period=${period}${sport ? `&sport=${sport}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const analytics = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.overview.totalPredictions === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-8">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Historical Data</h3>
          <p className="text-slate-400">
            Analytics will appear once predictions have been completed
          </p>
        </div>
      </div>
    );
  }

  const { overview, trends, sportBreakdown, streak } = analytics;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Performance Analytics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Historical trends and accuracy metrics
          </p>
        </div>

        <div className="flex gap-2">
          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="season">This Season</option>
            <option value="all">All Time</option>
          </select>

          {/* Sport Filter */}
          <select
            value={sport || 'all'}
            onChange={(e) => setSport(e.target.value === 'all' ? null : e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Sports</option>
            <option value="NFL">NFL</option>
            <option value="NCAAF">NCAAF</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Accuracy */}
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-800 rounded-xl border border-blue-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-slate-400">Overall Accuracy</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {overview.overallAccuracy}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {overview.correctPredictions}/{overview.totalPredictions} correct
          </div>
        </div>

        {/* Spread Accuracy */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800 rounded-xl border border-emerald-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <div className="text-xs text-slate-400">Spread Accuracy</div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {overview.spreadAccuracy}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ATS performance
          </div>
        </div>

        {/* High Confidence */}
        <div className="bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-xl border border-purple-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <div className="text-xs text-slate-400">High Confidence</div>
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {overview.highConfAccuracy}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            70%+ confidence picks
          </div>
        </div>

        {/* Current Streak */}
        <div className={`bg-gradient-to-br rounded-xl border p-4 ${
          streak.type === 'win'
            ? 'from-green-900/30 to-slate-800 border-green-700/50'
            : 'from-red-900/30 to-slate-800 border-red-700/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${streak.type === 'win' ? 'text-green-400' : 'text-red-400'}`} />
            <div className="text-xs text-slate-400">Current Streak</div>
          </div>
          <div className={`text-3xl font-bold ${streak.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
            {streak.current}{streak.type === 'win' ? 'W' : 'L'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {streak.type === 'win' ? 'Wins' : 'Losses'} in a row
          </div>
        </div>
      </div>

      {/* Accuracy Trends Chart */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Accuracy Trends Over Time
        </h3>

        {trends && trends.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="week"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString();
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, '']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{ value: 'Break Even', fill: '#64748b', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Overall Accuracy"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="spreadAccuracy"
                  name="Spread Accuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Not enough data to display trends
          </div>
        )}
      </div>

      {/* Bottom Grid - CLV and Sport Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CLV Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Closing Line Value
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Average CLV</span>
                <span className={`text-xl font-bold ${
                  overview.avgCLV >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {overview.avgCLV >= 0 ? '+' : ''}{overview.avgCLV.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${overview.avgCLV >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{
                    width: `${Math.min(100, Math.abs(overview.avgCLV) * 20)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Beat Close Rate</span>
                <span className="text-xl font-bold text-white">
                  {overview.beatCloseRate}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${overview.beatCloseRate}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-900/10 border border-emerald-700/30 rounded-lg">
              <p className="text-xs text-emerald-300/80">
                {overview.avgCLV >= 0
                  ? '✓ Positive CLV indicates profitable line shopping'
                  : '⚠ Negative CLV suggests betting into worse lines'}
              </p>
            </div>
          </div>
        </div>

        {/* Sport Breakdown */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Sport Breakdown
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(sportBreakdown).map(([sport, data]: [string, any]) => ({
                  sport,
                  accuracy: data.accuracy,
                  total: data.total,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="sport" stroke="#64748b" style={{ fontSize: '14px' }} />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value.toFixed(1)}% (${props.payload.total} games)`,
                    'Accuracy',
                  ]}
                />
                <Bar
                  dataKey="accuracy"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Accuracy</div>
          <div className="text-2xl font-bold text-yellow-400">
            {overview.totalAccuracy}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Over/Under picks</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Moneyline Accuracy</div>
          <div className="text-2xl font-bold text-blue-400">
            {overview.mlAccuracy}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Straight up picks</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Predictions</div>
          <div className="text-2xl font-bold text-white">
            {overview.totalPredictions}
          </div>
          <div className="text-xs text-slate-400 mt-1">Games analyzed</div>
        </div>
      </div>
    </div>
  );
}
