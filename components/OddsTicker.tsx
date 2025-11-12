'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TickerGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  spread: number | null;
  spreadMovement: number | null;
  total: number | null;
  totalMovement: number | null;
  homeML: number | null;
  league: string;
}

export default function OddsTicker() {
  const [isPaused, setIsPaused] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['odds-ticker'],
    queryFn: async () => {
      const response = await fetch('/api/odds/ticker');
      if (!response.ok) throw new Error('Failed to fetch ticker data');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !data?.games || data.games.length === 0) {
    return null;
  }

  const games: TickerGame[] = data.games;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-md border-b border-white/10 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-12 flex items-center">
        {/* Ticker Label */}
        <div className="absolute left-0 z-10 px-4 bg-gradient-to-r from-blue-900/95 to-transparent">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Live Odds
            </span>
          </div>
        </div>

        {/* Scrolling Content */}
        <motion.div
          className="flex space-x-8 pl-32"
          animate={{
            x: isPaused ? 0 : [0, -1000],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 30,
              ease: 'linear',
            },
          }}
        >
          {/* Render games twice for seamless loop */}
          {[...games, ...games].map((game, index) => (
            <div
              key={`${game.id}-${index}`}
              className="flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm whitespace-nowrap"
            >
              {/* Teams */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">{game.awayAbbr}</span>
                <span className="text-xs text-gray-500">@</span>
                <span className="text-xs text-white font-semibold">{game.homeAbbr}</span>
              </div>

              <div className="w-px h-6 bg-white/10" />

              {/* Spread */}
              {game.spread !== null && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">Spread:</span>
                  <span className="text-xs text-white font-semibold">
                    {game.spread > 0 ? '+' : ''}{game.spread.toFixed(1)}
                  </span>
                  {game.spreadMovement !== null && Math.abs(game.spreadMovement) >= 0.5 && (
                    <div className="flex items-center">
                      {game.spreadMovement > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className={`text-[10px] font-bold ${
                        game.spreadMovement > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Math.abs(game.spreadMovement).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="w-px h-6 bg-white/10" />

              {/* Total */}
              {game.total !== null && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">O/U:</span>
                  <span className="text-xs text-white font-semibold">
                    {game.total.toFixed(1)}
                  </span>
                  {game.totalMovement !== null && Math.abs(game.totalMovement) >= 0.5 && (
                    <div className="flex items-center">
                      {game.totalMovement > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className={`text-[10px] font-bold ${
                        game.totalMovement > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Math.abs(game.totalMovement).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* League Badge */}
              <div className="ml-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold">
                  {game.league}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Fade gradient on right */}
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-blue-900/95 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
