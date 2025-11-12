'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Trophy,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Eye,
  UserPlus,
  UserMinus,
  Target
} from 'lucide-react';

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [leaderboardSort, setLeaderboardSort] = useState('winRate');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('all');

  // Fetch shared parlays
  const { data: parlaysData, isLoading: parlaysLoading } = useQuery({
    queryKey: ['community-parlays', selectedSport],
    queryFn: async () => {
      const url = selectedSport
        ? `/api/community/parlays?sport=${selectedSport}&limit=20`
        : '/api/community/parlays?limit=20';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch parlays');
      return response.json();
    },
  });

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardSort, selectedSport, leaderboardTimeframe],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy: leaderboardSort,
        timeframe: leaderboardTimeframe,
        limit: '50',
      });
      if (selectedSport) params.append('sport', selectedSport);

      const response = await fetch(`/api/community/leaderboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });

  // Like parlay mutation
  const likeParlayMutation = useMutation({
    mutationFn: async ({ parlayId, action }: { parlayId: string; action: 'like' | 'unlike' }) => {
      const response = await fetch(`/api/community/parlays/${parlayId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to like parlay');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-parlays'] });
    },
  });

  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      const response = await fetch('/api/community/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (!response.ok) throw new Error('Failed to follow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  if (status === 'loading' || parlaysLoading) {
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

  const parlays = parlaysData?.parlays || [];
  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <main className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
          <p className="text-gray-400">Connect with other sports bettors and share your picks</p>
        </div>

        {/* Sport Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <Button
            variant={selectedSport === null ? 'default' : 'outline'}
            onClick={() => setSelectedSport(null)}
            className="whitespace-nowrap"
          >
            All Sports
          </Button>
          <Button
            variant={selectedSport === 'NFL' ? 'default' : 'outline'}
            onClick={() => setSelectedSport('NFL')}
            className="whitespace-nowrap"
          >
            NFL
          </Button>
          <Button
            variant={selectedSport === 'NCAAF' ? 'default' : 'outline'}
            onClick={() => setSelectedSport('NCAAF')}
            className="whitespace-nowrap"
          >
            NCAAF
          </Button>
          <Button
            variant={selectedSport === 'NBA' ? 'default' : 'outline'}
            onClick={() => setSelectedSport('NBA')}
            className="whitespace-nowrap"
          >
            NBA
          </Button>
          <Button
            variant={selectedSport === 'NCAAB' ? 'default' : 'outline'}
            onClick={() => setSelectedSport('NCAAB')}
            className="whitespace-nowrap"
          >
            NCAAB
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2">
            <TabsTrigger value="feed" className="flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-4">
            {parlays.length === 0 ? (
              <Card className="glass-morphism border-white/10">
                <CardContent className="p-12 text-center">
                  <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No shared parlays yet</p>
                  <p className="text-sm text-gray-500 mt-2">Be the first to share your picks!</p>
                </CardContent>
              </Card>
            ) : (
              parlays.map((parlay: any) => (
                <Card key={parlay.id} className="glass-morphism border-white/10 hover:border-white/20 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {parlay.user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{parlay.user.username || parlay.user.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{new Date(parlay.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">{parlay.sport}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => followUserMutation.mutate({ userId: parlay.userId, action: 'follow' })}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{parlay.title}</h3>
                      {parlay.description && (
                        <p className="text-gray-400 text-sm">{parlay.description}</p>
                      )}
                    </div>

                    {/* Parlay legs preview */}
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      {JSON.parse(parlay.parlayData).legs?.slice(0, 3).map((leg: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <p className="text-white font-medium">{leg.selection}</p>
                          <p className="text-gray-400 text-xs">{leg.betCategory}</p>
                        </div>
                      ))}
                      {JSON.parse(parlay.parlayData).legs?.length > 3 && (
                        <p className="text-gray-400 text-xs">
                          +{JSON.parse(parlay.parlayData).legs.length - 3} more picks
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => likeParlayMutation.mutate({ parlayId: parlay.id, action: 'like' })}
                          className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{parlay.likes}</span>
                        </button>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <MessageCircle className="w-4 h-4" />
                          <span>{parlay._count.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span>{parlay.views}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {JSON.parse(parlay.parlayData).legs?.length || 0} picks
                      </Badge>
                    </div>

                    {/* Recent comments preview */}
                    {parlay.comments && parlay.comments.length > 0 && (
                      <div className="border-t border-white/10 pt-4 space-y-2">
                        {parlay.comments.map((comment: any) => (
                          <div key={comment.id} className="text-sm">
                            <span className="text-blue-400 font-medium">{comment.user.username}</span>
                            <span className="text-gray-400 ml-2">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <select
                value={leaderboardSort}
                onChange={(e) => setLeaderboardSort(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
              >
                <option value="winRate">Win Rate</option>
                <option value="roi">ROI</option>
                <option value="profit">Total Profit</option>
                <option value="totalBets">Total Bets</option>
              </select>
              <select
                value={leaderboardTimeframe}
                onChange={(e) => setLeaderboardTimeframe(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>

            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
              </div>
            ) : leaderboard.length === 0 ? (
              <Card className="glass-morphism border-white/10">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No leaderboard data yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start tracking picks to appear on the leaderboard!</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-morphism border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {leaderboard.map((entry: any) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-500 text-black' :
                            entry.rank === 2 ? 'bg-gray-300 text-black' :
                            entry.rank === 3 ? 'bg-orange-600 text-white' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {entry.rank}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {entry.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{entry.username || entry.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <span>{entry.stats.totalBets} bets</span>
                              <span>•</span>
                              <span>{entry.stats.wonBets}-{entry.stats.lostBets}-{entry.stats.pushedBets}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              entry.stats.winRate >= 55 ? 'text-green-400' :
                              entry.stats.winRate >= 50 ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {entry.stats.winRate}%
                            </p>
                            <p className="text-xs text-gray-400">Win Rate</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              entry.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {entry.stats.roi >= 0 ? '+' : ''}{entry.stats.roi}%
                            </p>
                            <p className="text-xs text-gray-400">ROI</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              entry.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {entry.stats.profit >= 0 ? '+' : ''}${entry.stats.profit}
                            </p>
                            <p className="text-xs text-gray-400">Profit</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
