'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import Link from 'next/link';

interface LineMovementAlert {
  id: string;
  gameId: string;
  externalGameId: string | null;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  openingLine: number | null;
  currentLine: number | null;
  movement: number | null;
  movementPercent: number | null;
  read: boolean;
  createdAt: string;
}

export default function LineMovementAlerts() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['line-movement-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/odds/alerts?limit=5');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const alerts: LineMovementAlert[] = data?.alerts || [];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Line Movement Alerts</h2>
        </div>
        <div className="text-center py-8 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-2">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Line Movement Alerts</h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No recent line movements detected</p>
          <p className="text-sm text-slate-500 mt-1">
            Alerts will appear when significant line changes are detected
          </p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'steam_move':
        return <Zap className="w-4 h-4" />;
      case 'significant_move':
        return <TrendingUp className="w-4 h-4" />;
      case 'reverse_line':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString();
  };

  const markAsRead = async (alertId: string) => {
    await fetch('/api/odds/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    });
    refetch();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Line Movement Alerts</h2>
        </div>
        <span className="text-xs text-slate-400">
          Live • Updates every 5min
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`
              relative rounded-lg border p-4 transition-all cursor-pointer
              ${getSeverityColor(alert.severity)}
              ${alert.read ? 'opacity-60' : 'opacity-100'}
              hover:scale-[1.02] hover:shadow-lg
            `}
            onClick={() => !alert.read && markAsRead(alert.id)}
          >
            {/* Severity Badge */}
            <div className="absolute top-2 right-2">
              <span className={`
                text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                ${alert.severity === 'critical' ? 'bg-red-500 text-white' : ''}
                ${alert.severity === 'high' ? 'bg-orange-500 text-white' : ''}
                ${alert.severity === 'medium' ? 'bg-yellow-500 text-black' : ''}
                ${alert.severity === 'low' ? 'bg-blue-500 text-white' : ''}
              `}>
                {alert.severity}
              </span>
            </div>

            {/* Alert Content */}
            <div className="space-y-2">
              {/* Type & Sport */}
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {alert.sport} • {alert.type.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Matchup */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {alert.awayTeam} @ {alert.homeTeam}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(alert.gameTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Movement */}
                {alert.movement !== null && (
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      alert.movement > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {alert.movement > 0 ? '+' : ''}{alert.movement.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {alert.openingLine} → {alert.currentLine}
                    </p>
                  </div>
                )}
              </div>

              {/* Alert Message */}
              <div className={`
                p-2 rounded text-xs
                ${getSeverityColor(alert.severity)}
              `}>
                <p className="font-medium">{alert.title}</p>
                <p className="text-slate-300 mt-0.5">{alert.message}</p>
              </div>

              {/* Time & Action */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {formatTimeAgo(alert.createdAt)}
                </span>
                <Link
                  href={`/games/${alert.externalGameId || alert.gameId}`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Game →
                </Link>
              </div>
            </div>

            {/* Unread Indicator */}
            {!alert.read && (
              <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <Link
          href="/line-movements"
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors"
        >
          View All Line Movements
          <TrendingUp className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
