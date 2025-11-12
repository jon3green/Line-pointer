'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, DollarSign, Activity, Trophy, Calendar } from 'lucide-react';
import { formatOdds } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['pick-stats'],
    queryFn: async () => {
      const response = await fetch('/api/picks/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!session,
  });

  const { data: picksData, isLoading: picksLoading } = useQuery({
    queryKey: ['picks'],
    queryFn: async () => {
      const response = await fetch('/api/picks?limit=20');
      if (!response.ok) throw new Error('Failed to fetch picks');
      return response.json();
    },
    enabled: !!session,
  });

  if (status === 'loading' || statsLoading || picksLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const stats = statsData?.stats || {};
  const picks = picksData?.picks || [];

  return (
    <main className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-gray-400">Track your picks and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.winRate || 0}%
                </span>
              </div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.wonBets || 0}-{stats.lostBets || 0}-{stats.pushedBets || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Total Profit</p>
              <p className="text-xs text-gray-500 mt-1">
                ${stats.totalStaked || 0} staked
              </p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.roi >= 0 ? '+' : ''}{stats.roi || 0}%
                </span>
              </div>
              <p className="text-sm text-gray-400">ROI</p>
              <p className="text-xs text-gray-500 mt-1">Return on investment</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {stats.bestStreak || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Best Streak</p>
              <p className="text-xs text-gray-500 mt-1">Current: {stats.currentStreak || 0}</p>
            </CardContent>
          </Card>
        </div>

        {stats.recentForm && stats.recentForm.length > 0 && (
          <Card className="glass-morphism border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Recent Form</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {stats.recentForm.map((result: string, index: number) => (
                  <div
                    key={index}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      result === 'won'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : result === 'lost'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    }`}
                  >
                    {result === 'won' ? 'W' : result === 'lost' ? 'L' : 'P'}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Recent Picks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {picks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No picks yet</p>
                <p className="text-sm text-gray-500 mt-2">Start tracking your bets from the games page</p>
              </div>
            ) : (
              <div className="space-y-4">
                {picks.map((pick: any) => (
                  <div key={pick.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">{pick.sport}</Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            pick.status === 'won' ? 'border-green-500/50 text-green-400' :
                            pick.status === 'lost' ? 'border-red-500/50 text-red-400' :
                            pick.status === 'pending' ? 'border-blue-500/50 text-blue-400' :
                            'border-gray-500/50 text-gray-400'
                          }`}
                        >
                          {pick.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          ${pick.stake} → ${(pick.stake + pick.potentialWin).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">{formatOdds(pick.odds)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{pick.selection}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {pick.betCategory} • {new Date(pick.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {pick.status === 'won' && (
                        <div className="text-green-400 font-bold">
                          +${pick.potentialWin.toFixed(2)}
                        </div>
                      )}
                      {pick.status === 'lost' && (
                        <div className="text-red-400 font-bold">
                          -${pick.stake.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
