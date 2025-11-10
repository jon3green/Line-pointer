'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useStore } from '@/lib/store';
import { calculateParlayOdds, calculateParlayProbability, formatOdds } from '@/lib/utils';
import { validateParlayLegs, analyzeParlayQuality, calculateParlayEV } from '@/lib/parlay-validator';
import { Trash2, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Award, Target, Sparkles, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParlayBuilderEnhanced() {
  const { parlayLegs, removeParlayLeg, clearParlay, stake, setStake } = useStore();
  const [validation, setValidation] = useState<any>(null);
  const [quality, setQuality] = useState<any>(null);
  
  const totalOdds = parlayLegs.length > 0 
    ? calculateParlayOdds(parlayLegs.map(leg => leg.odds))
    : 0;
  
  const totalProbability = parlayLegs.length > 0
    ? calculateParlayProbability(parlayLegs.map(leg => leg.probability))
    : 0;
  
  const potentialPayout = stake * (totalOdds > 0 ? (totalOdds / 100) + 1 : (100 / Math.abs(totalOdds)) + 1);
  const potentialWin = potentialPayout - stake;
  
  const expectedValue = parlayLegs.length > 0
    ? calculateParlayEV(parlayLegs, stake, totalOdds)
    : 0;
  
  // Validate parlay whenever legs change
  useEffect(() => {
    if (parlayLegs.length > 0) {
      setValidation(validateParlayLegs(parlayLegs));
      setQuality(analyzeParlayQuality(parlayLegs));
    } else {
      setValidation(null);
      setQuality(null);
    }
  }, [parlayLegs]);

  const getQualityColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    if (score >= 60) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
    if (score >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
  };

  const qualityColors = quality ? getQualityColor(quality.score) : null;

  return (
    <Card className="glass-premium border-white/10 sticky top-24 overflow-hidden">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-white/10 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Parlay Builder</h3>
          </div>
          {parlayLegs.length > 0 && (
            <Badge className="gradient-primary px-3 py-1 text-sm font-semibold">
              {parlayLegs.length} {parlayLegs.length === 1 ? 'Leg' : 'Legs'}
            </Badge>
          )}
        </div>
        {parlayLegs.length > 0 && quality && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Quality Score:</span>
            <Badge className={`${qualityColors?.bg} ${qualityColors?.text} border ${qualityColors?.border}`}>
              {quality.score}/100
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Parlay Legs */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {parlayLegs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 text-sm mb-1">No bets added yet</p>
                <p className="text-gray-600 text-xs">Click on odds to add to your parlay</p>
              </motion.div>
            ) : (
              parlayLegs.map((leg, index) => (
                <motion.div
                  key={`${leg.gameId}-${index}`}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card rounded-xl p-4 hover-lift group relative overflow-hidden"
                >
                  {/* Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500" />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* League & Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                          {leg.game.league}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                          {leg.betType}
                        </Badge>
                      </div>
                      
                      {/* Game Info */}
                      <p className="text-white font-semibold text-sm mb-1 truncate">
                        {leg.game.awayTeam.abbreviation} @ {leg.game.homeTeam.abbreviation}
                      </p>
                      <p className="text-gray-400 text-xs mb-2">
                        {leg.selection}
                      </p>
                      
                      {/* Probability Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${leg.probability}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {leg.probability}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 ml-4">
                      {/* Odds */}
                      <div className="text-right">
                        <div className="text-white font-bold text-lg tabular-nums">
                          {formatOdds(leg.odds)}
                        </div>
                        <div className="text-xs text-gray-500">Odds</div>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParlayLeg(leg.gameId)}
                        className="h-8 w-8 rounded-lg hover:bg-red-500/20 hover:text-red-400 smooth-transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {parlayLegs.length > 0 && (
          <>
            {/* Divider */}
            <div className="divider my-6" />

            {/* Stake Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Bet Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-green-500/50 smooth-transition"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Total Odds</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {formatOdds(totalOdds)}
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Win Chance</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {totalProbability.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Payout Info */}
            <div className="glass-premium rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Potential Win</span>
                <span className="text-2xl font-bold text-green-400 tabular-nums">
                  ${potentialWin.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Payout</span>
                <span className="text-white font-semibold tabular-nums">
                  ${potentialPayout.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Expected Value</span>
                <span className={`font-semibold tabular-nums ${
                  expectedValue > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {expectedValue > 0 ? '+' : ''}${expectedValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Warnings */}
            {validation && validation.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-4 border border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings</h4>
                    <ul className="space-y-1">
                      {validation.warnings.map((warning: string, i: number) => (
                        <li key={i} className="text-xs text-gray-400">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality Indicators */}
            {quality && (
              <div className="grid grid-cols-2 gap-2">
                {quality.indicators.correlation && (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">Low Correlation</span>
                  </div>
                )}
                {quality.indicators.value && (
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-gray-400">Good Value</span>
                  </div>
                )}
                {quality.indicators.confidence && (
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">High Confidence</span>
                  </div>
                )}
                {quality.indicators.balanced && (
                  <div className="flex items-center gap-2 text-xs">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">Well Balanced</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={clearParlay}
                variant="outline"
                className="flex-1 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                className="flex-1 gradient-primary hover-lift font-semibold"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Place Bet
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

