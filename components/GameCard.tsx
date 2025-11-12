'use client';

import { useState } from 'react';
import { Game } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  BarChart3,
  Clock
} from 'lucide-react';
import { formatDate, formatOdds, getConfidenceLevel } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import TeamComparison from './TeamComparison';
import OddsMovement from './OddsMovement';
import { useQuery } from '@tanstack/react-query';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showOddsMovement, setShowOddsMovement] = useState(false);
  const { addParlayLeg, parlayLegs } = useStore();

  const isInParlay = parlayLegs.some(leg => leg.gameId === game.id);
  const confidence = getConfidenceLevel(game.prediction?.confidence || 0);

  // Fetch line movement data
  const { data: oddsData } = useQuery({
    queryKey: ['odds-movement', game.id],
    queryFn: async () => {
      const response = await fetch(`/api/odds/history?gameId=${game.id}&hours=24`);
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  const movements = oddsData?.movements || {};

  const handleAddToParlay = (
    betType: 'spread' | 'moneyline' | 'total',
    selection: string,
    odds: number
  ) => {
    addParlayLeg({
      gameId: game.id,
      game,
      betType,
      selection,
      odds,
      probability: game.prediction?.confidence || 50,
    });
  };

  const spreadLabel = game.odds?.spread ? formatOdds(game.odds.spread.home) : 'N/A';
  const spreadOddsValue = game.odds?.spread?.homeOdds ?? 0;
  const spreadOddsLabel =
    game.odds?.spread?.homeOdds !== undefined ? formatOdds(game.odds.spread.homeOdds) : 'N/A';
  const moneylineValue = game.odds?.moneyline?.home ?? 0;
  const moneylineLabel =
    game.odds?.moneyline?.home !== undefined ? formatOdds(game.odds.moneyline.home) : 'N/A';
  const totalLabel = game.odds?.total ? `O ${game.odds.total.line}` : 'O -';
  const totalOverValue = game.odds?.total?.over ?? 0;
  const totalOverLabel =
    game.odds?.total?.over !== undefined ? formatOdds(game.odds.total.over) : 'N/A';

  // Helper function to render line movement badge
  const renderMovementBadge = (movement: number | null | undefined, type: 'spread' | 'total' | 'moneyline') => {
    if (!movement || Math.abs(movement) < 0.5) return null;

    const isUp = movement > 0;
    const absMovement = Math.abs(movement);
    const displayValue = type === 'moneyline' ? absMovement.toFixed(0) : absMovement.toFixed(1);

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-0.5 ${
          isUp ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}
      >
        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        <span>{displayValue}</span>
      </motion.div>
    );
  };

  return (
    <Card className="glass-morphism border-white/10 card-hover overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              {game.league}
            </Badge>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(game.date)}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">{game.awayTeam.abbreviation}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{game.awayTeam.name}</h3>
                  <p className="text-sm text-gray-400">{game.awayTeam.record}</p>
                </div>
              </div>
              {game.awayScore !== undefined && (
                <span className="text-2xl font-bold text-white">{game.awayScore}</span>
              )}
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">{game.homeTeam.abbreviation}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{game.homeTeam.name}</h3>
                  <p className="text-sm text-gray-400">{game.homeTeam.record}</p>
                </div>
              </div>
              {game.homeScore !== undefined && (
                <span className="text-2xl font-bold text-white">{game.homeScore}</span>
              )}
            </div>
          </div>

          {/* Prediction */}
          {game.prediction && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-white font-medium">
                    AI Prediction: {game.prediction.winner === 'home' ? game.homeTeam.name : game.awayTeam.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className={`w-4 h-4 ${confidence.color}`} />
                  <span className={`text-sm font-semibold ${confidence.color}`}>
                    {game.prediction.confidence.toFixed(1)}% {confidence.label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Predicted Score: {game.awayTeam.abbreviation} {game.prediction.predictedScore.away} - 
                {' '}{game.homeTeam.abbreviation} {game.prediction.predictedScore.home}
              </div>
            </div>
          )}
        </div>

        {/* Betting Options */}
        {game.odds && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {/* Spread */}
              <button
                onClick={() => handleAddToParlay(
                  'spread',
                  `${game.homeTeam.abbreviation} ${spreadLabel}`,
                  spreadOddsValue
                )}
                className="relative p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-center"
                disabled={!game.odds?.spread}
              >
                {renderMovementBadge(movements.spread, 'spread')}
                <div className="text-xs text-gray-400 mb-1">Spread</div>
                <div className="text-white font-semibold">{spreadLabel}</div>
                <div className="text-xs text-gray-400">{spreadOddsLabel}</div>
              </button>

              {/* Moneyline */}
              <button
                onClick={() => handleAddToParlay(
                  'moneyline',
                  game.homeTeam.name,
                  moneylineValue
                )}
                className="relative p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-center"
                disabled={!game.odds?.moneyline?.home}
              >
                {renderMovementBadge(movements.homeML, 'moneyline')}
                <div className="text-xs text-gray-400 mb-1">Moneyline</div>
                <div className="text-white font-semibold">{moneylineLabel}</div>
              </button>

              {/* Total */}
              <button
                onClick={() => handleAddToParlay(
                  'total',
                  totalLabel,
                  totalOverValue
                )}
                className="relative p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-center"
                disabled={!game.odds?.total}
              >
                {renderMovementBadge(movements.total, 'total')}
                <div className="text-xs text-gray-400 mb-1">Total</div>
                <div className="text-white font-semibold">{totalLabel}</div>
                <div className="text-xs text-gray-400">{totalOverLabel}</div>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 px-6 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-400 flex items-center justify-center space-x-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Analysis</span>
          </button>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-400 flex items-center justify-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Compare</span>
          </button>
          <button
            onClick={() => setShowOddsMovement(!showOddsMovement)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-400 flex items-center justify-center space-x-1"
          >
            <Clock className="w-4 h-4" />
            <span>Odds</span>
          </button>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && game.prediction && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white/5 space-y-4">
                <h4 className="text-white font-semibold mb-3">Key Factors</h4>
                {game.prediction.factors.map((factor, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{factor.name}</span>
                      <span className="text-white font-medium">{factor.impact}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.impact}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="gradient-green h-2 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team Comparison */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white/5">
                <TeamComparison game={game} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Odds Movement */}
        <AnimatePresence>
          {showOddsMovement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white/5">
                <OddsMovement gameId={game.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

