'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface OddsMovementProps {
  gameId: string;
}

export default function OddsMovement({ gameId }: OddsMovementProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['odds-history', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/odds/history?gameId=${gameId}&hours=24`);
      if (!response.ok) throw new Error('Failed to fetch odds history');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getMovementIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <span className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-white">Odds Movement</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success || !data?.history || data.history.length === 0) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-white">Odds Movement</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400">No odds history available yet</p>
            <p className="text-sm text-gray-500 mt-1">Data will appear as odds are collected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform API data for chart
  const oddsHistory = data.history.map((item: any) => {
    const time = new Date(item.timestamp);
    return {
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      spread: item.spread || 0,
      moneyline: item.homeML || 0,
      total: item.total || 0,
      timestamp: item.timestamp,
    };
  });

  const currentOdds = oddsHistory[oddsHistory.length - 1];
  const previousOdds = oddsHistory[oddsHistory.length - 2] || currentOdds;

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-white">Odds Movement</CardTitle>
          </div>
          <span className="text-xs text-gray-400">Last 24 hours</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Odds Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Spread</span>
              {getMovementIndicator(currentOdds.spread, previousOdds.spread)}
            </div>
            <p className="text-lg font-bold text-white">{currentOdds.spread}</p>
            <p className="text-xs text-gray-500">
              {previousOdds.spread > currentOdds.spread ? '↓' : previousOdds.spread < currentOdds.spread ? '↑' : '–'}
              {' '}
              {Math.abs(currentOdds.spread - previousOdds.spread).toFixed(1)}
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Moneyline</span>
              {getMovementIndicator(currentOdds.moneyline, previousOdds.moneyline)}
            </div>
            <p className="text-lg font-bold text-white">{currentOdds.moneyline}</p>
            <p className="text-xs text-gray-500">
              {previousOdds.moneyline > currentOdds.moneyline ? '↓' : previousOdds.moneyline < currentOdds.moneyline ? '↑' : '–'}
              {' '}
              {Math.abs(currentOdds.moneyline - previousOdds.moneyline)}
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Total</span>
              {getMovementIndicator(currentOdds.total, previousOdds.total)}
            </div>
            <p className="text-lg font-bold text-white">{currentOdds.total}</p>
            <p className="text-xs text-gray-500">
              {previousOdds.total > currentOdds.total ? '↓' : previousOdds.total < currentOdds.total ? '↑' : '–'}
              {' '}
              {Math.abs(currentOdds.total - previousOdds.total).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Spread Movement Chart */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Spread Movement</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={oddsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '10px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="spread"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {data.movements && (data.movements.spread !== null || data.movements.total !== null) && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">📊 Movement Insights</h4>
            <ul className="space-y-1 text-xs text-gray-300">
              {data.movements.spread !== null && data.movements.spread !== 0 && (
                <li>
                  • Spread moved {Math.abs(data.movements.spread).toFixed(1)} points
                  {data.movements.spread > 0 ? ' (favoring home team)' : ' (favoring away team)'}
                </li>
              )}
              {data.movements.total !== null && data.movements.total !== 0 && (
                <li>
                  • Total moved {Math.abs(data.movements.total).toFixed(1)} points
                  {data.movements.total > 0 ? ' (higher)' : ' (lower)'}
                </li>
              )}
              {data.dataPoints && (
                <li>• Tracking {data.dataPoints} data points over last 24 hours</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

