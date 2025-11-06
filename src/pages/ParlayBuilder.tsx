import { useEffect, useState } from 'react';
import type { ParlayPick } from '../types';
import { buildParlay } from '../utils/parlayCalculator';
import ConfidenceBadge from '../components/ConfidenceBadge';

export default function ParlayBuilder() {
  const [picks, setPicks] = useState<ParlayPick[]>([]);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('parlay');
    if (saved) {
      setPicks(JSON.parse(saved));
    }
  }, []);

  const handleRemovePick = (gameId: string) => {
    const updated = picks.filter(p => p.gameId !== gameId);
    setPicks(updated);
    localStorage.setItem('parlay', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setPicks([]);
    localStorage.removeItem('parlay');
  };

  const handleExportScreenshot = () => {
    alert('Screenshot export would be implemented here using html2canvas or similar library');
  };

  if (picks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Parlay Builder is Empty</h2>
        <p className="text-gray-400 mb-6">
          Add games from the analysis page to build your parlay
        </p>
        <a href="/" className="btn-primary inline-block">
          Browse Games
        </a>
      </div>
    );
  }

  const parlay = buildParlay(picks);

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'Conservative': return 'text-green-500';
      case 'Moderate': return 'text-yellow-500';
      case 'Aggressive': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Parlay Builder</h2>
        <p className="text-gray-400 text-sm">
          {picks.length} game{picks.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Parlay Summary Card */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg p-6 mb-6 border border-purple-800/30">
        <h3 className="text-lg font-semibold text-white mb-4">Parlay Summary</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Combined Probability</div>
            <div className="text-3xl font-bold text-white">{parlay.combinedProbability}%</div>
            <div className="text-gray-500 text-xs mt-1">Chance of all picks hitting</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Risk Level</div>
            <div className={`text-3xl font-bold ${getRiskLevelColor(parlay.riskLevel)}`}>
              {parlay.riskLevel}
            </div>
            <div className="text-gray-500 text-xs mt-1">Based on pick count & confidence</div>
          </div>
        </div>

        {/* Risk Assessment Meter */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden flex">
            <div className="bg-green-600 flex-1"></div>
            <div className="bg-yellow-600 flex-1"></div>
            <div className="bg-red-600 flex-1"></div>
          </div>
          <div className="relative h-6">
            <div
              className="absolute top-0 transition-all"
              style={{
                left: parlay.riskLevel === 'Conservative' ? '16%' : parlay.riskLevel === 'Moderate' ? '50%' : '83%'
              }}
            >
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
          <p className="text-yellow-400 text-xs">
            ⚠️ Remember: Higher leg parlays have exponentially lower odds of hitting. Bet responsibly!
          </p>
        </div>
      </div>

      {/* Individual Picks */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Your Picks ({picks.length})</h3>
          <button onClick={handleClearAll} className="text-red-500 hover:text-red-400 text-sm font-semibold">
            Clear All
          </button>
        </div>

        {picks.map((pick, index) => (
          <div key={pick.gameId} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <div className="text-white font-semibold">
                    {pick.game.awayTeam.shortName} @ {pick.game.homeTeam.shortName}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(pick.game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {pick.game.time}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemovePick(pick.gameId)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Pick</div>
                  <div className="text-white font-semibold">{pick.pick}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Bet Type</div>
                  <div className="text-white font-semibold capitalize">{pick.betType}</div>
                </div>
              </div>
              <ConfidenceBadge confidence={pick.confidence} />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 sticky bottom-4">
        <button onClick={handleExportScreenshot} className="w-full btn-primary py-4 text-lg">
          📸 Export as Screenshot
        </button>
        <p className="text-center text-gray-500 text-xs">
          Export this parlay to reference on your preferred betting platform
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold text-sm mb-2">💡 How to use this parlay</h4>
        <ul className="text-gray-400 text-xs space-y-1">
          <li>1. Review your picks and their combined probability</li>
          <li>2. Export as screenshot for easy reference</li>
          <li>3. Visit your preferred sportsbook to place your bet</li>
          <li>4. Remember: This is analysis only, not gambling advice</li>
        </ul>
      </div>
    </div>
  );
}
