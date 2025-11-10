'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, Share2, Trophy, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface SharedParlay {
  id: string;
  userId: string;
  title: string;
  description: string;
  parlayData: string;
  sport: string;
  likes: number;
  views: number;
  createdAt: string;
}

export default function SocialPage() {
  const { data: session } = useSession();
  const [parlays, setParlays] = useState<SharedParlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('ALL');

  const fetchParlays = useCallback(async () => {
    setLoading(true);
    try {
      const sportQuery = selectedSport !== 'ALL' ? `?sport=${selectedSport}` : '';
      const response = await fetch(`/api/social/parlays${sportQuery}`);
      const data = await response.json();
      if (data.success) {
        setParlays(data.parlays);
      }
    } catch (error) {
      console.error('Failed to fetch parlays:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    fetchParlays();
  }, [fetchParlays]);

  const handleLike = async (parlayId: string) => {
    try {
      await fetch(`/api/social/parlays/${parlayId}/like`, { method: 'POST' });
      fetchParlays(); // Refresh
    } catch (error) {
      console.error('Failed to like parlay:', error);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Community</h1>
              <p className="text-gray-400">Discover and share winning parlays</p>
            </div>
          </div>

          {/* Sport Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'NFL', 'NCAAF', 'NBA', 'MLB'].map((sport) => (
              <Button
                key={sport}
                variant={selectedSport === sport ? 'default' : 'ghost'}
                onClick={() => setSelectedSport(sport)}
                className={selectedSport === sport ? 'gradient-green' : ''}
              >
                {sport}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{parlays.length}</div>
                  <div className="text-sm text-gray-400">Shared Parlays</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">2.4K</div>
                  <div className="text-sm text-gray-400">Active Members</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">68%</div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parlays Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading community parlays...</p>
          </div>
        ) : parlays.length === 0 ? (
          <Card className="glass-premium">
            <CardContent className="p-12 text-center">
              <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No parlays yet</h3>
              <p className="text-gray-400 mb-4">Be the first to share a parlay in {selectedSport}!</p>
              {session && (
                <Link href="/">
                  <Button className="gradient-green">Create Your First Parlay</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parlays.map((parlay, index) => {
              const parlayInfo = JSON.parse(parlay.parlayData);
              return (
                <motion.div
                  key={parlay.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-premium hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-green-500/20 text-green-400">
                          {parlay.sport}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          <span>{parlay.views}</span>
                        </div>
                      </div>
                      <CardTitle className="text-white text-lg">{parlay.title}</CardTitle>
                      {parlay.description && (
                        <p className="text-sm text-gray-400 mt-2">{parlay.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Legs:</span>
                          <span className="text-white font-semibold">{parlayInfo.legs?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Total Odds:</span>
                          <span className="text-green-400 font-semibold">
                            {parlayInfo.totalOdds > 0 ? '+' : ''}{parlayInfo.totalOdds}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Potential:</span>
                          <span className="text-white font-semibold">
                            ${parlayInfo.potentialPayout?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(parlay.id)}
                          className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                          disabled={!session}
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          {parlay.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 hover:bg-blue-500/20 hover:text-blue-400"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>

                      <div className="mt-3 text-xs text-gray-500 text-center">
                        {new Date(parlay.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

