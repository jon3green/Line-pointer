'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function BetTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bets, setBets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBet, setShowAddBet] = useState(false);
  const [filter, setFilter] = useState({ sport: 'all', status: 'all', betType: 'all' });

  // New bet form state
  const [newBet, setNewBet] = useState({
    gameId: '',
    sport: 'NFL',
    betType: 'spread',
    selection: '',
    odds: -110,
    stake: 100,
    line: 0,
    bookmaker: 'DraftKings',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchBets = useCallback(async () => {
    try {
      const sportParam = filter.sport !== 'all' ? `&sport=${filter.sport}` : '';
      const statusParam = filter.status !== 'all' ? `&status=${filter.status}` : '';
      const typeParam = filter.betType !== 'all' ? `&betType=${filter.betType}` : '';

      const res = await fetch(`/api/bets?limit=50${sportParam}${statusParam}${typeParam}`);
      const data = await res.json();
      if (data.success) {
        setBets(data.bets);
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const sportParam = filter.sport !== 'all' ? `?sport=${filter.sport}` : '';
      const res = await fetch(`/api/bets/stats${sportParam}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBets();
      fetchStats();
    }
  }, [status, fetchBets, fetchStats]);

  const handleAddBet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBet),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddBet(false);
        fetchBets();
        fetchStats();
        // Reset form
        setNewBet({
          gameId: '',
          sport: 'NFL',
          betType: 'spread',
          selection: '',
          odds: -110,
          stake: 100,
          line: 0,
          bookmaker: 'DraftKings',
        });
      }
    } catch (error) {
      console.error('Error adding bet:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-green-400';
      case 'lost': return 'text-red-400';
      case 'push': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    switch (status) {
      case 'won': return `${baseClasses} bg-green-900 text-green-200`;
      case 'lost': return `${baseClasses} bg-red-900 text-red-200`;
      case 'push': return `${baseClasses} bg-yellow-900 text-yellow-200`;
      default: return `${baseClasses} bg-gray-700 text-gray-300`;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading bets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bet Tracker</h1>
            <p className="text-gray-400">Track all your bets and performance</p>
          </div>
          <button
            onClick={() => setShowAddBet(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            + Add Bet
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Total Bets</div>
              <div className="text-3xl font-bold">{stats.overall.totalBets}</div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.overall.wonBets}W - {stats.overall.lostBets}L
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Win Rate</div>
              <div className="text-3xl font-bold text-green-400">{stats.overall.winRate}%</div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.overall.wonBets} / {stats.overall.wonBets + stats.overall.lostBets} settled
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Net Profit</div>
              <div className={`text-3xl font-bold ${stats.overall.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${stats.overall.netProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ROI: {stats.overall.roi.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Current Streak</div>
              <div className={`text-3xl font-bold ${stats.streaks.current > 0 ? 'text-green-400' : stats.streaks.current < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {stats.streaks.current > 0 ? '+' : ''}{stats.streaks.current}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Best: {stats.streaks.bestWinStreak}W
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <select
            value={filter.sport}
            onChange={(e) => setFilter({ ...filter, sport: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Sports</option>
            <option value="NFL">NFL</option>
            <option value="NCAAF">NCAAF</option>
            <option value="NBA">NBA</option>
            <option value="MLB">MLB</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="push">Push</option>
          </select>

          <select
            value={filter.betType}
            onChange={(e) => setFilter({ ...filter, betType: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="spread">Spread</option>
            <option value="moneyline">Moneyline</option>
            <option value="total">Total</option>
            <option value="prop">Props</option>
          </select>
        </div>

        {/* Bets List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-semibold">Game</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Type</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Selection</th>
                  <th className="text-right p-4 text-gray-400 font-semibold">Odds</th>
                  <th className="text-right p-4 text-gray-400 font-semibold">Stake</th>
                  <th className="text-right p-4 text-gray-400 font-semibold">To Win</th>
                  <th className="text-center p-4 text-gray-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-4">
                      <div className="font-semibold">{bet.game?.awayTeam} @ {bet.game?.homeTeam}</div>
                      <div className="text-sm text-gray-400">{bet.sport}</div>
                    </td>
                    <td className="p-4 capitalize">{bet.betType}</td>
                    <td className="p-4 font-medium">{bet.selection}</td>
                    <td className="p-4 text-right">{bet.odds > 0 ? '+' : ''}{bet.odds}</td>
                    <td className="p-4 text-right">${bet.stake.toFixed(2)}</td>
                    <td className="p-4 text-right text-green-400">${bet.potentialWin.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={getStatusBadge(bet.status)}>{bet.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bets.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <div className="mb-2">No bets found</div>
              <div className="text-sm text-gray-500">Add your first bet to start tracking</div>
            </div>
          )}
        </div>

        {/* Add Bet Modal */}
        {showAddBet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Add New Bet</h2>
              <form onSubmit={handleAddBet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={newBet.sport}
                    onChange={(e) => setNewBet({ ...newBet, sport: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="NFL">NFL</option>
                    <option value="NCAAF">NCAAF</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bet Type</label>
                  <select
                    value={newBet.betType}
                    onChange={(e) => setNewBet({ ...newBet, betType: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="spread">Spread</option>
                    <option value="moneyline">Moneyline</option>
                    <option value="total">Total</option>
                    <option value="prop">Prop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Selection</label>
                  <input
                    type="text"
                    value={newBet.selection}
                    onChange={(e) => setNewBet({ ...newBet, selection: e.target.value })}
                    placeholder="e.g., Chiefs -3.5"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Odds</label>
                    <input
                      type="number"
                      value={newBet.odds}
                      onChange={(e) => setNewBet({ ...newBet, odds: parseFloat(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stake</label>
                    <input
                      type="number"
                      value={newBet.stake}
                      onChange={(e) => setNewBet({ ...newBet, stake: parseFloat(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bookmaker</label>
                  <input
                    type="text"
                    value={newBet.bookmaker}
                    onChange={(e) => setNewBet({ ...newBet, bookmaker: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Add Bet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBet(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
