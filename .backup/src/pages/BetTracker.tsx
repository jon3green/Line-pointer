import { useState, useEffect } from 'react';
import { betTrackerService } from '../services/betTracker.service';
import type { Bet, BetStats } from '../services/betTracker.service';
import { Link } from 'react-router-dom';

export function BetTracker() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  // Form state
  const [formData, setFormData] = useState({
    sport: 'NFL' as Bet['sport'],
    homeTeam: '',
    awayTeam: '',
    date: new Date().toISOString().split('T')[0],
    betType: 'spread' as Bet['betType'],
    selection: '',
    odds: -110,
    stake: 100,
    bookmaker: '',
    notes: '',
  });

  useEffect(() => {
    loadBets();
  }, [filter]);

  const loadBets = () => {
    let allBets = betTrackerService.getAllBets();

    if (filter !== 'all') {
      allBets = allBets.filter(bet => bet.result === filter);
    }

    setBets(allBets);
    setStats(betTrackerService.calculateStats());
  };

  const handleAddBet = (e: React.FormEvent) => {
    e.preventDefault();

    betTrackerService.addBet({
      sport: formData.sport,
      gameDetails: {
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        date: formData.date,
      },
      betType: formData.betType,
      selection: formData.selection,
      odds: formData.odds,
      stake: formData.stake,
      bookmaker: formData.bookmaker || undefined,
      notes: formData.notes || undefined,
      result: 'pending',
    });

    // Reset form
    setFormData({
      ...formData,
      homeTeam: '',
      awayTeam: '',
      selection: '',
      notes: '',
    });

    setShowAddForm(false);
    loadBets();
  };

  const handleUpdateResult = (betId: string, result: Bet['result']) => {
    betTrackerService.updateBet(betId, { result });
    loadBets();
  };

  const handleDeleteBet = (betId: string) => {
    if (confirm('Are you sure you want to delete this bet?')) {
      betTrackerService.deleteBet(betId);
      loadBets();
    }
  };

  const handleExportCSV = () => {
    const csv = betTrackerService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bets_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Games</span>
          </Link>
          <h1 className="text-4xl font-bold text-text-primary">Bet Tracker</h1>
          <p className="text-text-secondary mt-2">Track your bets and analyze your performance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-success flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={showAddForm ? "btn-secondary" : "btn-primary"}
          >
            {showAddForm ? 'Cancel' : '+ Add Bet'}
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="stat-card">
            <div className="text-text-muted text-sm mb-2 font-semibold">NET PROFIT</div>
            <div className={`text-3xl font-bold mb-1 ${stats.netProfit >= 0 ? 'gradient-text-green' : 'text-accent-red'}`}>
              {formatCurrency(stats.netProfit)}
            </div>
            <div className="text-text-dim text-xs">
              ROI: {stats.roi.toFixed(1)}%
            </div>
          </div>

          <div className="stat-card">
            <div className="text-text-muted text-sm mb-2 font-semibold">RECORD</div>
            <div className="text-3xl font-bold text-text-primary mb-1">
              {stats.wonBets}-{stats.lostBets}-{stats.pushBets}
            </div>
            <div className="text-text-dim text-xs">
              Win Rate: {stats.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="stat-card">
            <div className="text-text-muted text-sm mb-2 font-semibold">TOTAL STAKED</div>
            <div className="text-3xl font-bold text-text-primary mb-1">{formatCurrency(stats.totalStaked)}</div>
            <div className="text-text-dim text-xs">
              Avg: {formatCurrency(stats.averageStake)}
            </div>
          </div>

          <div className="stat-card">
            <div className="text-text-muted text-sm mb-2 font-semibold">CURRENT STREAK</div>
            <div className="text-3xl font-bold mb-1">
              {stats.currentStreak.count > 0 ? (
                <span className={stats.currentStreak.type === 'win' ? 'gradient-text-green' : 'text-accent-red'}>
                  {stats.currentStreak.type === 'win' ? 'W' : 'L'}{stats.currentStreak.count}
                </span>
              ) : (
                <span className="text-text-muted">-</span>
              )}
            </div>
            <div className="text-text-dim text-xs">
              Best W: {stats.longestWinStreak} | L: {stats.longestLossStreak}
            </div>
          </div>
        </div>
      )}

      {/* Add Bet Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Add New Bet</h2>
          <form onSubmit={handleAddBet} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Sport</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value as Bet['sport'] })}
                className="input"
              >
                <option value="NFL">NFL</option>
                <option value="NCAAF">NCAAF</option>
                <option value="NBA">NBA</option>
                <option value="NCAAB">NCAAB</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Bet Type</label>
              <select
                value={formData.betType}
                onChange={(e) => setFormData({ ...formData, betType: e.target.value as Bet['betType'] })}
                className="input"
              >
                <option value="spread">Spread</option>
                <option value="moneyline">Moneyline</option>
                <option value="total">Total (Over/Under)</option>
                <option value="prop">Prop Bet</option>
                <option value="parlay">Parlay</option>
                <option value="teaser">Teaser</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Away Team</label>
              <input
                type="text"
                value={formData.awayTeam}
                onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                className="input"
                placeholder="e.g., Kansas City Chiefs"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Home Team</label>
              <input
                type="text"
                value={formData.homeTeam}
                onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                className="input"
                placeholder="e.g., Buffalo Bills"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Selection</label>
              <input
                type="text"
                value={formData.selection}
                onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                className="input"
                placeholder="e.g., Chiefs -3, Over 48.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Game Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Odds (American)</label>
              <input
                type="number"
                value={formData.odds}
                onChange={(e) => setFormData({ ...formData, odds: parseInt(e.target.value) })}
                className="input"
                placeholder="-110"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Stake ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.stake}
                onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) })}
                className="input"
                placeholder="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-medium">Bookmaker (Optional)</label>
              <input
                type="text"
                value={formData.bookmaker}
                onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                className="input"
                placeholder="e.g., DraftKings"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-2 font-medium">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="e.g., Sharp money on Chiefs, model likes this spot"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full btn-primary text-lg py-4"
              >
                Add Bet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="pill-container inline-flex">
        <button
          onClick={() => setFilter('all')}
          className={`pill-item ${filter === 'all' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          All ({stats?.totalBets || 0})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`pill-item ${filter === 'pending' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Pending ({stats?.pendingBets || 0})
        </button>
        <button
          onClick={() => setFilter('won')}
          className={`pill-item ${filter === 'won' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Won ({stats?.wonBets || 0})
        </button>
        <button
          onClick={() => setFilter('lost')}
          className={`pill-item ${filter === 'lost' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Lost ({stats?.lostBets || 0})
        </button>
      </div>

      {/* Bets List */}
      <div className="space-y-4">
        {bets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-surface border border-dark-border rounded-full mb-6">
              <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-text-secondary mb-6 text-lg">
              {filter === 'all'
                ? "No bets tracked yet. Click '+ Add Bet' to get started!"
                : `No ${filter} bets found.`}
            </div>
            {!showAddForm && filter === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Your First Bet
              </button>
            )}
          </div>
        ) : (
          bets.map((bet) => (
            <div
              key={bet.id}
              className="card card-hover"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="badge badge-info">
                      {bet.sport}
                    </span>
                    <span className="badge badge-info bg-brand-purple/20 text-brand-purple-light border-brand-purple/40">
                      {bet.betType}
                    </span>
                    {bet.bookmaker && (
                      <span className="text-xs text-text-muted">{bet.bookmaker}</span>
                    )}
                    <span className="text-xs text-text-dim ml-auto">
                      {new Date(bet.placedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-text-primary mb-2">
                    {bet.gameDetails.awayTeam} @ {bet.gameDetails.homeTeam}
                  </div>

                  <div className="gradient-text text-lg font-bold mb-3">
                    {bet.selection} ({formatOdds(bet.odds)})
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                    <div className="stat-card py-2">
                      <div className="text-text-muted text-xs mb-1">STAKE</div>
                      <div className="font-bold text-text-primary">{formatCurrency(bet.stake)}</div>
                    </div>
                    <div className="stat-card py-2">
                      <div className="text-text-muted text-xs mb-1">TO WIN</div>
                      <div className="font-bold gradient-text-green">
                        {formatCurrency(bet.toWin)}
                      </div>
                    </div>
                    {bet.actualReturn !== undefined && (
                      <div className="stat-card py-2">
                        <div className="text-text-muted text-xs mb-1">PROFIT/LOSS</div>
                        <div
                          className={`font-bold ${
                            bet.actualReturn - bet.stake >= 0
                              ? 'gradient-text-green'
                              : 'text-accent-red'
                          }`}
                        >
                          {formatCurrency(bet.actualReturn - bet.stake)}
                        </div>
                      </div>
                    )}
                  </div>

                  {bet.notes && (
                    <div className="mt-3 p-3 bg-dark-surface/50 border border-dark-border rounded-2xl">
                      <p className="text-sm text-text-secondary italic">
                        <span className="text-text-muted font-semibold not-italic">Note:</span> {bet.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  {bet.result === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateResult(bet.id, 'won')}
                        className="px-4 py-2 bg-gradient-success text-white text-sm font-bold rounded-full hover:brightness-90 transition-all"
                      >
                        Won
                      </button>
                      <button
                        onClick={() => handleUpdateResult(bet.id, 'lost')}
                        className="px-4 py-2 bg-gradient-to-r from-accent-red to-red-600 text-white text-sm font-bold rounded-full hover:brightness-90 transition-all"
                      >
                        Lost
                      </button>
                      <button
                        onClick={() => handleUpdateResult(bet.id, 'push')}
                        className="px-4 py-2 bg-dark-card border-2 border-dark-border text-text-secondary text-sm font-bold rounded-full hover:border-brand-blue/50 transition-all"
                      >
                        Push
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`badge ${
                        bet.result === 'won'
                          ? 'badge-success'
                          : bet.result === 'lost'
                          ? 'badge-danger'
                          : 'badge-info'
                      } text-sm px-4 py-2`}
                    >
                      {bet.result.toUpperCase()}
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteBet(bet.id)}
                    className="text-sm text-accent-red hover:text-red-400 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats by Sport/Type */}
      {stats && stats.settledBets > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Sport */}
          <div className="card">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Performance by Sport</h3>
            <div className="space-y-4">
              {Object.entries(stats.statsBySport).map(([sport, sportStats]) => (
                <div key={sport} className="flex items-center justify-between p-4 bg-dark-surface/50 rounded-2xl border border-dark-border hover:border-brand-blue/30 transition-all">
                  <div>
                    <div className="font-bold text-text-primary text-lg">{sport}</div>
                    <div className="text-sm text-text-muted">
                      {sportStats.bets} bets · {sportStats.winRate.toFixed(0)}% win rate
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      sportStats.profit >= 0 ? 'gradient-text-green' : 'text-accent-red'
                    }`}
                  >
                    {formatCurrency(sportStats.profit)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Bet Type */}
          <div className="card">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Performance by Bet Type</h3>
            <div className="space-y-4">
              {Object.entries(stats.statsByBetType).map(([type, typeStats]) => (
                <div key={type} className="flex items-center justify-between p-4 bg-dark-surface/50 rounded-2xl border border-dark-border hover:border-brand-blue/30 transition-all">
                  <div>
                    <div className="font-bold text-text-primary text-lg capitalize">{type}</div>
                    <div className="text-sm text-text-muted">
                      {typeStats.bets} bets · {typeStats.winRate.toFixed(0)}% win rate
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      typeStats.profit >= 0 ? 'gradient-text-green' : 'text-accent-red'
                    }`}
                  >
                    {formatCurrency(typeStats.profit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
