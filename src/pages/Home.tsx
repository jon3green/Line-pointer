import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sport } from '../types';
import { mockNFLGames, mockNCAAFGames } from '../data/mockGames';

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<Sport>('NFL');

  const games = selectedSport === 'NFL' ? mockNFLGames : mockNCAAFGames;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Upcoming Games This Week</h2>
        <p className="text-gray-400 text-sm">
          AI-powered predictions and analysis for {selectedSport} games
        </p>
      </div>

      {/* Sport Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSelectedSport('NFL')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedSport === 'NFL'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          NFL
        </button>
        <button
          onClick={() => setSelectedSport('NCAAF')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedSport === 'NCAAF'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          NCAAF
        </button>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <Link key={game.id} to={`/game/${game.id}`} className="block">
            <div className="game-card">
              {/* Header with Confidence Badge */}
              <div className="flex justify-between items-start mb-3">
                <div className="text-gray-400 text-xs">
                  {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {game.time}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  game.aiConfidence === 'High' ? 'bg-green-600 text-white' :
                  game.aiConfidence === 'Medium' ? 'bg-yellow-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {game.aiConfidence} Confidence
                </span>
              </div>

              {/* Teams */}
              <div className="space-y-3">
                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-3xl">{game.awayTeam.logo}</div>
                    <div>
                      <div className="font-semibold text-white">{game.awayTeam.name}</div>
                      <div className="text-xs text-gray-400">{game.awayTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'away' && (
                    <div className="text-green-500 font-bold text-sm">✓ PICK</div>
                  )}
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-3xl">{game.homeTeam.logo}</div>
                    <div>
                      <div className="font-semibold text-white">{game.homeTeam.name}</div>
                      <div className="text-xs text-gray-400">{game.homeTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'home' && (
                    <div className="text-green-500 font-bold text-sm">✓ PICK</div>
                  )}
                </div>
              </div>

              {/* Betting Lines */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Spread</div>
                    <div className="text-white font-semibold">
                      {game.spread === 0 ? 'EVEN' : game.spread > 0 ? `-${game.spread}` : `+${Math.abs(game.spread)}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">O/U</div>
                    <div className="text-white font-semibold">{game.overUnder}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Win %</div>
                    <div className="text-white font-semibold">{game.aiPrediction.winProbability}%</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">This Week's Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-500">{games.length}</div>
            <div className="text-gray-400 text-sm mt-1">Total Games</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">
              {games.filter(g => g.aiConfidence === 'High').length}
            </div>
            <div className="text-gray-400 text-sm mt-1">High Confidence</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-500">
              {games.filter(g => g.aiConfidence === 'Medium').length}
            </div>
            <div className="text-gray-400 text-sm mt-1">Medium Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
