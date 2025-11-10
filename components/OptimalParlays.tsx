'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, DollarSign, Target, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimalParlay {
  id: string;
  legs: Array<{
    gameId: string;
    game: {
      homeTeam: { name: string; abbreviation: string };
      awayTeam: { name: string; abbreviation: string };
    };
    betType: string;
    selection: string;
    odds: number;
    probability: number;
  }>;
  totalOdds: number;
  combinedProbability: number;
  expectedValue: number;
  potentialPayout: number;
  confidence: 'high' | 'medium' | 'low';
  strategy: string;
  reasoning: string[];
  recommendedStakes?: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
}

export default function OptimalParlays() {
  const [expandedParlay, setExpandedParlay] = useState<string | null>(null);
  const [minLegs, setMinLegs] = useState(3);
  const [maxLegs, setMaxLegs] = useState(5);
  const [stake, setStake] = useState(100);

  const { data, isLoading, error } = useQuery({
    queryKey: ['optimal-parlays', minLegs, maxLegs, stake],
    queryFn: async () => {
      const response = await fetch(
        `/api/parlays/optimal?minLegs=${minLegs}&maxLegs=${maxLegs}&stake=${stake}&bankroll=1000`
      );
      if (!response.ok) throw new Error('Failed to fetch optimal parlays');
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span>AI Parlay Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Generating optimal parlays...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.parlays) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span>AI Parlay Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400">Error loading parlays. Try refreshing.</div>
        </CardContent>
      </Card>
    );
  }

  const parlays: OptimalParlay[] = data.parlays;
  const topParlays = parlays.slice(0, 6);

  const confidenceColors = {
    high: 'text-green-400 bg-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-orange-400 bg-orange-500/20',
  };

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span>AI Parlay Generator</span>
            <Badge className="bg-yellow-600/20 text-yellow-400">
              <Zap className="w-3 h-3 mr-1" />
              Auto
            </Badge>
          </div>
          <span className="text-sm text-gray-400">{parlays.length} Generated</span>
        </CardTitle>
        <p className="text-sm text-gray-400 mt-2">
          Automatically generated optimal parlays with best odds and EV
        </p>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex items-center space-x-4 mb-6 p-4 bg-white/5 rounded-lg">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Legs</label>
            <select
              value={`${minLegs}-${maxLegs}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                setMinLegs(min);
                setMaxLegs(max);
              }}
              className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
            >
              <option value="3-3">3 Legs</option>
              <option value="3-4">3-4 Legs</option>
              <option value="3-5">3-5 Legs</option>
              <option value="4-5">4-5 Legs</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Stake</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm w-24"
              min="5"
              step="5"
            />
          </div>
        </div>

        {/* Parlay List */}
        <div className="space-y-3">
          {topParlays.map((parlay, index) => (
            <motion.div
              key={parlay.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  expandedParlay === parlay.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/40'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                onClick={() => setExpandedParlay(expandedParlay === parlay.id ? null : parlay.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={confidenceColors[parlay.confidence]}>
                        {parlay.confidence.toUpperCase()}
                      </Badge>
                      <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                        {parlay.legs.length} Legs
                      </Badge>
                      <span className="text-xs text-gray-500">{parlay.strategy}</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm">{parlay.strategy} Parlay</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">
                      {parlay.totalOdds > 0 ? '+' : ''}
                      {parlay.totalOdds}
                    </div>
                    <div className="text-xs text-gray-400">{parlay.combinedProbability}% prob</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex items-center space-x-1 text-xs">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">Payout:</span>
                    <span className="text-white font-semibold">${parlay.potentialPayout.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <TrendingUp className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">EV:</span>
                    <span className={`font-semibold ${parlay.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${parlay.expectedValue.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="flex items-center justify-center mt-2">
                  {expandedParlay === parlay.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedParlay === parlay.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      {/* Legs */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase">Legs:</p>
                        {parlay.legs.map((leg, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded">
                            <div>
                              <p className="text-white text-sm font-medium">{leg.selection}</p>
                              <p className="text-xs text-gray-400">
                                {leg.game.awayTeam.abbreviation} @ {leg.game.homeTeam.abbreviation} • {leg.betType}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-semibold text-sm">
                                {leg.odds > 0 ? '+' : ''}
                                {leg.odds}
                              </p>
                              <p className="text-xs text-gray-400">{(leg.probability * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Strategy Reasoning */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Why this parlay:</p>
                        <ul className="space-y-1">
                          {parlay.reasoning.map((reason, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start space-x-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Stakes */}
                      {parlay.recommendedStakes && (
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Recommended Stakes:</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-blue-500/10 rounded text-center">
                              <p className="text-xs text-blue-400 mb-1">Conservative</p>
                              <p className="text-white font-bold">${parlay.recommendedStakes.conservative}</p>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded text-center">
                              <p className="text-xs text-green-400 mb-1">Moderate</p>
                              <p className="text-white font-bold">${parlay.recommendedStakes.moderate}</p>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded text-center">
                              <p className="text-xs text-orange-400 mb-1">Aggressive</p>
                              <p className="text-white font-bold">${parlay.recommendedStakes.aggressive}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {parlays.length > 6 && (
          <div className="mt-4 text-center">
            <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
              View All {parlays.length} Parlays →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
