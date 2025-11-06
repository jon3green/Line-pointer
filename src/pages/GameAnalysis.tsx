import { useParams, useNavigate } from 'react-router-dom';
import { mockNFLGames, mockNCAAFGames } from '../data/mockGames';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { useState } from 'react';
import type { ParlayPick } from '../types';

export default function GameAnalysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [addedToParlay, setAddedToParlay] = useState(false);

  const allGames = [...mockNFLGames, ...mockNCAAFGames];
  const game = allGames.find(g => g.id === gameId);

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Game not found</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          Back to Games
        </button>
      </div>
    );
  }

  const handleAddToParlay = () => {
    // In a real app, this would add to a global state/context
    const existingParlay = localStorage.getItem('parlay');
    const picks: ParlayPick[] = existingParlay ? JSON.parse(existingParlay) : [];

    const newPick: ParlayPick = {
      gameId: game.id,
      game: game,
      betType: 'spread',
      pick: game.aiPrediction.spreadPick === 'home' ? game.homeTeam.shortName : game.awayTeam.shortName,
      confidence: game.aiConfidence
    };

    // Check if already in parlay
    if (!picks.find(p => p.gameId === game.id)) {
      picks.push(newPick);
      localStorage.setItem('parlay', JSON.stringify(picks));
      setAddedToParlay(true);
      setTimeout(() => setAddedToParlay(false), 2000);
    }
  };

  const { homeTeam, awayTeam, aiPrediction, stats } = game;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="text-gray-400 hover:text-white mb-4 flex items-center space-x-2"
      >
        <span>←</span>
        <span>Back to Games</span>
      </button>

      {/* Game Header */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-gray-400 text-sm mb-2">
              {new Date(game.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {game.time}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {awayTeam.name} @ {homeTeam.name}
            </h1>
          </div>
          <ConfidenceBadge confidence={game.aiConfidence} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6">
          {/* Away Team */}
          <div className="text-center">
            <div className="text-5xl mb-2" style={{ color: awayTeam.color }}>
              {awayTeam.logo}
            </div>
            <div className="font-semibold text-white text-lg">{awayTeam.name}</div>
            <div className="text-gray-400 text-sm">{awayTeam.shortName}</div>
            {aiPrediction.winner === 'away' && (
              <div className="mt-2 text-green-500 font-bold">✓ AI PICK</div>
            )}
          </div>

          {/* Home Team */}
          <div className="text-center">
            <div className="text-5xl mb-2" style={{ color: homeTeam.color }}>
              {homeTeam.logo}
            </div>
            <div className="font-semibold text-white text-lg">{homeTeam.name}</div>
            <div className="text-gray-400 text-sm">{homeTeam.shortName}</div>
            {aiPrediction.winner === 'home' && (
              <div className="mt-2 text-green-500 font-bold">✓ AI PICK</div>
            )}
          </div>
        </div>
      </div>

      {/* Win Probability Gauge */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Win Probability</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{awayTeam.shortName}</span>
              <span className="text-white font-semibold">{100 - aiPrediction.winProbability}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-600 h-full transition-all"
                style={{ width: `${100 - aiPrediction.winProbability}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{homeTeam.shortName}</span>
              <span className="text-white font-semibold">{aiPrediction.winProbability}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all"
                style={{ width: `${aiPrediction.winProbability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction Summary */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-6 mb-6 border border-blue-800/30">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="mr-2">🤖</span>
          AI Analysis
        </h2>
        <p className="text-gray-200 leading-relaxed">{aiPrediction.summary}</p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900/50 rounded p-3">
            <div className="text-gray-400 mb-1">Spread Pick</div>
            <div className="text-white font-semibold">
              {aiPrediction.spreadPick === 'home' ? homeTeam.shortName : awayTeam.shortName}
              {' '}({game.spread > 0 ? `-${game.spread}` : `+${Math.abs(game.spread)}`})
            </div>
          </div>
          <div className="bg-gray-900/50 rounded p-3">
            <div className="text-gray-400 mb-1">O/U Pick</div>
            <div className="text-white font-semibold">
              {aiPrediction.overUnderPick.toUpperCase()} {game.overUnder}
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Comparison */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Key Stats Comparison</h2>

        <div className="space-y-4">
          <StatComparison
            label="Offense Rank"
            awayValue={`#${stats.awayTeam.offenseRank}`}
            homeValue={`#${stats.homeTeam.offenseRank}`}
            awayTeam={awayTeam.shortName}
            homeTeam={homeTeam.shortName}
            lowerIsBetter={true}
          />
          <StatComparison
            label="Defense Rank"
            awayValue={`#${stats.awayTeam.defenseRank}`}
            homeValue={`#${stats.homeTeam.defenseRank}`}
            awayTeam={awayTeam.shortName}
            homeTeam={homeTeam.shortName}
            lowerIsBetter={true}
          />
          <StatComparison
            label="Avg Points Scored"
            awayValue={stats.awayTeam.avgPointsScored.toFixed(1)}
            homeValue={stats.homeTeam.avgPointsScored.toFixed(1)}
            awayTeam={awayTeam.shortName}
            homeTeam={homeTeam.shortName}
            lowerIsBetter={false}
          />
          <StatComparison
            label="Avg Points Allowed"
            awayValue={stats.awayTeam.avgPointsAllowed.toFixed(1)}
            homeValue={stats.homeTeam.avgPointsAllowed.toFixed(1)}
            awayTeam={awayTeam.shortName}
            homeTeam={homeTeam.shortName}
            lowerIsBetter={true}
          />

          <div className="pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {stats.awayTeam.recentForm.split('-').map((result, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        result === 'W' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                <div className="text-gray-500 text-xs mt-1">{awayTeam.shortName}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {stats.homeTeam.recentForm.split('-').map((result, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        result === 'W' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                <div className="text-gray-500 text-xs mt-1">{homeTeam.shortName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Injuries */}
      {(stats.awayTeam.injuries.length > 0 || stats.homeTeam.injuries.length > 0) && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Injury Report</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-2 font-semibold">{awayTeam.shortName}</div>
              {stats.awayTeam.injuries.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {stats.awayTeam.injuries.map((injury, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      {injury}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No injuries reported</p>
              )}
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2 font-semibold">{homeTeam.shortName}</div>
              {stats.homeTeam.injuries.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {stats.homeTeam.injuries.map((injury, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      {injury}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No injuries reported</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weather */}
      {stats.weather && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Weather Conditions</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">☀️</div>
              <div className="text-gray-400 text-sm">Condition</div>
              <div className="text-white font-semibold">{stats.weather.condition}</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🌡️</div>
              <div className="text-gray-400 text-sm">Temperature</div>
              <div className="text-white font-semibold">{stats.weather.temperature}°F</div>
            </div>
            <div>
              <div className="text-2xl mb-1">💨</div>
              <div className="text-gray-400 text-sm">Wind Speed</div>
              <div className="text-white font-semibold">{stats.weather.windSpeed} mph</div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Parlay Button */}
      <div className="sticky bottom-4">
        <button
          onClick={handleAddToParlay}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            addedToParlay
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
          }`}
        >
          {addedToParlay ? '✓ Added to Parlay Builder' : '+ Add to Parlay Builder'}
        </button>
      </div>
    </div>
  );
}

// Helper Component
interface StatComparisonProps {
  label: string;
  awayValue: string;
  homeValue: string;
  awayTeam: string;
  homeTeam: string;
  lowerIsBetter: boolean;
}

function StatComparison({ label, awayValue, homeValue, awayTeam, homeTeam, lowerIsBetter }: StatComparisonProps) {
  const awayNumeric = parseFloat(awayValue.replace('#', ''));
  const homeNumeric = parseFloat(homeValue.replace('#', ''));

  const awayBetter = lowerIsBetter ? awayNumeric < homeNumeric : awayNumeric > homeNumeric;
  const homeBetter = lowerIsBetter ? homeNumeric < awayNumeric : homeNumeric > awayNumeric;

  return (
    <div>
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-2 rounded ${awayBetter ? 'bg-green-900/30 border border-green-800/50' : 'bg-gray-800'}`}>
          <div className="text-white font-semibold">{awayValue}</div>
          <div className="text-gray-500 text-xs">{awayTeam}</div>
        </div>
        <div className={`p-2 rounded ${homeBetter ? 'bg-green-900/30 border border-green-800/50' : 'bg-gray-800'}`}>
          <div className="text-white font-semibold">{homeValue}</div>
          <div className="text-gray-500 text-xs">{homeTeam}</div>
        </div>
      </div>
    </div>
  );
}
