'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface OddsMovementProps {
  gameId: string;
}

export default function OddsMovement({ gameId }: OddsMovementProps) {
  // Mock odds history data - in production, fetch from API
  const oddsHistory = [
    { time: '10:00 AM', spread: -3.5, moneyline: -165, total: 47.5 },
    { time: '11:00 AM', spread: -3.0, moneyline: -155, total: 47.5 },
    { time: '12:00 PM', spread: -3.5, moneyline: -160, total: 48.0 },
    { time: '1:00 PM', spread: -4.0, moneyline: -170, total: 48.0 },
    { time: '2:00 PM', spread: -4.0, moneyline: -165, total: 47.5 },
    { time: 'Now', spread: -3.5, moneyline: -165, total: 47.5 },
  ];

  const getMovementIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <span className="w-4 h-4" />;
  };

  const currentOdds = oddsHistory[oddsHistory.length - 1];
  const previousOdds = oddsHistory[oddsHistory.length - 2];

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
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">📊 Movement Insights</h4>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• Spread moved from -4.0 to -3.5 (favoring away team)</li>
            <li>• 65% of bets on home team, but line moving away</li>
            <li>• Sharp money appears to be on the away team</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

