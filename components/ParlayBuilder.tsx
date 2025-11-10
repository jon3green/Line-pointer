'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useStore } from '@/lib/store';
import { calculateParlayOdds, calculateParlayProbability, formatOdds } from '@/lib/utils';
import { validateParlayLegs, analyzeParlayQuality, calculateParlayEV, calculateKellyCriterion } from '@/lib/parlay-validator';
import { Trash2, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParlayBuilder() {
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

  return (
    <Card className="glass-morphism border-white/10 sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Parlay Builder</CardTitle>
          {parlayLegs.length > 0 && (
            <Badge className="gradient-green">
              {parlayLegs.length} {parlayLegs.length === 1 ? 'Leg' : 'Legs'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Parlay Legs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {parlayLegs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-400"
              >
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Click on betting options to add to parlay</p>
              </motion.div>
            ) : (
              parlayLegs.map((leg, index) => (
                <motion.div
                  key={leg.gameId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                          {leg.game.league}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {leg.betType}
                        </Badge>
                      </div>
                      <p className="text-white text-sm font-medium">
                        {leg.game.awayTeam.abbreviation} @ {leg.game.homeTeam.abbreviation}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {leg.selection}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">
                          {formatOdds(leg.odds)}
                        </div>
                        <div className="text-green-400 text-xs">
                          {leg.probability.toFixed(0)}%
                        </div>
                      </div>
                      <button
                        onClick={() => removeParlayLeg(leg.gameId)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {parlayLegs.length > 0 && (
          <>
            {/* Stake Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Stake Amount</span>
              </label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                step="10"
              />
              <div className="flex space-x-2">
                {[25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setStake(amount)}
                    className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-400 transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Parlay Summary */}
            <div className="space-y-3 p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Odds</span>
                <span className="text-white font-bold">{formatOdds(totalOdds)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Combined Probability</span>
                <span className={`font-semibold ${
                  totalProbability > 40 ? 'text-green-400' : 
                  totalProbability > 25 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {totalProbability.toFixed(1)}%
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">Potential Win</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${potentialWin.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Payout</span>
                  <span className="text-white font-semibold">
                    ${potentialPayout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full gradient-green font-semibold"
                size="lg"
              >
                Review Parlay
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={clearParlay}
              >
                Clear All
              </Button>
            </div>

            {/* Parlay Quality Analysis */}
            {quality && (
              <div className={`p-3 rounded-lg border ${
                quality.quality === 'excellent' ? 'bg-green-500/10 border-green-500/30' :
                quality.quality === 'good' ? 'bg-blue-500/10 border-blue-500/30' :
                quality.quality === 'fair' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {quality.quality === 'excellent' ? <Award className="w-4 h-4 text-green-400" /> :
                     quality.quality === 'good' ? <CheckCircle className="w-4 h-4 text-blue-400" /> :
                     <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                    <span className={`text-sm font-semibold ${
                      quality.quality === 'excellent' ? 'text-green-400' :
                      quality.quality === 'good' ? 'text-blue-400' :
                      quality.quality === 'fair' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      Parlay Quality: {quality.quality.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-bold">{quality.score}/100</span>
                </div>
                <div className="space-y-1">
                  {quality.recommendations.map((rec: string, idx: number) => (
                    <p key={idx} className="text-xs text-gray-300">• {rec}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Value */}
            {expectedValue !== 0 && (
              <div className={`p-3 rounded-lg ${
                expectedValue > 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Expected Value (EV)</span>
                  <span className={`text-sm font-bold ${expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {expectedValue > 0 ? '+' : ''} ${expectedValue.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {expectedValue > 0 ? '✅ Positive EV - Good value bet!' : '❌ Negative EV - Consider alternatives'}
                </p>
              </div>
            )}

            {/* Validation Warnings */}
            {validation && !validation.valid && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">
                  ❌ {validation.error}
                </p>
              </div>
            )}

            {validation && validation.warnings && validation.warnings.map((warning: string, idx: number) => (
              <div key={idx} className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400">{warning}</p>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

