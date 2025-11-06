import { useParams, useNavigate } from 'react-router-dom';
import { mockNFLGames, mockNCAAFGames } from '../data/mockGames';
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
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-card border border-dark-border rounded-full mb-6">
          <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-text-secondary text-lg mb-6">Game not found</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Games
        </button>
      </div>
    );
  }

  const handleAddToParlay = () => {
    const existingParlay = localStorage.getItem('parlay');
    const picks: ParlayPick[] = existingParlay ? JSON.parse(existingParlay) : [];

    const newPick: ParlayPick = {
      gameId: game.id,
      game: game,
      betType: 'spread',
      pick: game.aiPrediction.spreadPick === 'home' ? game.homeTeam.shortName : game.awayTeam.shortName,
      confidence: game.aiConfidence
    };

    if (!picks.find(p => p.gameId === game.id)) {
      picks.push(newPick);
      localStorage.setItem('parlay', JSON.stringify(picks));
      setAddedToParlay(true);
      setTimeout(() => setAddedToParlay(false), 2000);
    }
  };

  const { homeTeam, awayTeam, aiPrediction, stats } = game;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to Games</span>
      </button>

      {/* Game Header */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-accent-green/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="badge badge-info">
                  {game.sport}
                </span>
                <span className="text-text-secondary text-sm">
                  {new Date(game.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {game.time}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
                {awayTeam.name} <span className="text-text-muted">@</span> {homeTeam.name}
              </h1>
            </div>
            <span className={`badge ${
              game.aiConfidence === 'High' ? 'badge-high' :
              game.aiConfidence === 'Medium' ? 'badge-medium' : 'badge-low'
            } text-base px-4 py-2`}>
              {game.aiConfidence === 'High' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {game.aiConfidence} Confidence
            </span>
          </div>

          {/* Team Matchup */}
          <div className="grid grid-cols-2 gap-12 py-8">
            {/* Away Team */}
            <div className="text-center">
              <div className="text-7xl mb-4">{awayTeam.logo}</div>
              <div className="font-bold text-text-primary text-xl mb-1">{awayTeam.name}</div>
              <div className="text-text-muted text-sm font-medium mb-3">{awayTeam.shortName}</div>
              {aiPrediction.winner === 'away' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/20 text-accent-green-light rounded-full border border-accent-green/40 font-bold text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI PICK
                </div>
              )}
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div className="text-7xl mb-4">{homeTeam.logo}</div>
              <div className="font-bold text-text-primary text-xl mb-1">{homeTeam.name}</div>
              <div className="text-text-muted text-sm font-medium mb-3">{homeTeam.shortName}</div>
              {aiPrediction.winner === 'home' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/20 text-accent-green-light rounded-full border border-accent-green/40 font-bold text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI PICK
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Win Probability */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-blue-light" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
          Win Probability
        </h2>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-text-secondary font-medium">{awayTeam.shortName}</span>
              <span className="text-3xl font-bold gradient-text-purple">{100 - aiPrediction.winProbability}%</span>
            </div>
            <div className="bg-dark-surface rounded-full h-6 overflow-hidden border border-dark-border">
              <div
                className="bg-gradient-to-r from-brand-purple to-brand-purple-light h-full transition-all duration-1000 flex items-center justify-end pr-3"
                style={{ width: `${100 - aiPrediction.winProbability}%` }}
              >
                {(100 - aiPrediction.winProbability) > 15 && (
                  <span className="text-white text-xs font-bold">{100 - aiPrediction.winProbability}%</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-text-secondary font-medium">{homeTeam.shortName}</span>
              <span className="text-3xl font-bold gradient-text-green">{aiPrediction.winProbability}%</span>
            </div>
            <div className="bg-dark-surface rounded-full h-6 overflow-hidden border border-dark-border">
              <div
                className="bg-gradient-success h-full transition-all duration-1000 flex items-center justify-end pr-3"
                style={{ width: `${aiPrediction.winProbability}%` }}
              >
                {aiPrediction.winProbability > 15 && (
                  <span className="text-white text-xs font-bold">{aiPrediction.winProbability}%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border-brand-blue/30">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary mb-3">AI Prediction</h2>
            <p className="text-text-primary leading-relaxed text-lg">{aiPrediction.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="stat-card bg-dark-card/80 backdrop-blur-sm">
            <div className="text-text-muted text-sm mb-2 font-semibold">SPREAD PICK</div>
            <div className="text-text-primary font-bold text-xl">
              {aiPrediction.spreadPick === 'home' ? homeTeam.shortName : awayTeam.shortName}
              {' '}({game.spread > 0 ? `-${game.spread}` : `+${Math.abs(game.spread)}`})
            </div>
          </div>
          <div className="stat-card bg-dark-card/80 backdrop-blur-sm">
            <div className="text-text-muted text-sm mb-2 font-semibold">TOTAL PICK</div>
            <div className="text-text-primary font-bold text-xl">
              {aiPrediction.overUnderPick.toUpperCase()} {game.overUnder}
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Comparison */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Key Stats Comparison</h2>

        <div className="space-y-6">
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

          <div className="pt-6 border-t border-dark-border">
            <div className="text-text-secondary text-sm mb-4 font-semibold">RECENT FORM</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex gap-2 mb-2">
                  {stats.awayTeam.recentForm.split('-').map((result, i) => (
                    <span
                      key={i}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${
                        result === 'W'
                          ? 'bg-accent-green/20 text-accent-green-light border border-accent-green/40'
                          : 'bg-accent-red/20 text-accent-red border border-accent-red/40'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                <div className="text-text-muted text-sm">{awayTeam.shortName}</div>
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  {stats.homeTeam.recentForm.split('-').map((result, i) => (
                    <span
                      key={i}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${
                        result === 'W'
                          ? 'bg-accent-green/20 text-accent-green-light border border-accent-green/40'
                          : 'bg-accent-red/20 text-accent-red border border-accent-red/40'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                <div className="text-text-muted text-sm">{homeTeam.shortName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Injuries */}
      {(stats.awayTeam.injuries.length > 0 || stats.homeTeam.injuries.length > 0) && (
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-accent-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Injury Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="stat-card">
              <div className="text-text-secondary text-sm mb-3 font-bold">{awayTeam.shortName}</div>
              {stats.awayTeam.injuries.length > 0 ? (
                <ul className="space-y-2">
                  {stats.awayTeam.injuries.map((injury, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="text-accent-red text-lg">•</span>
                      <span>{injury}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">No injuries reported</p>
              )}
            </div>
            <div className="stat-card">
              <div className="text-text-secondary text-sm mb-3 font-bold">{homeTeam.shortName}</div>
              {stats.homeTeam.injuries.length > 0 ? (
                <ul className="space-y-2">
                  {stats.homeTeam.injuries.map((injury, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="text-accent-red text-lg">•</span>
                      <span>{injury}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">No injuries reported</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weather */}
      {stats.weather && (
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Weather Conditions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="text-4xl mb-3">☀️</div>
              <div className="text-text-muted text-sm mb-1">Condition</div>
              <div className="text-text-primary font-bold text-lg">{stats.weather.condition}</div>
            </div>
            <div className="stat-card">
              <div className="text-4xl mb-3">🌡️</div>
              <div className="text-text-muted text-sm mb-1">Temperature</div>
              <div className="text-text-primary font-bold text-lg">{stats.weather.temperature}°F</div>
            </div>
            <div className="stat-card">
              <div className="text-4xl mb-3">💨</div>
              <div className="text-text-muted text-sm mb-1">Wind Speed</div>
              <div className="text-text-primary font-bold text-lg">{stats.weather.windSpeed} mph</div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Parlay Button */}
      <div className="sticky bottom-6 z-10">
        <button
          onClick={handleAddToParlay}
          className={`w-full py-5 rounded-full font-bold text-lg transition-all shadow-2xl ${
            addedToParlay
              ? 'bg-gradient-success text-white scale-105'
              : 'bg-gradient-brand text-white hover:scale-105 hover:shadow-glow-blue'
          }`}
        >
          {addedToParlay ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Added to Parlay Builder
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add to Parlay Builder
            </span>
          )}
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
      <div className="text-text-secondary text-sm mb-3 font-semibold">{label.toUpperCase()}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`stat-card ${awayBetter ? 'bg-accent-green/10 border-accent-green/40' : ''}`}>
          <div className="text-text-primary font-bold text-xl">{awayValue}</div>
          <div className="text-text-muted text-sm mt-1">{awayTeam}</div>
        </div>
        <div className={`stat-card ${homeBetter ? 'bg-accent-green/10 border-accent-green/40' : ''}`}>
          <div className="text-text-primary font-bold text-xl">{homeValue}</div>
          <div className="text-text-muted text-sm mt-1">{homeTeam}</div>
        </div>
      </div>
    </div>
  );
}
