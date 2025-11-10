/**
 * Live Betting Page - Line Pointer
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { liveBettingService } from '../services/liveBetting.service';
import type { LiveGame, LiveBettingAlert, LiveBet } from '../services/liveBetting.service';

export function LiveBetting() {
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
    return status === 'live' ? 'bg-accent-red animate-pulse shadow-glow-red' : 'bg-text-dim';
  };

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
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-3 h-3 bg-accent-red rounded-full animate-pulse shadow-glow-red"></span>
              Live Betting
            </h1>
            <p className="text-text-secondary text-lg">Real-time in-game betting with live odds updates</p>
          </div>
          <div className="stat-card text-center py-3 px-6">
            <div className="text-text-muted text-xs mb-1">LIVE GAMES</div>
            <div className="text-4xl font-bold gradient-text">{liveGames.filter(g => g.status === 'live').length}</div>
          </div>
        </div>
      </div>

      {/* Live Alerts Feed */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-3xl">🔔</span>
            Live Alerts
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`stat-card ${
                  alert.priority === 'high' ? 'border-accent-red bg-accent-red/5' :
                  alert.priority === 'medium' ? 'border-accent-orange bg-accent-orange/5' :
                  'border-dark-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {alert.type === 'scoring' ? '🎯' :
                     alert.type === 'momentum_shift' ? '📊' :
                     alert.type === 'odds_move' ? '📈' :
                     alert.type === 'injury' ? '🚑' : '⏱️'}
                  </span>
                  <div className="flex-1">
                    <p className="text-text-primary font-semibold text-sm mb-1">{alert.message}</p>
                    <p className="text-text-muted text-xs">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Games Grid */}
      {liveGames.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-surface border border-dark-border rounded-full mb-6">
            <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-text-secondary mb-6 text-lg">No live games at the moment</p>
          <button
            onClick={() => {
              liveBettingService.clearAllData();
              loadData();
            }}
            className="btn-primary"
          >
            Generate Demo Games
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {liveGames.map(game => (
            <div key={game.id} className="card overflow-hidden">
              {/* Game Header */}
              <div className="bg-dark-surface px-6 py-4 flex items-center justify-between border-b border-dark-border">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(game.status)}`}>
                    {game.status.toUpperCase()}
                  </span>
                  <span className="badge badge-info">{game.sport}</span>
                  <span className="text-text-primary font-bold">{game.period}</span>
                  <span className="text-text-primary font-mono font-semibold">{game.timeRemaining}</span>
                </div>
                {game.momentum && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Momentum:</span>
                    <span className="badge badge-warning font-bold">
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
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between py-3 px-4 bg-dark-surface rounded-xl border border-dark-border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✈️</span>
                          <span className="text-text-primary font-bold">{game.awayTeam}</span>
                          {game.possession === 'away' && <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-glow-green"></span>}
                        </div>
                        <span className="text-4xl font-bold gradient-text">{game.awayScore}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 bg-dark-surface rounded-xl border border-dark-border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏠</span>
                          <span className="text-text-primary font-bold">{game.homeTeam}</span>
                          {game.possession === 'home' && <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-glow-green"></span>}
                        </div>
                        <span className="text-4xl font-bold gradient-text">{game.homeScore}</span>
                      </div>
                    </div>

                    {game.situation && (
                      <div className="stat-card mb-4">
                        <p className="text-text-secondary text-sm text-center font-medium">{game.situation}</p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    {game.stats && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-muted uppercase">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="stat-card py-2">
                            <div className="text-text-muted">Total Yards</div>
                            <div className="text-text-primary font-bold">
                              {game.stats.away.totalYards} - {game.stats.home.totalYards}
                            </div>
                          </div>
                          <div className="stat-card py-2">
                            <div className="text-text-muted">Turnovers</div>
                            <div className="text-text-primary font-bold">
                              {game.stats.away.turnovers} - {game.stats.home.turnovers}
                            </div>
                          </div>
                          <div className="stat-card py-2">
                            <div className="text-text-muted">3rd Down</div>
                            <div className="text-text-primary font-bold text-[10px]">
                              {game.stats.away.thirdDownConversions} / {game.stats.home.thirdDownConversions}
                            </div>
                          </div>
                          <div className="stat-card py-2">
                            <div className="text-text-muted">Red Zone</div>
                            <div className="text-text-primary font-bold text-[10px]">
                              {game.stats.away.redZoneEfficiency} / {game.stats.home.redZoneEfficiency}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Live Odds */}
                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-bold text-text-muted uppercase mb-4">Live Odds</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Spread */}
                      <div className="stat-card">
                        <div className="text-xs font-bold text-text-muted mb-3 text-center">SPREAD</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'spread',
                              `${game.awayTeam} ${game.liveOdds.spread.away > 0 ? '+' : ''}${game.liveOdds.spread.away}`,
                              game.liveOdds.spread.awayOdds
                            )}
                            className="w-full bg-gradient-brand hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg hover:shadow-glow-blue"
                          >
                            <div className="text-sm font-semibold">{game.awayTeam}</div>
                            <div className="text-xl font-bold">
                              {game.liveOdds.spread.away > 0 ? '+' : ''}{game.liveOdds.spread.away}
                            </div>
                            <div className="text-xs opacity-90">
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
                            className="w-full bg-gradient-brand hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg hover:shadow-glow-blue"
                          >
                            <div className="text-sm font-semibold">{game.homeTeam}</div>
                            <div className="text-xl font-bold">
                              {game.liveOdds.spread.home > 0 ? '+' : ''}{game.liveOdds.spread.home}
                            </div>
                            <div className="text-xs opacity-90">
                              {game.liveOdds.spread.homeOdds > 0 ? '+' : ''}{game.liveOdds.spread.homeOdds}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="stat-card">
                        <div className="text-xs font-bold text-text-muted mb-3 text-center">TOTAL</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'total',
                              `Over ${game.liveOdds.total.over}`,
                              game.liveOdds.total.overOdds
                            )}
                            className="w-full bg-gradient-to-r from-accent-green to-accent-green-light hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg hover:shadow-glow-green"
                          >
                            <div className="text-sm font-semibold">Over</div>
                            <div className="text-xl font-bold">{game.liveOdds.total.over}</div>
                            <div className="text-xs opacity-90">
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
                            className="w-full bg-accent-red hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg hover:shadow-glow-red"
                          >
                            <div className="text-sm font-semibold">Under</div>
                            <div className="text-xl font-bold">{game.liveOdds.total.under}</div>
                            <div className="text-xs opacity-90">
                              {game.liveOdds.total.underOdds > 0 ? '+' : ''}{game.liveOdds.total.underOdds}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Moneyline */}
                      <div className="stat-card">
                        <div className="text-xs font-bold text-text-muted mb-3 text-center">MONEYLINE</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => openBetSlip(
                              game,
                              'moneyline',
                              game.awayTeam,
                              game.liveOdds.moneyline.away
                            )}
                            className="w-full bg-gradient-purple hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg"
                          >
                            <div className="text-sm font-semibold">{game.awayTeam}</div>
                            <div className="text-xl font-bold">
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
                            className="w-full bg-gradient-purple hover:brightness-90 text-white rounded-xl p-3 transition-all shadow-lg"
                          >
                            <div className="text-sm font-semibold">{game.homeTeam}</div>
                            <div className="text-xl font-bold">
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
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Your Live Bets</h2>
          <div className="space-y-4">
            {liveBets.map(bet => (
              <div key={bet.id} className="stat-card flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-text-primary font-bold mb-1">{bet.gameDetails}</p>
                  <p className="text-text-secondary text-sm mb-2">{bet.selection}</p>
                  <p className="text-text-muted text-xs">
                    Placed in {bet.placedInPeriod} at {bet.placedScore} • {new Date(bet.placedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-primary font-bold text-xl mb-1">${bet.stake}</p>
                  <p className="text-accent-green-light text-sm font-semibold">To win: ${bet.toWin.toFixed(2)}</p>
                  <p className="text-text-muted text-xs">{bet.odds > 0 ? '+' : ''}{bet.odds}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bet Slip Modal */}
      {showBetSlip && activeBet && selectedGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Place Live Bet</h3>

            <div className="stat-card mb-6">
              <p className="text-text-muted text-sm mb-2">{selectedGame.awayTeam} @ {selectedGame.homeTeam}</p>
              <p className="text-text-primary font-bold text-xl mb-2">{activeBet.selection}</p>
              <p className="text-text-secondary font-semibold mb-3">{activeBet.odds > 0 ? '+' : ''}{activeBet.odds}</p>
              <p className="badge badge-warning text-xs">
                {selectedGame.period} • {selectedGame.timeRemaining} • {selectedGame.awayScore}-{selectedGame.homeScore}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-text-secondary text-sm font-semibold mb-2">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
                min="1"
              />
            </div>

            <div className="stat-card bg-dark-surface mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted font-semibold">To Win:</span>
                <span className="text-accent-green-light font-bold text-lg">${(betAmount * Math.abs(activeBet.odds) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBetSlip(false);
                  setActiveBet(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                className="flex-1 btn-primary"
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
