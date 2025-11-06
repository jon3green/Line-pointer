import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    if (confirm('Are you sure you want to clear all picks?')) {
      setPicks([]);
      localStorage.removeItem('parlay');
    }
  };

  const handleExportScreenshot = () => {
    alert('Screenshot export would be implemented here using html2canvas or similar library');
  };

  if (picks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-dark-card border border-dark-border rounded-full mb-8">
          <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-3">Your Parlay Builder is Empty</h2>
        <p className="text-text-secondary mb-8 text-lg max-w-md mx-auto">
          Add games from the analysis page to build your parlay and calculate combined odds
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Games
        </Link>
      </div>
    );
  }

  const parlay = buildParlay(picks);

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'Conservative': return 'gradient-text-green';
      case 'Moderate': return 'text-accent-orange';
      case 'Aggressive': return 'text-accent-red';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Games</span>
          </Link>
          <h1 className="text-4xl font-bold text-text-primary">Parlay Builder</h1>
          <p className="text-text-secondary mt-2">
            {picks.length} game{picks.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleClearAll} className="btn-secondary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>
      </div>

      {/* Parlay Summary Card */}
      <div className="card bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border-brand-purple/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-brand-purple/5"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-brand-purple-light" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Parlay Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="stat-card bg-dark-card/80 backdrop-blur-sm">
              <div className="text-text-muted text-sm mb-2 font-semibold">COMBINED PROBABILITY</div>
              <div className="text-4xl font-bold gradient-text mb-1">{parlay.combinedProbability}%</div>
              <div className="text-text-dim text-xs">Chance of all picks hitting</div>
            </div>

            <div className="stat-card bg-dark-card/80 backdrop-blur-sm">
              <div className="text-text-muted text-sm mb-2 font-semibold">RISK LEVEL</div>
              <div className={`text-4xl font-bold mb-1 ${getRiskLevelColor(parlay.riskLevel)}`}>
                {parlay.riskLevel}
              </div>
              <div className="text-text-dim text-xs">Based on pick count & confidence</div>
            </div>
          </div>

          {/* Risk Assessment Meter */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-text-muted mb-2 font-medium">
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
            </div>
            <div className="bg-dark-surface rounded-full h-4 overflow-hidden flex border border-dark-border">
              <div className="bg-gradient-success flex-1"></div>
              <div className="bg-gradient-to-r from-accent-orange to-yellow-600 flex-1"></div>
              <div className="bg-gradient-to-r from-accent-red to-red-600 flex-1"></div>
            </div>
            <div className="relative h-6">
              <div
                className="absolute top-0 transition-all duration-500"
                style={{
                  left: parlay.riskLevel === 'Conservative' ? '16%' : parlay.riskLevel === 'Moderate' ? '50%' : '83%'
                }}
              >
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white shadow-lg"></div>
              </div>
            </div>
          </div>

          <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent-orange flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-accent-orange text-sm">
                Remember: Higher leg parlays have exponentially lower odds of hitting. Bet responsibly!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Picks */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-text-primary">Your Picks ({picks.length})</h3>
        </div>

        {picks.map((pick, index) => (
          <div key={pick.gameId} className="card card-hover">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold shadow-glow-blue">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-text-primary mb-1">
                    {pick.game.awayTeam.shortName} @ {pick.game.homeTeam.shortName}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-text-muted">
                      {new Date(pick.game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {pick.game.time}
                    </span>
                    <span className="badge badge-info text-xs">
                      {pick.game.sport}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="stat-card py-2">
                      <div className="text-text-muted text-xs mb-1">PICK</div>
                      <div className="text-text-primary font-bold">{pick.pick}</div>
                    </div>
                    <div className="stat-card py-2">
                      <div className="text-text-muted text-xs mb-1">BET TYPE</div>
                      <div className="text-text-primary font-bold capitalize">{pick.betType}</div>
                    </div>
                    <div className="stat-card py-2">
                      <div className="text-text-muted text-xs mb-1">CONFIDENCE</div>
                      <div className="flex items-center">
                        <ConfidenceBadge confidence={pick.confidence} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemovePick(pick.gameId)}
                className="self-start text-accent-red hover:text-red-400 transition-colors p-2 hover:bg-accent-red/10 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 sticky bottom-6 z-10">
        <button onClick={handleExportScreenshot} className="w-full btn-primary py-5 text-lg flex items-center justify-center gap-2 shadow-2xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Export as Screenshot
        </button>
        <p className="text-center text-text-muted text-sm">
          Export this parlay to reference on your preferred betting platform
        </p>
      </div>

      {/* Info Box */}
      <div className="card bg-brand-blue/10 border-brand-blue/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-brand-blue-light font-bold text-lg mb-3">How to use this parlay</h4>
            <ul className="text-text-secondary space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-light font-bold">1.</span>
                <span>Review your picks and their combined probability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-light font-bold">2.</span>
                <span>Export as screenshot for easy reference</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-light font-bold">3.</span>
                <span>Visit your preferred sportsbook to place your bet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-light font-bold">4.</span>
                <span>Remember: This is analysis only, not gambling advice</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
