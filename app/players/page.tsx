'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import Footer from '@/components/Footer';
import { Search, TrendingUp, Target, Activity, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ESPNPlayerStats } from '@/lib/api/espn-api';
import { PlayerProp } from '@/lib/api/player-props-odds';
import Image from 'next/image';

export default function PlayersPage() {
  const [players, setPlayers] = useState<ESPNPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<'nfl' | 'ncaaf'>('nfl');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [playerProps, setPlayerProps] = useState<{ [key: string]: PlayerProp[] }>({});
  const [loadingProps, setLoadingProps] = useState<{ [key: string]: boolean }>({});

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport: selectedSport,
        limit: '100',
      });

      if (selectedPosition !== 'ALL') {
        params.append('position', selectedPosition);
      }

      const response = await fetch(`/api/players/espn?${params}`);
      const data = await response.json();

      if (data.success) {
        setPlayers(data.players);
      } else {
        console.error('Failed to fetch players:', data.error);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPosition, selectedSport]);

  // Fetch players on mount and when sport/position changes
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (query.length > 2) {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sport: selectedSport,
          q: query,
        });

        const response = await fetch(`/api/players/espn?${params}`);
        const data = await response.json();

        if (data.success) {
          setPlayers(data.players);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    } else if (query.length === 0) {
      fetchPlayers();
    }
  };

  const filteredPlayers = players;

  // Fetch props for a specific player
  const fetchPlayerProps = async (playerName: string, playerId: string) => {
    if (playerProps[playerId]) {
      // Already have props, just toggle
      setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
      return;
    }

    setLoadingProps({ ...loadingProps, [playerId]: true });
    setExpandedPlayerId(playerId);

    try {
      const response = await fetch(
        `/api/props/odds?sport=${selectedSport}&player=${encodeURIComponent(playerName)}`
      );
      const data = await response.json();

      if (data.success && data.props) {
        setPlayerProps({ ...playerProps, [playerId]: data.props });
      } else {
        console.error('Failed to fetch props:', data.error);
        setPlayerProps({ ...playerProps, [playerId]: [] });
      }
    } catch (error) {
      console.error('Error fetching props:', error);
      setPlayerProps({ ...playerProps, [playerId]: [] });
    } finally {
      setLoadingProps({ ...loadingProps, [playerId]: false });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderWithAuth />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Player Stats & Props</h1>
          <p className="text-gray-400">
            Deep dive into individual player statistics and betting props from Hard Rock Bet
          </p>
        </div>

        {/* Sport Selector */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={selectedSport === 'nfl' ? 'default' : 'ghost'}
            onClick={() => setSelectedSport('nfl')}
            className={selectedSport === 'nfl' ? 'gradient-green' : ''}
          >
            NFL
          </Button>
          <Button
            variant={selectedSport === 'ncaaf' ? 'default' : 'ghost'}
            onClick={() => setSelectedSport('ncaaf')}
            className={selectedSport === 'ncaaf' ? 'gradient-blue' : ''}
          >
            NCAAF
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players or teams..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex gap-2">
            {['ALL', 'QB', 'RB', 'WR', 'TE'].map((pos) => (
              <Button
                key={pos}
                variant={selectedPosition === pos ? 'default' : 'ghost'}
                onClick={() => setSelectedPosition(pos)}
                className={selectedPosition === pos ? 'gradient-green' : ''}
              >
                {pos}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="ml-3 text-white">Loading players from ESPN...</span>
          </div>
        )}

        {/* Players Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="glass-morphism border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {player.image ? (
                        <Image
                          src={player.image}
                          alt={player.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                          {player.jersey || player.position}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-xl text-white">{player.name}</CardTitle>
                        <p className="text-sm text-gray-400">{player.team.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-blue-600/20 text-blue-400">{player.position}</Badge>
                          {player.jersey && (
                            <Badge className="bg-purple-600/20 text-purple-400">#{player.jersey}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {player.team.logo && (
                      <Image
                        src={player.team.logo}
                        alt={player.team.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 opacity-50"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Player Info */}
                  {(player.height || player.weight || player.college) && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {player.height && (
                        <div className="text-center">
                          <p className="text-gray-400">Height</p>
                          <p className="text-white font-semibold">{player.height}</p>
                        </div>
                      )}
                      {player.weight && (
                        <div className="text-center">
                          <p className="text-gray-400">Weight</p>
                          <p className="text-white font-semibold">{player.weight} lbs</p>
                        </div>
                      )}
                      {player.experience !== undefined && (
                        <div className="text-center">
                          <p className="text-gray-400">Exp</p>
                          <p className="text-white font-semibold">{player.experience} yrs</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Season Stats */}
                  {Object.keys(player.stats).length > 0 && (
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>2024 Season Stats</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Passing Stats */}
                        {player.stats.passing && (
                          <>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Pass Yards</p>
                              <p className="text-white font-bold">{player.stats.passing.yards?.toFixed(0) || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Pass TDs</p>
                              <p className="text-white font-bold">{player.stats.passing.touchdowns || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">INTs</p>
                              <p className="text-white font-bold">{player.stats.passing.interceptions || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Comp %</p>
                              <p className="text-white font-bold">{player.stats.passing.completionPercentage?.toFixed(1) || 0}%</p>
                            </div>
                          </>
                        )}

                        {/* Rushing Stats */}
                        {player.stats.rushing && (
                          <>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Rush Yards</p>
                              <p className="text-white font-bold">{player.stats.rushing.yards?.toFixed(0) || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Rush TDs</p>
                              <p className="text-white font-bold">{player.stats.rushing.touchdowns || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">YPC</p>
                              <p className="text-white font-bold">{player.stats.rushing.yardsPerCarry?.toFixed(1) || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Attempts</p>
                              <p className="text-white font-bold">{player.stats.rushing.attempts || 0}</p>
                            </div>
                          </>
                        )}

                        {/* Receiving Stats */}
                        {player.stats.receiving && (
                          <>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Rec Yards</p>
                              <p className="text-white font-bold">{player.stats.receiving.yards?.toFixed(0) || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Receptions</p>
                              <p className="text-white font-bold">{player.stats.receiving.receptions || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Rec TDs</p>
                              <p className="text-white font-bold">{player.stats.receiving.touchdowns || 0}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Targets</p>
                              <p className="text-white font-bold">{player.stats.receiving.targets || 0}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Player Props Section */}
                  <div>
                    <Button
                      onClick={() => fetchPlayerProps(player.name, player.id)}
                      className="w-full gradient-green flex items-center justify-center space-x-2"
                      disabled={loadingProps[player.id]}
                    >
                      {loadingProps[player.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading Props...</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          <span>
                            {expandedPlayerId === player.id && playerProps[player.id] 
                              ? 'Hide' 
                              : 'Show'} Player Props
                          </span>
                          {expandedPlayerId === player.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </Button>

                    {/* Show Props if Expanded */}
                    {expandedPlayerId === player.id && playerProps[player.id] && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-white font-semibold flex items-center space-x-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span>Live Props from The Odds API</span>
                        </h4>

                        {playerProps[player.id].length === 0 ? (
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-400 text-center">
                              No props available for this player right now. Check back closer to game time!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {playerProps[player.id].map((prop, idx) => (
                              <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="text-white font-medium text-sm">
                                      {prop.propDescription}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {prop.sportsbook} • Line: {prop.line}
                                    </p>
                                  </div>
                                  <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                                    {new Date(prop.gameTime).toLocaleDateString()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded text-green-400 text-sm transition-colors">
                                    <div className="font-semibold">Over {prop.line}</div>
                                    <div className="text-xs">
                                      {prop.overOdds > 0 ? `+${prop.overOdds}` : prop.overOdds}
                                    </div>
                                  </button>
                                  <button className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm transition-colors">
                                    <div className="font-semibold">Under {prop.line}</div>
                                    <div className="text-xs">
                                      {prop.underOdds > 0 ? `+${prop.underOdds}` : prop.underOdds}
                                    </div>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-400 text-center">
                            ✅ Live data from The Odds API • Includes Hard Rock Bet & major sportsbooks
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No players found matching your criteria</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

