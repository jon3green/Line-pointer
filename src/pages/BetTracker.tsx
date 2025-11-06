import { useState, useEffect } from 'react';
import { betTrackerService } from '../services/betTracker.service';
import type { Bet, BetStats } from '../services/betTracker.service';
import { Link } from 'react-router-dom';

export function BetTracker() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  // const [editingBet, setEditingBet] = useState<Bet | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-400 hover:text-blue-300">
              ← Back to Games
            </Link>
            <h1 className="text-2xl font-bold">Bet Tracker</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Bet'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Dashboard */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Net Profit</div>
              <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stats.netProfit)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ROI: {stats.roi.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Record</div>
              <div className="text-2xl font-bold">
                {stats.wonBets}-{stats.lostBets}-{stats.pushBets}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Win Rate: {stats.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Staked</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalStaked)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg Stake: {formatCurrency(stats.averageStake)}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Current Streak</div>
              <div className="text-2xl font-bold">
                {stats.currentStreak.count > 0 ? (
                  <span className={stats.currentStreak.type === 'win' ? 'text-green-400' : 'text-red-400'}>
                    {stats.currentStreak.type === 'win' ? 'W' : 'L'}{stats.currentStreak.count}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Longest W: {stats.longestWinStreak} | L: {stats.longestLossStreak}
              </div>
            </div>
          </div>
        )}

        {/* Add Bet Form */}
        {showAddForm && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Bet</h2>
            <form onSubmit={handleAddBet} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sport</label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value as Bet['sport'] })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
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
                <label className="block text-sm text-gray-400 mb-1">Bet Type</label>
                <select
                  value={formData.betType}
                  onChange={(e) => setFormData({ ...formData, betType: e.target.value as Bet['betType'] })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
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
                <label className="block text-sm text-gray-400 mb-1">Away Team</label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="e.g., Kansas City Chiefs"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Home Team</label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="e.g., Buffalo Bills"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Selection</label>
                <input
                  type="text"
                  value={formData.selection}
                  onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="e.g., Chiefs -3, Over 48.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Game Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Odds (American)</label>
                <input
                  type="number"
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="-110"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stake ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Bookmaker (Optional)</label>
                <input
                  type="text"
                  value={formData.bookmaker}
                  onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  placeholder="e.g., DraftKings"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  rows={2}
                  placeholder="e.g., Sharp money on Chiefs, model likes this spot"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Add Bet
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Bets ({stats?.totalBets || 0})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Pending ({stats?.pendingBets || 0})
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'won'
                ? 'bg-green-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Won ({stats?.wonBets || 0})
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'lost'
                ? 'bg-red-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Lost ({stats?.lostBets || 0})
          </button>
        </div>

        {/* Bets List */}
        <div className="space-y-4">
          {bets.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                {filter === 'all'
                  ? "No bets tracked yet. Click '+ Add Bet' to get started!"
                  : `No ${filter} bets found.`}
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Add Your First Bet
                </button>
              )}
            </div>
          ) : (
            bets.map((bet) => (
              <div
                key={bet.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded">
                        {bet.sport}
                      </span>
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded">
                        {bet.betType}
                      </span>
                      {bet.bookmaker && (
                        <span className="text-xs text-gray-400">{bet.bookmaker}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(bet.placedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-lg font-semibold mb-1">
                      {bet.gameDetails.awayTeam} @ {bet.gameDetails.homeTeam}
                    </div>

                    <div className="text-blue-400 font-medium mb-2">
                      {bet.selection} ({formatOdds(bet.odds)})
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-400">Stake:</span>{' '}
                        <span className="font-medium">{formatCurrency(bet.stake)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">To Win:</span>{' '}
                        <span className="font-medium text-green-400">
                          {formatCurrency(bet.toWin)}
                        </span>
                      </div>
                      {bet.actualReturn !== undefined && (
                        <div>
                          <span className="text-gray-400">Profit/Loss:</span>{' '}
                          <span
                            className={`font-medium ${
                              bet.actualReturn - bet.stake >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {formatCurrency(bet.actualReturn - bet.stake)}
                          </span>
                        </div>
                      )}
                    </div>

                    {bet.notes && (
                      <div className="mt-2 text-sm text-gray-400 italic">
                        Note: {bet.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {bet.result === 'pending' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'won')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Won
                        </button>
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'lost')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Lost
                        </button>
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'push')}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Push
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          bet.result === 'won'
                            ? 'bg-green-600 text-white'
                            : bet.result === 'lost'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {bet.result.toUpperCase()}
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteBet(bet.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats by Sport/Type - Show if we have data */}
        {stats && stats.settledBets > 0 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* By Sport */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Performance by Sport</h3>
              <div className="space-y-3">
                {Object.entries(stats.statsBySport).map(([sport, sportStats]) => (
                  <div key={sport} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{sport}</div>
                      <div className="text-xs text-gray-400">
                        {sportStats.bets} bets · {sportStats.winRate.toFixed(0)}% win rate
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        sportStats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatCurrency(sportStats.profit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Bet Type */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Performance by Bet Type</h3>
              <div className="space-y-3">
                {Object.entries(stats.statsByBetType).map(([type, typeStats]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{type}</div>
                      <div className="text-xs text-gray-400">
                        {typeStats.bets} bets · {typeStats.winRate.toFixed(0)}% win rate
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        typeStats.profit >= 0 ? 'text-green-400' : 'text-red-400'
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
    </div>
  );
}
