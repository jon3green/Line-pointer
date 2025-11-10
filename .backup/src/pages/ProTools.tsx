/**
 * Professional Betting Tools - Line Pointer
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bettingMathService } from '../services/bettingMath.service';

export function ProTools() {
  const [activeTab, setActiveTab] = useState<'kelly' | 'ev' | 'clv' | 'vig' | 'poisson' | 'sharp'>('kelly');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-text-primary mb-2">🎯 Professional Betting Tools</h1>
        <p className="text-text-secondary text-lg">Industry-standard calculators used by professional sports bettors</p>
      </div>

      {/* Tool Tabs */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'kelly', label: '📊 Kelly Criterion', desc: 'Optimal bet sizing' },
            { id: 'ev', label: '💰 EV Calculator', desc: 'Expected value' },
            { id: 'clv', label: '📈 CLV Tracker', desc: 'Closing line value' },
            { id: 'vig', label: '🔍 Vig Calculator', desc: 'True odds' },
            { id: 'poisson', label: '🎲 Poisson Model', desc: 'Score prediction' },
            { id: 'sharp', label: '🔥 Sharp Detector', desc: 'Smart money' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-2xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-brand text-white shadow-glow-blue scale-105'
                  : 'bg-dark-surface text-text-secondary hover:bg-dark-surface-hover border border-dark-border hover:border-brand-blue/50'
              }`}
            >
              <div className="text-sm mb-1">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Content */}
      {activeTab === 'kelly' && <KellyCalculator />}
      {activeTab === 'ev' && <EVCalculator />}
      {activeTab === 'clv' && <CLVCalculator />}
      {activeTab === 'vig' && <VigCalculator />}
      {activeTab === 'poisson' && <PoissonCalculator />}
      {activeTab === 'sharp' && <SharpDetector />}
    </div>
  );
}

// ============================================================================
// KELLY CRITERION CALCULATOR
// ============================================================================
function KellyCalculator() {
  const [betOdds, setBetOdds] = useState(-110);
  const [fairWinProb, setFairWinProb] = useState(55);
  const [bankroll, setBankroll] = useState(1000);
  const [fraction, setFraction] = useState(0.25);

  const result = bettingMathService.calculateKelly(betOdds, fairWinProb / 100, bankroll, fraction);

  return (
    <div className="card">
      <h2 className="text-3xl font-bold text-text-primary mb-4">📊 Kelly Criterion Calculator</h2>
      <p className="text-text-secondary mb-2">
        The Kelly Criterion calculates the optimal bet size to maximize long-term bankroll growth while minimizing risk of ruin.
      </p>
      <div className="stat-card bg-gradient-to-r from-accent-orange/10 to-accent-orange/5 border-accent-orange/30 mt-4 mb-6">
        <p className="text-accent-orange text-sm">
          ⚠️ <strong>Pro Tip:</strong> Most professionals use fractional Kelly (25-50%) to reduce variance and account for estimation errors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Bet Odds (American)</label>
            <input
              type="number"
              value={betOdds}
              onChange={(e) => setBetOdds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="-110"
            />
            <p className="text-xs text-text-muted mt-1">Enter American odds (e.g., -110, +150)</p>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Your Fair Win Probability (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={fairWinProb}
              onChange={(e) => setFairWinProb(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">Your estimated true win probability</p>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Bankroll ($)</label>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Kelly Fraction (Safety)</label>
            <div className="flex gap-2">
              {[0.25, 0.5, 0.75, 1.0].map((f) => (
                <button
                  key={f}
                  onClick={() => setFraction(f)}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    fraction === f ? 'bg-blue-600 text-white' : 'bg-dark-surface text-text-secondary'
                  }`}
                >
                  {f === 1 ? 'Full' : `${f * 100}%`}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {fraction === 0.25 && '🛡️ Conservative (Recommended)'}
              {fraction === 0.5 && '⚖️ Moderate'}
              {fraction === 0.75 && '⚠️ Aggressive'}
              {fraction === 1.0 && '🚨 Very Aggressive (High Risk)'}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-6 border border-blue-800/30">
          <h3 className="text-lg font-bold text-white mb-4">💡 Results</h3>

          <div className="space-y-4">
            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-text-secondary text-sm mb-1">Your Edge</div>
              <div className={`text-3xl font-bold ${result.edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.edgePercentage.toFixed(2)}%
              </div>
            </div>

            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-text-secondary text-sm mb-1">Recommended Bet ({fraction * 100}% Kelly)</div>
              <div className="text-3xl font-bold text-white">
                ${result.recommendedBet.toFixed(2)}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {result.recommendedPercentage.toFixed(2)}% of bankroll
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-dark-card/60 rounded p-3">
                <div className="text-xs text-text-secondary">Quarter</div>
                <div className="text-sm font-bold text-white">${result.quarterKelly.toFixed(0)}</div>
              </div>
              <div className="bg-dark-card/60 rounded p-3">
                <div className="text-xs text-text-secondary">Half</div>
                <div className="text-sm font-bold text-white">${result.halfKelly.toFixed(0)}</div>
              </div>
              <div className="bg-dark-card/60 rounded p-3">
                <div className="text-xs text-text-secondary">Full</div>
                <div className="text-sm font-bold text-white">${result.fullKelly.toFixed(0)}</div>
              </div>
            </div>

            {result.warning && (
              <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3 text-yellow-300 text-sm">
                ⚠️ {result.warning}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 text-sm text-text-secondary">
        <h4 className="font-bold text-blue-400 mb-2">📚 How to Use:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter the odds you're getting from the sportsbook</li>
          <li>Enter YOUR estimated true win probability (from your analysis/model)</li>
          <li>If you have an edge (fair prob &gt; implied prob), Kelly tells you how much to bet</li>
          <li>Use fractional Kelly (25-50%) for real-world betting to reduce variance</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================================
// EXPECTED VALUE CALCULATOR
// ============================================================================
function EVCalculator() {
  const [betOdds, setBetOdds] = useState(-110);
  const [fairWinProb, setFairWinProb] = useState(55);
  const [stake, setStake] = useState(100);

  const result = bettingMathService.calculateEV(betOdds, fairWinProb / 100, stake);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">💰 Expected Value (EV) Calculator</h2>
      <p className="text-text-secondary mb-6">
        EV is THE MOST IMPORTANT metric in sports betting. Professional bettors ONLY make bets with positive EV.
        <span className="block mt-2 text-green-400 text-sm">
          ✅ Pro Standard: Look for +EV of 2-5% or higher for profitable long-term betting.
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Bet Odds (American)</label>
            <input
              type="number"
              value={betOdds}
              onChange={(e) => setBetOdds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Fair Win Probability (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={fairWinProb}
              onChange={(e) => setFairWinProb(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">From sharp book or your model</p>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Stake ($)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className={`bg-gradient-to-br rounded-lg p-6 border ${
          result.isProfitable
            ? 'from-green-900/40 to-emerald-900/40 border-green-800/30'
            : 'from-red-900/40 to-orange-900/40 border-red-800/30'
        }`}>
          <h3 className="text-lg font-bold text-white mb-4">
            {result.isProfitable ? '✅ Profitable Bet' : '❌ Negative EV'}
          </h3>

          <div className="space-y-4">
            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-text-secondary text-sm mb-1">Expected Value</div>
              <div className={`text-4xl font-bold ${result.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                ${result.expectedValue.toFixed(2)}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {result.expectedValuePercentage.toFixed(2)}% ROI
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-card/60 rounded-lg p-3">
                <div className="text-xs text-text-secondary mb-1">Profit if Win</div>
                <div className="text-lg font-bold text-green-400">+${result.profitIfWin.toFixed(2)}</div>
              </div>
              <div className="bg-dark-card/60 rounded-lg p-3">
                <div className="text-xs text-text-secondary mb-1">Loss if Lose</div>
                <div className="text-lg font-bold text-red-400">-${result.lossIfLose.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-dark-card/60 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Break-Even Win Rate</div>
              <div className="text-lg font-bold text-white">{(result.breakEvenWinRate * 100).toFixed(2)}%</div>
              <div className="text-xs text-text-secondary mt-1">
                Your model: {(result.fairWinProb * 100).toFixed(2)}%
                {result.fairWinProb > result.breakEvenWinRate && (
                  <span className="text-green-400 ml-2">✓ Edge: {((result.fairWinProb - result.breakEvenWinRate) * 100).toFixed(2)}%</span>
                )}
              </div>
            </div>

            {result.isProfitable && result.expectedValuePercentage >= 2 && (
              <div className="bg-green-900/40 border border-green-700/50 rounded-lg p-3 text-green-300 text-sm">
                🎯 Strong +EV bet! This meets professional betting standards (2%+ edge).
              </div>
            )}

            {!result.isProfitable && (
              <div className="bg-red-900/40 border border-red-700/50 rounded-lg p-3 text-red-300 text-sm">
                🚫 Do not bet! Negative EV will lose money long-term.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-4 text-sm text-text-secondary">
        <h4 className="font-bold text-purple-400 mb-2">💡 EV Formula:</h4>
        <code className="block bg-dark-card p-3 rounded font-mono text-xs">
          EV = (Fair Win Prob × Profit if Win) - (Fair Loss Prob × Stake)
        </code>
        <p className="mt-2">
          If EV {'>'} 0: You have an edge and should bet (if edge is large enough).<br/>
          If EV {'<'} 0: You will lose money long-term. Do not bet.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CLV CALCULATOR
// ============================================================================
function CLVCalculator() {
  const [yourOdds, setYourOdds] = useState(-110);
  const [closingOdds, setClosingOdds] = useState(-115);
  const [betAmount, setBetAmount] = useState(100);

  const result = bettingMathService.calculateCLV(yourOdds, closingOdds, betAmount);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">📈 Closing Line Value (CLV) Calculator</h2>
      <p className="text-text-secondary mb-6">
        CLV is the BEST PREDICTOR of long-term betting success. Consistently beating the closing line = long-term profitability.
        <span className="block mt-2 text-blue-400 text-sm">
          📊 Sharp bettors consistently achieve positive CLV by identifying value early and acting quickly.
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Your Bet Odds (American)</label>
            <input
              type="number"
              value={yourOdds}
              onChange={(e) => setYourOdds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">The odds when you placed your bet</p>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Closing Odds (American)</label>
            <input
              type="number"
              value={closingOdds}
              onChange={(e) => setClosingOdds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">The odds at game time / closing</p>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Bet Amount ($)</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className={`bg-gradient-to-br rounded-lg p-6 border ${
          result.beatClosingLine
            ? 'from-green-900/40 to-emerald-900/40 border-green-800/30'
            : 'from-red-900/40 to-orange-900/40 border-red-800/30'
        }`}>
          <h3 className="text-lg font-bold text-white mb-4">
            {result.beatClosingLine ? '✅ Beat Closing Line!' : '❌ Missed Closing Line'}
          </h3>

          <div className="space-y-4">
            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-text-secondary text-sm mb-1">CLV</div>
              <div className={`text-4xl font-bold ${result.beatClosingLine ? 'text-green-400' : 'text-red-400'}`}>
                {result.beatClosingLine ? '+' : ''}{result.clvPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-text-secondary mt-1">
                ${result.clv.toFixed(2)} value
              </div>
            </div>

            <div className="bg-dark-card/60 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Estimated EV Gain</div>
              <div className={`text-lg font-bold ${result.estimatedEV > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${result.estimatedEV.toFixed(2)}
              </div>
            </div>

            <div className="bg-dark-card/60 rounded-lg p-4 text-sm">
              <div className="text-text-secondary">{result.analysis}</div>
            </div>

            {result.clvPercentage > 2 && (
              <div className="bg-green-900/40 border border-green-700/50 rounded-lg p-3 text-green-300 text-sm">
                🎯 Excellent! Strong positive CLV indicates sharp betting and good timing.
              </div>
            )}

            {result.clvPercentage < -2 && (
              <div className="bg-orange-900/40 border border-orange-700/50 rounded-lg p-3 text-orange-300 text-sm">
                ⚠️ Work on improving bet timing. Try to identify value earlier or find better lines.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 text-sm text-text-secondary">
        <h4 className="font-bold text-green-400 mb-2">🎓 Why CLV Matters:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Closing lines are the most efficient (sharpest) prices in sports betting</li>
          <li>If you consistently beat closing lines, you're finding value before the market does</li>
          <li>Positive CLV over hundreds of bets = long-term profitability (even if some individual bets lose)</li>
          <li>Track your CLV across all bets to measure your betting skill</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// VIG CALCULATOR
// ============================================================================
function VigCalculator() {
  const [team1Odds, setTeam1Odds] = useState(-110);
  const [team2Odds, setTeam2Odds] = useState(-110);

  const result = bettingMathService.calculateVigFreeOdds(team1Odds, team2Odds);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">🔍 Vig-Free Odds Calculator</h2>
      <p className="text-text-secondary mb-6">
        Remove the bookmaker's vig (juice/margin) to find the true fair odds. Essential for accurate EV calculations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Team 1 Odds (American)</label>
            <input
              type="number"
              value={team1Odds}
              onChange={(e) => setTeam1Odds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Team 2 Odds (American)</label>
            <input
              type="number"
              value={team2Odds}
              onChange={(e) => setTeam2Odds(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
            <div className="text-sm font-bold text-blue-400 mb-2">Bookmaker's Vig</div>
            <div className="text-3xl font-bold text-white">{result.vigPercentage.toFixed(2)}%</div>
            <div className="text-xs text-text-secondary mt-1">
              Lower vig = Better for bettors. Look for books with {'<'}5% vig.
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-6 border border-purple-800/30">
            <h3 className="text-lg font-bold text-white mb-4">Team 1 Fair Odds</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Probability:</span>
                <span className="font-bold text-white">{(result.team1.fairProb * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">American:</span>
                <span className="font-bold text-white">{result.team1.fairAmericanOdds > 0 ? '+' : ''}{result.team1.fairAmericanOdds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Decimal:</span>
                <span className="font-bold text-white">{result.team1.fairDecimalOdds.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-6 border border-blue-800/30">
            <h3 className="text-lg font-bold text-white mb-4">Team 2 Fair Odds</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Probability:</span>
                <span className="font-bold text-white">{(result.team2.fairProb * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">American:</span>
                <span className="font-bold text-white">{result.team2.fairAmericanOdds > 0 ? '+' : ''}{result.team2.fairAmericanOdds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Decimal:</span>
                <span className="font-bold text-white">{result.team2.fairDecimalOdds.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// POISSON CALCULATOR
// ============================================================================
function PoissonCalculator() {
  const [homeAvg, setHomeAvg] = useState(27);
  const [awayAvg, setAwayAvg] = useState(24);
  const [totalLine, setTotalLine] = useState(48);

  const result = bettingMathService.poissonScorePrediction(homeAvg, awayAvg, totalLine);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">🎲 Poisson Score Predictor</h2>
      <p className="text-text-secondary mb-6">
        Uses Poisson distribution to predict game scores based on team average scoring rates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Home Team Avg Score</label>
            <input
              type="number"
              step="0.1"
              value={homeAvg}
              onChange={(e) => setHomeAvg(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Away Team Avg Score</label>
            <input
              type="number"
              step="0.1"
              value={awayAvg}
              onChange={(e) => setAwayAvg(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Total Line</label>
            <input
              type="number"
              step="0.5"
              value={totalLine}
              onChange={(e) => setTotalLine(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 rounded-lg p-6 border border-green-800/30">
            <h3 className="text-lg font-bold text-white mb-4">Win Probabilities</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Home Win</span>
                  <span className="text-white font-bold">{result.homeWinProb.toFixed(2)}%</span>
                </div>
                <div className="bg-dark-card rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${result.homeWinProb}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Away Win</span>
                  <span className="text-white font-bold">{result.awayWinProb.toFixed(2)}%</span>
                </div>
                <div className="bg-dark-card rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${result.awayWinProb}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-4 border border-purple-800/30">
            <h3 className="text-sm font-bold text-white mb-2">Most Likely Score</h3>
            <div className="text-3xl font-bold text-white text-center">
              {result.mostLikelyScore.home} - {result.mostLikelyScore.away}
            </div>
            <div className="text-center text-sm text-text-secondary mt-1">
              {result.mostLikelyScore.probability.toFixed(2)}% probability
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-4 border ${
              result.over.probability > 50 ? 'bg-green-900/40 border-green-800/30' : 'bg-dark-surface/40 border-dark-border'
            }`}>
              <div className="text-xs text-text-secondary mb-1">Over {totalLine}</div>
              <div className="text-xl font-bold text-white">{result.over.probability.toFixed(1)}%</div>
            </div>
            <div className={`rounded-lg p-4 border ${
              result.under.probability > 50 ? 'bg-green-900/40 border-green-800/30' : 'bg-dark-surface/40 border-dark-border'
            }`}>
              <div className="text-xs text-text-secondary mb-1">Under {totalLine}</div>
              <div className="text-xl font-bold text-white">{result.under.probability.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Likely Scores */}
      <div className="bg-dark-surface/50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-3">Top 10 Most Likely Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {result.scoreProbabilities.slice(0, 10).map((score, idx) => (
            <div key={idx} className="bg-dark-card/60 rounded p-2 text-center">
              <div className="text-white font-bold">{score.score}</div>
              <div className="text-xs text-text-secondary">{score.probability.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARP MONEY DETECTOR
// ============================================================================
function SharpDetector() {
  const [openingLine, setOpeningLine] = useState(-3);
  const [currentLine, setCurrentLine] = useState(-5);
  const [publicPct, setPublicPct] = useState(75);
  const [hoursToGame, setHoursToGame] = useState(48);

  const result = bettingMathService.detectSharpMoney(openingLine, currentLine, publicPct, hoursToGame);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">🔥 Sharp Money Detector</h2>
      <p className="text-text-secondary mb-6">
        Identify when professional bettors (sharps) are betting heavily on one side. Sharp money often predicts outcomes better than public betting.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Opening Line</label>
            <input
              type="number"
              step="0.5"
              value={openingLine}
              onChange={(e) => setOpeningLine(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Current Line</label>
            <input
              type="number"
              step="0.5"
              value={currentLine}
              onChange={(e) => setCurrentLine(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Public Betting % (on favorite)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={publicPct}
              onChange={(e) => setPublicPct(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-2">Hours Until Game</label>
            <input
              type="number"
              value={hoursToGame}
              onChange={(e) => setHoursToGame(Number(e.target.value))}
              className="w-full bg-dark-surface text-text-primary px-4 py-3 rounded-xl border border-dark-border focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className={`bg-gradient-to-br rounded-lg p-6 border ${
          result.confidence === 'high'
            ? 'from-red-900/40 to-orange-900/40 border-red-800/30'
            : result.confidence === 'medium'
            ? 'from-yellow-900/40 to-orange-900/40 border-yellow-800/30'
            : result.confidence === 'low'
            ? 'from-blue-900/40 to-cyan-900/40 border-blue-800/30'
            : 'from-gray-900/40 to-gray-800/40 border-dark-border/30'
        }`}>
          <h3 className="text-lg font-bold text-white mb-4">
            {result.isSharpMoney ? '🔥 Sharp Money Detected!' : '📊 No Sharp Signals'}
          </h3>

          <div className="space-y-4">
            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-text-secondary text-sm mb-1">Confidence Level</div>
              <div className={`text-3xl font-bold ${
                result.confidence === 'high' ? 'text-red-400' :
                result.confidence === 'medium' ? 'text-yellow-400' :
                result.confidence === 'low' ? 'text-blue-400' : 'text-text-secondary'
              }`}>
                {result.confidence.toUpperCase()}
              </div>
            </div>

            <div className="bg-dark-card/60 rounded-lg p-4 space-y-2">
              <div className="text-sm font-bold text-white mb-2">Sharp Indicators:</div>
              {result.indicators.length > 0 ? (
                result.indicators.map((indicator, idx) => (
                  <div key={idx} className="text-sm text-text-secondary flex items-start">
                    <span className="mr-2">•</span>
                    <span>{indicator}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-text-secondary">No sharp indicators detected</div>
              )}
            </div>

            <div className="bg-dark-card/60 rounded-lg p-4">
              <div className="text-sm font-bold text-white mb-2">Recommendation:</div>
              <div className="text-sm text-text-secondary">{result.recommendation}</div>
            </div>

            {result.reverseLineMovement && (
              <div className="bg-orange-900/40 border border-orange-700/50 rounded-lg p-3 text-orange-300 text-sm">
                ⚠️ Reverse line movement is one of the strongest sharp money indicators!
              </div>
            )}

            {result.steamMove && (
              <div className="bg-red-900/40 border border-red-700/50 rounded-lg p-3 text-red-300 text-sm">
                🚨 Steam move detected! This indicates coordinated sharp betting.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-orange-900/20 border border-orange-800/30 rounded-lg p-4 text-sm text-text-secondary">
        <h4 className="font-bold text-orange-400 mb-2">🎓 Sharp Money Signals:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Reverse Line Movement:</strong> Public heavily on one side, but line moves the other way</li>
          <li><strong>Steam Moves:</strong> Sudden sharp line movement (2+ points) across multiple books</li>
          <li><strong>Early Movement:</strong> Line moves significantly 48+ hours before game (sharps bet early)</li>
          <li><strong>Large Movement:</strong> 3+ point line movement indicates heavy sharp action</li>
        </ul>
      </div>
    </div>
  );
}
