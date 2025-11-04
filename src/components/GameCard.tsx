import { Game } from '../types';
import { Link } from 'react-router-dom';
import ConfidenceBadge from './ConfidenceBadge';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { homeTeam, awayTeam, date, time, spread, overUnder, aiConfidence, aiPrediction } = game;

  const formatSpread = (spread: number) => {
    if (spread === 0) return 'EVEN';
    return spread > 0 ? `-${spread}` : `+${Math.abs(spread)}`;
  };

  return (
    <Link to={`/game/${game.id}`} className="block">
      <div className="game-card">
        {/* Header with Confidence Badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="text-gray-400 text-xs">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {time}
          </div>
          <ConfidenceBadge confidence={aiConfidence} />
        </div>

        {/* Teams */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-3xl" style={{ color: awayTeam.color }}>
                {awayTeam.logo}
              </div>
              <div>
                <div className="font-semibold text-white">{awayTeam.name}</div>
                <div className="text-xs text-gray-400">{awayTeam.shortName}</div>
              </div>
            </div>
            {aiPrediction.winner === 'away' && (
              <div className="text-green-500 font-bold text-sm">✓ PICK</div>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-3xl" style={{ color: homeTeam.color }}>
                {homeTeam.logo}
              </div>
              <div>
                <div className="font-semibold text-white">{homeTeam.name}</div>
                <div className="text-xs text-gray-400">{homeTeam.shortName}</div>
              </div>
            </div>
            {aiPrediction.winner === 'home' && (
              <div className="text-green-500 font-bold text-sm">✓ PICK</div>
            )}
          </div>
        </div>

        {/* Betting Lines */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">Spread</div>
              <div className="text-white font-semibold">{formatSpread(spread)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">O/U</div>
              <div className="text-white font-semibold">{overUnder}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Win %</div>
              <div className="text-white font-semibold">{aiPrediction.winProbability}%</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
