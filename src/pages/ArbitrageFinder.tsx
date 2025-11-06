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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-blue-400 hover:text-blue-300">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Arbitrage Finder</h1>
                <p className="text-sm text-gray-400">Find guaranteed profit opportunities</p>
              </div>
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                scanning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {scanning ? '⚡ Scanning...' : '🔍 Scan for Opportunities'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-6 grid md:grid-cols-3 gap-4">
          {/* Filter */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Filter Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('arbitrage')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'arbitrage' ? 'bg-green-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Arbitrage
              </button>
              <button
                onClick={() => setFilter('middle')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filter === 'middle' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Middles
              </button>
            </div>
          </div>

          {/* Min ROI */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">
              Minimum ROI: {minROI}%
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={minROI}
              onChange={(e) => setMinROI(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Bankroll */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Total Bankroll</label>
            <input
              type="number"
              value={totalBankroll}
              onChange={(e) => setTotalBankroll(parseInt(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Summary Stats */}
        {filteredOpps.length > 0 && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Opportunities</div>
              <div className="text-3xl font-bold text-green-400">{filteredOpps.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Avg ROI</div>
              <div className="text-3xl font-bold text-purple-400">
                {(filteredOpps.reduce((sum, o) => sum + o.roi, 0) / filteredOpps.length).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Potential Profit</div>
              <div className="text-3xl font-bold text-blue-400">
                {formatCurrency(filteredOpps.reduce((sum, o) => sum + o.maxProfit, 0))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Best ROI</div>
              <div className="text-3xl font-bold text-yellow-400">
                {Math.max(...filteredOpps.map(o => o.roi)).toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Opportunities List */}
        {filteredOpps.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-xl font-semibold mb-2">No Opportunities Found</div>
            <div className="text-gray-400 mb-6">
              {scanning
                ? 'Scanning for arbitrage opportunities...'
                : 'Click "Scan for Opportunities" to search across multiple bookmakers'}
            </div>
            {!scanning && (
              <button
                onClick={handleScan}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-colors"
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
                className={`backdrop-blur-sm border rounded-lg p-6 ${
                  opp.type === 'arbitrage'
                    ? 'bg-green-900/10 border-green-500/30'
                    : 'bg-blue-900/10 border-blue-500/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          opp.type === 'arbitrage'
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {opp.type === 'arbitrage' ? '💰 ARBITRAGE' : '🎯 MIDDLE'}
                      </span>
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded">
                        {opp.sport}
                      </span>
                      <span className="px-2 py-1 bg-white/10 text-xs rounded capitalize">
                        {opp.market}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          opp.confidence === 'high'
                            ? 'bg-green-600/20 text-green-400'
                            : opp.confidence === 'medium'
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {opp.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>
                    <div className="text-xl font-bold mb-1">
                      {opp.awayTeam} @ {opp.homeTeam}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(opp.gameTime).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {opp.type === 'arbitrage' ? 'Guaranteed Profit' : 'Max Profit'}
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {formatCurrency(opp.maxProfit)}
                    </div>
                    <div className="text-lg text-green-400">ROI: {opp.roi.toFixed(2)}%</div>
                  </div>
                </div>

                {/* Bet Legs */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Leg 1 */}
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">LEG 1</span>
                      <span className="text-xs font-bold text-blue-400">
                        {opp.leg1.bookmaker}
                      </span>
                    </div>
                    <div className="text-lg font-bold mb-1">{opp.leg1.selection}</div>
                    <div className="text-sm text-gray-400 mb-2">
                      Odds: {formatOdds(opp.leg1.odds)}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <div>
                        <div className="text-xs text-gray-400">Stake</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(opp.leg1.optimalStake)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Potential Return</div>
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(opp.leg1.potentialReturn)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leg 2 */}
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">LEG 2</span>
                      <span className="text-xs font-bold text-purple-400">
                        {opp.leg2.bookmaker}
                      </span>
                    </div>
                    <div className="text-lg font-bold mb-1">{opp.leg2.selection}</div>
                    <div className="text-sm text-gray-400 mb-2">
                      Odds: {formatOdds(opp.leg2.odds)}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <div>
                        <div className="text-xs text-gray-400">Stake</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(opp.leg2.optimalStake)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Potential Return</div>
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(opp.leg2.potentialReturn)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Investment</div>
                    <div className="text-2xl font-bold">{formatCurrency(opp.totalStake)}</div>
                  </div>
                  {opp.type === 'middle' && (
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Middle Range</div>
                      <div className="text-lg font-bold">
                        {(opp as MiddleOpportunity).middleRange.min} -{' '}
                        {(opp as MiddleOpportunity).middleRange.max}
                      </div>
                      <div className="text-xs text-gray-500">
                        ~{(opp as MiddleOpportunity).middleProbability}% chance
                      </div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">
                      {opp.type === 'arbitrage' ? 'Guaranteed Return' : 'If Both Win'}
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(opp.totalStake + opp.maxProfit)}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <Link
                    to="/bet-tracker"
                    className="block w-full text-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Track This Opportunity
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">💡 Understanding Opportunities</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-green-400 mb-2">💰 Arbitrage</h4>
              <p>
                Guaranteed profit by betting both sides of a market at different bookmakers.
                No matter the outcome, you profit.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Example: Bet Chiefs -2.5 at +105 (FanDuel) and Bills +3 at -110 (DraftKings).
                One bet always wins.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">🎯 Middle</h4>
              <p>
                Opportunity where BOTH bets can win if the result lands in the "middle" range.
                If only one wins, you break even or profit slightly.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Example: Bet Over 47.5 and Under 49.5. If total is 48 or 49, both win!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
