/**
 * Arbitrage Finder - Line Pointer
 */

import { useState, useEffect } from 'react';
import { arbitrageService } from '../services/arbitrage.service';
import type { ArbitrageOpportunity, MiddleOpportunity } from '../services/arbitrage.service';
import { Link } from 'react-router-dom';

export function ArbitrageFinder() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [middles, setMiddles] = useState<MiddleOpportunity[]>([]);
  const [filter, setFilter] = useState<'all' | 'arbitrage' | 'middle'>('all');
  const [minROI, setMinROI] = useState(0.5);
  const [scanning, setScanning] = useState(false);
  const [totalBankroll, setTotalBankroll] = useState(1000);

  useEffect(() => {
    // Load saved opportunities
    const saved = arbitrageService.loadOpportunities();
    const arbs = saved.filter(o => o.type === 'arbitrage');
    const mids = saved.filter(o => o.type === 'middle') as MiddleOpportunity[];
    setOpportunities(arbs);
    setMiddles(mids);
  }, []);

  const handleScan = async () => {
    setScanning(true);

    // Simulate scanning multiple bookmakers
    // In production, this would call real APIs
    const mockGamesData = [
      {
        gameId: 'game_1',
        sport: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        gameTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [
          {
            bookmaker: 'DraftKings',
            spread: {
              home: { line: -2.5, odds: -110 },
              away: { line: 2.5, odds: -110 }
            },
            total: {
              over: { line: 51.5, odds: -110 },
              under: { line: 51.5, odds: -110 }
            },
            moneyline: {
              home: -140,
              away: +120
            }
          },
          {
            bookmaker: 'FanDuel',
            spread: {
              home: { line: -3, odds: +105 },
              away: { line: 3, odds: -125 }
            },
            total: {
              over: { line: 51, odds: -105 },
              under: { line: 51, odds: -115 }
            },
            moneyline: {
              home: -135,
              away: +115
            }
          },
          {
            bookmaker: 'BetMGM',
            spread: {
              home: { line: -2, odds: -115 },
              away: { line: 2, odds: -105 }
            },
            total: {
              over: { line: 52, odds: -110 },
              under: { line: 52, odds: -110 }
            },
            moneyline: {
              home: -145,
              away: +125
            }
          }
        ]
      },
      {
        gameId: 'game_2',
        sport: 'NFL',
        homeTeam: 'San Francisco 49ers',
        awayTeam: 'Dallas Cowboys',
        gameTime: new Date(Date.now() + 172800000).toISOString(),
        bookmakers: [
          {
            bookmaker: 'Caesars',
            spread: {
              home: { line: -4.5, odds: -108 },
              away: { line: 4.5, odds: -112 }
            },
            total: {
              over: { line: 47.5, odds: -110 },
              under: { line: 47.5, odds: -110 }
            },
            moneyline: {
              home: -200,
              away: +170
            }
          },
          {
            bookmaker: 'PointsBet',
            spread: {
              home: { line: -5, odds: +100 },
              away: { line: 5, odds: -120 }
            },
            total: {
              over: { line: 48.5, odds: -105 },
              under: { line: 48.5, odds: -115 }
            },
            moneyline: {
              home: -190,
              away: +165
            }
          }
        ]
      }
    ];

    // Find opportunities
    const foundArbs = arbitrageService.findArbitrageOpportunities(mockGamesData);
    const foundMiddles = arbitrageService.findMiddleOpportunities(mockGamesData);

    setOpportunities(foundArbs);
    setMiddles(foundMiddles);

    // Save to storage
    arbitrageService.saveOpportunities([...foundArbs, ...foundMiddles]);

    setTimeout(() => setScanning(false), 1500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getFilteredOpportunities = () => {
    let filtered = [...opportunities, ...middles];

    if (filter === 'arbitrage') {
      filtered = opportunities;
    } else if (filter === 'middle') {
      filtered = middles;
    }

    return filtered.filter(o => o.roi >= minROI);
  };

  const filteredOpps = getFilteredOpportunities();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Arbitrage Finder</h1>
            <p className="text-text-secondary text-lg">Find guaranteed profit opportunities across multiple sportsbooks</p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className={`btn-primary ${scanning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {scanning ? '⚡ Scanning...' : '🔍 Scan for Opportunities'}
          </button>
        </div>
      </div>
      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Filter */}
        <div className="card">
          <label className="block text-sm font-semibold text-text-muted mb-3">Filter Type</label>
          <div className="pill-container">
            <button
              onClick={() => setFilter('all')}
              className={`pill-item ${filter === 'all' ? 'pill-item-active' : 'pill-item-inactive'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('arbitrage')}
              className={`pill-item ${filter === 'arbitrage' ? 'pill-item-active' : 'pill-item-inactive'}`}
            >
              Arbitrage
            </button>
            <button
              onClick={() => setFilter('middle')}
              className={`pill-item ${filter === 'middle' ? 'pill-item-active' : 'pill-item-inactive'}`}
            >
              Middles
            </button>
          </div>
        </div>

        {/* Min ROI */}
        <div className="card">
          <label className="block text-sm font-semibold text-text-muted mb-3">
            Minimum ROI: <span className="text-brand-blue-light">{minROI}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={minROI}
            onChange={(e) => setMinROI(parseFloat(e.target.value))}
            className="w-full accent-brand-blue"
          />
        </div>

        {/* Bankroll */}
        <div className="card">
          <label className="block text-sm font-semibold text-text-muted mb-3">Total Bankroll</label>
          <input
            type="number"
            value={totalBankroll}
            onChange={(e) => setTotalBankroll(parseInt(e.target.value))}
            className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2 text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Summary Stats */}
      {filteredOpps.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="stat-card bg-gradient-to-br from-accent-green/10 to-accent-green/5 border-accent-green/30">
            <div className="text-text-muted text-sm mb-1">Total Opportunities</div>
            <div className="text-4xl font-bold text-accent-green-light">{filteredOpps.length}</div>
          </div>
          <div className="stat-card bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 border-brand-purple/30">
            <div className="text-text-muted text-sm mb-1">Avg ROI</div>
            <div className="text-4xl font-bold text-brand-purple-light">
              {(filteredOpps.reduce((sum, o) => sum + o.roi, 0) / filteredOpps.length).toFixed(2)}%
            </div>
          </div>
          <div className="stat-card bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 border-brand-blue/30">
            <div className="text-text-muted text-sm mb-1">Total Potential Profit</div>
            <div className="text-4xl font-bold text-brand-blue-light">
              {formatCurrency(filteredOpps.reduce((sum, o) => sum + o.maxProfit, 0))}
            </div>
          </div>
          <div className="stat-card bg-gradient-to-br from-accent-orange/10 to-accent-orange/5 border-accent-orange/30">
            <div className="text-text-muted text-sm mb-1">Best ROI</div>
            <div className="text-4xl font-bold text-accent-orange">
              {Math.max(...filteredOpps.map(o => o.roi)).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      {filteredOpps.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">No Opportunities Found</h2>
          <p className="text-text-secondary mb-6 text-lg">
            {scanning
              ? 'Scanning for arbitrage opportunities...'
              : 'Click "Scan for Opportunities" to search across multiple bookmakers'}
          </p>
          {!scanning && (
            <button
              onClick={handleScan}
              className="btn-primary"
            >
              🔍 Start Scanning
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOpps.map((opp) => (
            <div
              key={opp.id}
              className={`card ${
                opp.type === 'arbitrage'
                  ? 'bg-gradient-to-br from-accent-green/5 to-accent-green/0 border-accent-green/30'
                  : 'bg-gradient-to-br from-brand-blue/5 to-brand-blue/0 border-brand-blue/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`badge ${
                        opp.type === 'arbitrage' ? 'badge-success' : 'badge-info'
                      }`}
                    >
                      {opp.type === 'arbitrage' ? '💰 ARBITRAGE' : '🎯 MIDDLE'}
                    </span>
                    <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#A78BFA', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                      {opp.sport}
                    </span>
                    <span className="badge badge-secondary capitalize">
                      {opp.market}
                    </span>
                    <span
                      className={`badge ${
                        opp.confidence === 'high'
                          ? 'badge-success'
                          : opp.confidence === 'medium'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {opp.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {opp.awayTeam} @ {opp.homeTeam}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {new Date(opp.gameTime).toLocaleString()}
                  </p>
                </div>

                <div className="stat-card text-right py-4 px-6">
                  <div className="text-text-muted text-xs mb-1">
                    {opp.type === 'arbitrage' ? 'GUARANTEED PROFIT' : 'MAX PROFIT'}
                  </div>
                  <div className="text-3xl font-bold text-accent-green-light mb-1">
                    {formatCurrency(opp.maxProfit)}
                  </div>
                  <div className="text-lg text-accent-green">ROI: {opp.roi.toFixed(2)}%</div>
                </div>
              </div>

              {/* Bet Legs */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Leg 1 */}
                <div className="stat-card bg-gradient-to-br from-brand-blue/10 to-brand-blue/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-muted">LEG 1</span>
                    <span className="badge badge-info text-xs">
                      {opp.leg1.bookmaker}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-text-primary mb-2">{opp.leg1.selection}</div>
                  <div className="text-sm text-text-secondary mb-3">
                    Odds: <span className="font-semibold">{formatOdds(opp.leg1.odds)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-dark-border">
                    <div>
                      <div className="text-xs text-text-muted">Stake</div>
                      <div className="text-lg font-bold text-text-primary">
                        {formatCurrency(opp.leg1.optimalStake)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Return</div>
                      <div className="text-lg font-bold text-accent-green-light">
                        {formatCurrency(opp.leg1.potentialReturn)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leg 2 */}
                <div className="stat-card bg-gradient-to-br from-brand-purple/10 to-brand-purple/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-muted">LEG 2</span>
                    <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.3)', color: '#A78BFA' }}>
                      {opp.leg2.bookmaker}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-text-primary mb-2">{opp.leg2.selection}</div>
                  <div className="text-sm text-text-secondary mb-3">
                    Odds: <span className="font-semibold">{formatOdds(opp.leg2.odds)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-dark-border">
                    <div>
                      <div className="text-xs text-text-muted">Stake</div>
                      <div className="text-lg font-bold text-text-primary">
                        {formatCurrency(opp.leg2.optimalStake)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Return</div>
                      <div className="text-lg font-bold text-accent-green-light">
                        {formatCurrency(opp.leg2.potentialReturn)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="stat-card bg-dark-surface flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm text-text-muted mb-1">Total Investment</div>
                  <div className="text-2xl font-bold text-text-primary">{formatCurrency(opp.totalStake)}</div>
                </div>
                {opp.type === 'middle' && (
                  <div className="text-center">
                    <div className="text-sm text-text-muted mb-1">Middle Range</div>
                    <div className="text-lg font-bold text-text-primary">
                      {(opp as MiddleOpportunity).middleRange.min} -{' '}
                      {(opp as MiddleOpportunity).middleRange.max}
                    </div>
                    <div className="text-xs text-text-dim">
                      ~{(opp as MiddleOpportunity).middleProbability}% chance
                    </div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-sm text-text-muted mb-1">
                    {opp.type === 'arbitrage' ? 'Guaranteed Return' : 'If Both Win'}
                  </div>
                  <div className="text-2xl font-bold text-accent-green-light">
                    {formatCurrency(opp.totalStake + opp.maxProfit)}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to="/bet-tracker"
                className="block w-full text-center btn-primary mt-6"
              >
                Track This Opportunity
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border-brand-purple/30">
        <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="text-3xl">💡</span>
          Understanding Opportunities
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-bold text-accent-green-light mb-3 text-base">💰 Arbitrage</h4>
            <p className="text-text-secondary mb-3">
              Guaranteed profit by betting both sides of a market at different bookmakers.
              No matter the outcome, you profit.
            </p>
            <p className="text-xs text-text-muted">
              Example: Bet Chiefs -2.5 at +105 (FanDuel) and Bills +3 at -110 (DraftKings).
              One bet always wins.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-brand-blue-light mb-3 text-base">🎯 Middle</h4>
            <p className="text-text-secondary mb-3">
              Opportunity where BOTH bets can win if the result lands in the "middle" range.
              If only one wins, you break even or profit slightly.
            </p>
            <p className="text-xs text-text-muted">
              Example: Bet Over 47.5 and Under 49.5. If total is 48 or 49, both win!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
