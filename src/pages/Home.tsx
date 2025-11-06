import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sport } from '../types';
import { mockNFLGames, mockNCAAFGames } from '../data/mockGames';

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<Sport>('NFL');

  const games = selectedSport === 'NFL' ? mockNFLGames : mockNCAAFGames;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
          AI-Powered Sports Predictions
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Advanced analytics and machine learning to give you the edge in sports betting
        </p>
      </div>

      {/* Sport Tabs */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setSelectedSport('NFL')}
          className={`px-8 py-3 rounded-2xl font-semibold transition-all ${
            selectedSport === 'NFL'
              ? 'bg-gradient-to-r from-accent-blue-light to-accent-blue text-white shadow-xl shadow-accent-blue/20 scale-105'
              : 'bg-dark-surface text-text-secondary hover:text-text-primary hover:bg-dark-surface/80 border border-dark-border'
          }`}
        >
          NFL
        </button>
        <button
          onClick={() => setSelectedSport('NCAAF')}
          className={`px-8 py-3 rounded-2xl font-semibold transition-all ${
            selectedSport === 'NCAAF'
              ? 'bg-gradient-to-r from-accent-blue-light to-accent-blue text-white shadow-xl shadow-accent-blue/20 scale-105'
              : 'bg-dark-surface text-text-secondary hover:text-text-primary hover:bg-dark-surface/80 border border-dark-border'
          }`}
        >
          NCAAF
        </button>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {games.map(game => (
          <Link
            key={game.id}
            to={`/game/${game.id}`}
            className="group"
          >
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:border-accent-blue/50 transition-all hover:shadow-xl hover:shadow-accent-blue/10 hover:scale-[1.02]">
              {/* Header with Confidence Badge */}
              <div className="flex justify-between items-start mb-6">
                <div className="text-text-muted text-sm">
                  {new Date(game.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })} • {game.time}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  game.aiConfidence === 'High'
                    ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                    : game.aiConfidence === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                }`}>
                  {game.aiConfidence} Confidence
                </span>
              </div>

              {/* Teams */}
              <div className="space-y-4 mb-6">
                {/* Away Team */}
                <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{game.awayTeam.logo}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {game.awayTeam.name}
                      </div>
                      <div className="text-xs text-text-muted">{game.awayTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'away' && (
                    <div className="flex items-center gap-1 text-accent-green font-bold text-sm bg-accent-green/10 px-2 py-1 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      PICK
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center">
                  <div className="w-full h-px bg-dark-border"></div>
                  <span className="px-4 text-text-muted text-xs font-semibold">VS</span>
                  <div className="w-full h-px bg-dark-border"></div>
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{game.homeTeam.logo}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {game.homeTeam.name}
                      </div>
                      <div className="text-xs text-text-muted">{game.homeTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'home' && (
                    <div className="flex items-center gap-1 text-accent-green font-bold text-sm bg-accent-green/10 px-2 py-1 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      PICK
                    </div>
                  )}
                </div>
              </div>

              {/* Betting Lines */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
                  <div className="text-text-muted text-xs mb-1">Spread</div>
                  <div className="text-text-primary font-bold">
                    {game.spread > 0 ? `+${game.spread}` : game.spread}
                  </div>
                </div>
                <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
                  <div className="text-text-muted text-xs mb-1">O/U</div>
                  <div className="text-text-primary font-bold">{game.overUnder}</div>
                </div>
                <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
                  <div className="text-text-muted text-xs mb-1">Win %</div>
                  <div className="text-accent-blue font-bold">{game.aiPrediction.winProbability}%</div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
                <p className="text-text-secondary text-xs line-clamp-2">
                  {game.aiPrediction.summary}
                </p>
              </div>

              {/* View Analysis CTA */}
              <div className="mt-4 text-center">
                <span className="text-accent-blue text-sm font-semibold group-hover:text-accent-blue-light transition-colors inline-flex items-center gap-1">
                  View Full Analysis
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">
          This Week's Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-dark-bg/50 rounded-xl">
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-blue-light to-accent-blue bg-clip-text text-transparent mb-2">
              {games.length}
            </div>
            <div className="text-text-muted text-sm font-medium">Total Games Analyzed</div>
          </div>
          <div className="text-center p-6 bg-dark-bg/50 rounded-xl">
            <div className="text-4xl font-bold text-accent-green mb-2">
              {games.filter(g => g.aiConfidence === 'High').length}
            </div>
            <div className="text-text-muted text-sm font-medium">High Confidence Picks</div>
          </div>
          <div className="text-center p-6 bg-dark-bg/50 rounded-xl">
            <div className="text-4xl font-bold text-yellow-500 mb-2">
              {games.filter(g => g.aiConfidence === 'Medium').length}
            </div>
            <div className="text-text-muted text-sm font-medium">Medium Confidence Picks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
