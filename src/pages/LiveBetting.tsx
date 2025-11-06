/**
 * Live Betting Page
 * Real-time in-game betting with live scores and odds
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveBettingService } from '../services/liveBetting.service';
import type { LiveGame, LiveBettingAlert, LiveBet } from '../services/liveBetting.service';

export function LiveBetting() {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [alerts, setAlerts] = useState<LiveBettingAlert[]>([]);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [activeBet, setActiveBet] = useState<{
    type: 'spread' | 'total' | 'moneyline';
    selection: string;
    odds: number;
  } | null>(null);

  useEffect(() => {
    // Load initial data
    loadData();

    // Start live updates
    liveBettingService.startLiveUpdates((updatedGames) => {
      setLiveGames(updatedGames);
      setAlerts(liveBettingService.getLiveAlerts());
    });

    // Cleanup on unmount
    return () => {
      liveBettingService.stopLiveUpdates();
    };
  }, []);

  const loadData = () => {
    setLiveGames(liveBettingService.getLiveGames());
    setAlerts(liveBettingService.getLiveAlerts());
    setLiveBets(liveBettingService.getLiveBets());
  };

  const handlePlaceBet = () => {
    if (!selectedGame || !activeBet) return;

    const result = liveBettingService.placeLiveBet(
      selectedGame.id,
      activeBet.type,
      activeBet.selection,
      activeBet.odds,
      betAmount
    );

    if (result.success) {
      alert('✅ Live bet placed successfully!');
      setShowBetSlip(false);
      setActiveBet(null);
      loadData();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const openBetSlip = (game: LiveGame, type: 'spread' | 'total' | 'moneyline', selection: string, odds: number) => {
    setSelectedGame(game);
    setActiveBet({ type, selection, odds });
    setShowBetSlip(true);
  };

  const getStatusColor = (status: LiveGame['status']) => {
    return status === 'live' ? 'bg-red-600 animate-pulse' : 'bg-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🔴 Live Betting</h1>
            <p className="text-gray-300">Real-time in-game betting with live odds updates</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Live Games</div>
            <div className="text-3xl font-bold text-white">{liveGames.filter(g => g.status === 'live').length}</div>
          </div>
        </div>
      </div>

      {/* Live Alerts Feed */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="mr-2">🔔</span>
            Live Alerts
          </h2>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center gap-2 p-2 rounded ${
                  alert.priority === 'high' ? 'bg-red-900/20 border border-red-600' :
                  alert.priority === 'medium' ? 'bg-yellow-900/20 border border-yellow-600' :
                  'bg-gray-800'
                }`}
              >
                <span className="text-xl">
                  {alert.type === 'scoring' ? '🎯' :
                   alert.type === 'momentum_shift' ? '📊' :
                   alert.type === 'odds_move' ? '📈' :
                   alert.type === 'injury' ? '🚑' : '⏱️'}
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm">{alert.message}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Games Grid */}
      {liveGames.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">No live games at the moment</p>
          <button
            onClick={() => {
              liveBettingService.clearAllData();
              loadData();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Generate Demo Games
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {liveGames.map(game => (
            <div key={game.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {/* Game Header */}
              <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(game.status)}`}>
                    {game.status.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">{game.sport}</span>
                  <span className="text-white font-semibold">{game.period}</span>
                  <span className="text-white font-mono">{game.timeRemaining}</span>
                </div>
                {game.momentum && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Momentum:</span>
                    <span className="text-sm text-yellow-500 font-semibold">
                      {game.momentum.team === 'home' ? '🏠' : '✈️'} {game.momentum.strength.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Scores & Stats */}
                  <div className="lg:col-span-1">
                    {/* Score */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✈️</span>
                          <span className="text-white font-semibold">{game.awayTeam}</span>
                          {game.possession === 'away' && <span className="text-green-500 text-xl">●</span>}
                        </div>
                        <span className="text-3xl font-bold text-white">{game.awayScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏠</span>
                          <span className="text-white font-semibold">{game.homeTeam}</span>
                          {game.possession === 'home' && <span className="text-green-500 text-xl">●</span>}
                        </div>
                        <span className="text-3xl font-bold text-white">{game.homeScore}</span>
                      </div>
                    </div>

                    {game.situation && (
                      <div className="bg-gray-800 rounded p-2 mb-4">
                        <p className="text-gray-300 text-sm text-center">{game.situation}</p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    {game.stats && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-400">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-800 rounded p-2">
                            <div className="text-gray-400">Total Yards</div>
                            <div className="text-white font-semibold">
                              {game.stats.away.totalYards} - {game.stats.home.totalYards}
                            </div>
                          </div>
                          <div className="bg-gray-800 rounded p-2">
                            <div className="text-gray-400">Turnovers</div>
                            <div className="text-white font-semibold">
                              {game.stats.away.turnovers} - {game.stats.home.turnovers}
                            </div>
                          </div>
                          <div className="bg-gray-800 rounded p-2">
                            <div className="text-gray-400">3rd Down</div>
                            <div className="text-white font-semibold text-[10px]">
                              {game.stats.away.thirdDownConversions} / {game.stats.home.thirdDownConversions}
                            </div>
                          </div>
                          <div className="bg-gray-800 rounded p-2">
                            <div className="text-gray-400">Red Zone</div>
                            <div className="text-white font-semibold text-[10px]">
                              {game.stats.away.redZoneEfficiency} / {game.stats.home.redZoneEfficiency}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Live Odds */}
                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Live Odds</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Spread */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-2 text-center">SPREAD</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'spread',
                              `${game.awayTeam} ${game.liveOdds.spread.away > 0 ? '+' : ''}${game.liveOdds.spread.away}`,
                              game.liveOdds.spread.awayOdds
                            )}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">{game.awayTeam}</div>
                            <div className="text-lg font-bold">
                              {game.liveOdds.spread.away > 0 ? '+' : ''}{game.liveOdds.spread.away}
                            </div>
                            <div className="text-xs text-gray-300">
                              {game.liveOdds.spread.awayOdds > 0 ? '+' : ''}{game.liveOdds.spread.awayOdds}
                            </div>
                          </button>
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'spread',
                              `${game.homeTeam} ${game.liveOdds.spread.home > 0 ? '+' : ''}${game.liveOdds.spread.home}`,
                              game.liveOdds.spread.homeOdds
                            )}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">{game.homeTeam}</div>
                            <div className="text-lg font-bold">
                              {game.liveOdds.spread.home > 0 ? '+' : ''}{game.liveOdds.spread.home}
                            </div>
                            <div className="text-xs text-gray-300">
                              {game.liveOdds.spread.homeOdds > 0 ? '+' : ''}{game.liveOdds.spread.homeOdds}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-2 text-center">TOTAL</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'total',
                              `Over ${game.liveOdds.total.over}`,
                              game.liveOdds.total.overOdds
                            )}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">Over</div>
                            <div className="text-lg font-bold">{game.liveOdds.total.over}</div>
                            <div className="text-xs text-gray-300">
                              {game.liveOdds.total.overOdds > 0 ? '+' : ''}{game.liveOdds.total.overOdds}
                            </div>
                          </button>
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'total',
                              `Under ${game.liveOdds.total.under}`,
                              game.liveOdds.total.underOdds
                            )}
                            className="w-full bg-red-600 hover:bg-red-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">Under</div>
                            <div className="text-lg font-bold">{game.liveOdds.total.under}</div>
                            <div className="text-xs text-gray-300">
                              {game.liveOdds.total.underOdds > 0 ? '+' : ''}{game.liveOdds.total.underOdds}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Moneyline */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-2 text-center">MONEYLINE</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'moneyline',
                              game.awayTeam,
                              game.liveOdds.moneyline.away
                            )}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">{game.awayTeam}</div>
                            <div className="text-lg font-bold">
                              {game.liveOdds.moneyline.away > 0 ? '+' : ''}{game.liveOdds.moneyline.away}
                            </div>
                          </button>
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'moneyline',
                              game.homeTeam,
                              game.liveOdds.moneyline.home
                            )}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded p-2 transition-colors"
                          >
                            <div className="text-sm font-semibold">{game.homeTeam}</div>
                            <div className="text-lg font-bold">
                              {game.liveOdds.moneyline.home > 0 ? '+' : ''}{game.liveOdds.moneyline.home}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Live Bets */}
      {liveBets.length > 0 && (
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Your Live Bets</h2>
          <div className="space-y-3">
            {liveBets.map(bet => (
              <div key={bet.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold">{bet.gameDetails}</p>
                  <p className="text-gray-400 text-sm">{bet.selection}</p>
                  <p className="text-gray-500 text-xs">
                    Placed in {bet.placedInPeriod} at {bet.placedScore} • {new Date(bet.placedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">${bet.stake}</p>
                  <p className="text-green-500 text-sm">To win: ${bet.toWin.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">{bet.odds > 0 ? '+' : ''}{bet.odds}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bet Slip Modal */}
      {showBetSlip && activeBet && selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Place Live Bet</h3>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">{selectedGame.awayTeam} @ {selectedGame.homeTeam}</p>
              <p className="text-white font-semibold text-lg">{activeBet.selection}</p>
              <p className="text-gray-400">{activeBet.odds > 0 ? '+' : ''}{activeBet.odds}</p>
              <p className="text-yellow-500 text-xs mt-2">
                {selectedGame.period} • {selectedGame.timeRemaining} • {selectedGame.awayScore}-{selectedGame.homeScore}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                min="1"
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">To Win:</span>
                <span className="text-green-500 font-bold">${(betAmount * Math.abs(activeBet.odds) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBetSlip(false);
                  setActiveBet(null);
                }}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                Place Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
