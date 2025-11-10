'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calculator, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

type BetType = 'single' | 'parlay' | 'teaser' | 'round-robin';

export default function BettingCalculator() {
  const [betType, setBetType] = useState<BetType>('single');
  const [stake, setStake] = useState(100);
  const [odds, setOdds] = useState(-110);
  const [parlayLegs, setParlayLegs] = useState([{ odds: -110 }, { odds: -110 }]);

  const calculatePayout = () => {
    if (betType === 'single') {
      const decimal = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
      return stake * decimal;
    } else if (betType === 'parlay') {
      const totalDecimal = parlayLegs.reduce((acc, leg) => {
        const decimal = leg.odds > 0 ? (leg.odds / 100) + 1 : (100 / Math.abs(leg.odds)) + 1;
        return acc * decimal;
      }, 1);
      return stake * totalDecimal;
    }
    return 0;
  };

  const payout = calculatePayout();
  const profit = payout - stake;

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-green-500" />
          <CardTitle className="text-white">Betting Calculator</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bet Type Selector */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Bet Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['single', 'parlay'] as BetType[]).map((type) => (
              <button
                key={type}
                onClick={() => setBetType(type)}
                className={`p-2 rounded-lg transition-colors ${
                  betType === type
                    ? 'bg-green-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stake Input */}
        <div>
          <label className="text-sm text-gray-400 mb-2 flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Stake Amount</span>
          </label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            min="1"
          />
        </div>

        {/* Single Bet Odds */}
        {betType === 'single' && (
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Odds (American)</label>
            <input
              type="number"
              value={odds}
              onChange={(e) => setOdds(Number(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Parlay Legs */}
        {betType === 'parlay' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Parlay Legs</label>
              <Button
                size="sm"
                onClick={() => setParlayLegs([...parlayLegs, { odds: -110 }])}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
              >
                Add Leg
              </Button>
            </div>
            {parlayLegs.map((leg, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm w-16">Leg {index + 1}:</span>
                <input
                  type="number"
                  value={leg.odds}
                  onChange={(e) => {
                    const newLegs = [...parlayLegs];
                    newLegs[index].odds = Number(e.target.value);
                    setParlayLegs(newLegs);
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {parlayLegs.length > 2 && (
                  <button
                    onClick={() => setParlayLegs(parlayLegs.filter((_, i) => i !== index))}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <motion.div
          key={payout}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Stake:</span>
            <span className="text-white font-semibold">${stake.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Payout:</span>
            <span className="text-white font-bold text-lg">${payout.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
            <span className="text-gray-400">Profit:</span>
            <span className={`font-bold text-lg ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${profit.toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Conversion Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Tip: American odds format</p>
          <p>• Positive (+150) = $150 profit on $100 bet</p>
          <p>• Negative (-150) = Bet $150 to win $100</p>
        </div>
      </CardContent>
    </Card>
  );
}

