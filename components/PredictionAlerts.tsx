'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  confidence: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  pick: string;
  actedOn: boolean;
  viewed: boolean;
  outcome: string | null;
}

export default function PredictionAlerts() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ alerts: Alert[]; count: number }>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts/pending');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const actOnAlert = useMutation({
    mutationFn: async ({ alertId, actedOn }: { alertId: string; actedOn: boolean }) => {
      const response = await fetch('/api/alerts/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, actedOn }),
      });
      if (!response.ok) throw new Error('Failed to update alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleActOn = (alertId: string, actedOn: boolean) => {
    actOnAlert.mutate({ alertId, actedOn });
  };

  if (isLoading) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>High-Confidence Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  const alerts = data?.alerts || [];
  const pendingAlerts = alerts.filter((a) => !a.actedOn);

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <span>High-Confidence Picks</span>
          </div>
          {pendingAlerts.length > 0 && (
            <Badge className="bg-orange-600/20 text-orange-400">
              {pendingAlerts.length} New
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No high-confidence picks available</p>
            <p className="text-sm mt-1">Check back when new predictions are made</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all ${
                  alert.actedOn
                    ? 'bg-white/5 border-white/5'
                    : 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 hover:border-green-500/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className="bg-orange-600/20 text-orange-400 text-xs">
                        {alert.confidence.toFixed(1)}%
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          alert.confidence >= 85
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-blue-600/20 text-blue-400'
                        }`}
                      >
                        {alert.sport}
                      </Badge>
                      {alert.actedOn && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <h4 className="text-white font-semibold text-sm">{alert.title}</h4>
                  </div>
                </div>

                {/* Game Info */}
                <div className="mb-3">
                  <p className="text-gray-300 text-sm font-medium">
                    {alert.homeTeam} vs {alert.awayTeam}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {format(new Date(alert.gameTime), 'EEE, MMM d · h:mm a')}
                  </p>
                </div>

                {/* Pick */}
                <div className="mb-3 p-2 bg-white/5 rounded">
                  <p className="text-sm text-gray-400">Recommended Pick:</p>
                  <p className="text-green-400 font-bold">{alert.pick}</p>
                </div>

                {/* Actions */}
                {!alert.actedOn && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleActOn(alert.id, true)}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded text-sm font-semibold transition-colors"
                    >
                      ✓ Placed Bet
                    </button>
                    <button
                      onClick={() => handleActOn(alert.id, false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-2 rounded text-sm transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {alert.actedOn && alert.outcome && (
                  <div
                    className={`text-center py-2 rounded text-sm font-semibold ${
                      alert.outcome === 'won'
                        ? 'bg-green-500/20 text-green-400'
                        : alert.outcome === 'lost'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {alert.outcome === 'won' ? '✓ Won' : alert.outcome === 'lost' ? '✗ Lost' : 'Push'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="mt-4 text-center">
            <a
              href="/accuracy"
              className="text-green-400 hover:text-green-300 text-sm font-semibold inline-flex items-center space-x-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Accuracy Tracker →</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
