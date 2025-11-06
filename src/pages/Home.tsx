import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Sport } from '../types';
import { mockNFLGames, mockNCAAFGames } from '../data/mockGames';

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<Sport>('NFL');

  const games = selectedSport === 'NFL' ? mockNFLGames : mockNCAAFGames;

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-brand/10 border border-brand-blue/30 rounded-full mb-4">
          <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
          <span className="text-accent-green-light text-sm font-semibold">Live Predictions Updated Daily</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight">
          Precision Sports
          <span className="block mt-2 gradient-text">Predictions</span>
        </h1>

        <p className="text-text-secondary text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
          Advanced analytics and AI-powered insights to give you the edge in sports betting
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-8 pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text-green">{games.length}</div>
            <div className="text-text-muted text-sm mt-1">Games Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">{games.filter(g => g.aiConfidence === 'High').length}</div>
            <div className="text-text-muted text-sm mt-1">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-purple-light">89.2%</div>
            <div className="text-text-muted text-sm mt-1">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Sport Selector - Pill Style */}
      <div className="flex justify-center">
        <div className="pill-container inline-flex">
          <button
            onClick={() => setSelectedSport('NFL')}
            className={`pill-item ${
              selectedSport === 'NFL' ? 'pill-item-active' : 'pill-item-inactive'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">🏈</span>
              <span className="font-semibold">NFL</span>
            </span>
          </button>
          <button
            onClick={() => setSelectedSport('NCAAF')}
            className={`pill-item ${
              selectedSport === 'NCAAF' ? 'pill-item-active' : 'pill-item-inactive'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="font-semibold">NCAAF</span>
            </span>
          </button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8">
        {games.map(game => (
          <Link
            key={game.id}
            to={`/game/${game.id}`}
            className="group"
          >
            <div className="card card-hover card-glow h-full flex flex-col">
              {/* Header with Date & Confidence */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-1">
                  <div className="text-text-primary font-semibold text-sm">
                    {new Date(game.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-text-muted text-xs">{game.time}</div>
                </div>
                <span className={`badge ${
                  game.aiConfidence === 'High'
                    ? 'badge-high'
                    : game.aiConfidence === 'Medium'
                    ? 'badge-medium'
                    : 'badge-low'
                }`}>
                  {game.aiConfidence === 'High' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {game.aiConfidence}
                </span>
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-6 flex-grow">
                {/* Away Team */}
                <div className="flex items-center justify-between p-4 bg-dark-surface/50 rounded-2xl border border-dark-border/50 hover:border-brand-blue/30 transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">{game.awayTeam.logo}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-text-primary text-lg truncate">
                        {game.awayTeam.name}
                      </div>
                      <div className="text-xs text-text-muted font-medium">{game.awayTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'away' && (
                    <div className="flex items-center gap-1.5 text-accent-green-light font-bold text-sm bg-accent-green/20 px-3 py-1.5 rounded-full border border-accent-green/40">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      PICK
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center py-1">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-dark-border to-transparent"></div>
                  <span className="px-4 text-text-muted text-xs font-bold tracking-wider">@</span>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-dark-border to-transparent"></div>
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between p-4 bg-dark-surface/50 rounded-2xl border border-dark-border/50 hover:border-brand-blue/30 transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">{game.homeTeam.logo}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-text-primary text-lg truncate">
                        {game.homeTeam.name}
                      </div>
                      <div className="text-xs text-text-muted font-medium">{game.homeTeam.shortName}</div>
                    </div>
                  </div>
                  {game.aiPrediction.winner === 'home' && (
                    <div className="flex items-center gap-1.5 text-accent-green-light font-bold text-sm bg-accent-green/20 px-3 py-1.5 rounded-full border border-accent-green/40">
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
                <div className="stat-card">
                  <div className="text-text-muted text-xs mb-1 font-medium">SPREAD</div>
                  <div className="text-text-primary font-bold text-lg">
                    {game.spread > 0 ? `+${game.spread}` : game.spread}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-text-muted text-xs mb-1 font-medium">TOTAL</div>
                  <div className="text-text-primary font-bold text-lg">{game.overUnder}</div>
                </div>
                <div className="stat-card border-brand-blue/30 bg-brand-blue/5">
                  <div className="text-text-muted text-xs mb-1 font-medium">WIN %</div>
                  <div className="gradient-text font-bold text-lg">{game.aiPrediction.winProbability}%</div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="p-4 bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 rounded-2xl">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-5 h-5 text-brand-blue-light flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  <div>
                    <div className="text-brand-blue-light text-xs font-bold mb-1">AI INSIGHT</div>
                    <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                      {game.aiPrediction.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* View Analysis CTA */}
              <div className="mt-5 pt-5 border-t border-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">Full Analysis</span>
                  <span className="gradient-text text-sm font-bold group-hover:scale-110 transition-transform inline-flex items-center gap-2">
                    View Details
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Performance Banner */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-transparent to-accent-green/20"></div>
        <div className="relative z-10 text-center py-8 sm:py-12">
          <h3 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            This Week's Performance
          </h3>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Our AI has analyzed {games.length} games this week with industry-leading accuracy
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="stat-card bg-dark-surface/80 backdrop-blur-sm">
              <div className="text-4xl font-bold gradient-text mb-2">
                {games.length}
              </div>
              <div className="text-text-muted text-sm font-medium">Games Analyzed</div>
            </div>
            <div className="stat-card bg-dark-surface/80 backdrop-blur-sm">
              <div className="text-4xl font-bold gradient-text-green mb-2">
                {games.filter(g => g.aiConfidence === 'High').length}
              </div>
              <div className="text-text-muted text-sm font-medium">High Confidence</div>
            </div>
            <div className="stat-card bg-dark-surface/80 backdrop-blur-sm">
              <div className="text-4xl font-bold text-accent-orange mb-2">
                {games.filter(g => g.aiConfidence === 'Medium').length}
              </div>
              <div className="text-text-muted text-sm font-medium">Medium Confidence</div>
            </div>
            <div className="stat-card bg-dark-surface/80 backdrop-blur-sm">
              <div className="text-4xl font-bold gradient-text-purple mb-2">
                {games.filter(g => g.aiConfidence === 'Low').length}
              </div>
              <div className="text-text-muted text-sm font-medium">Low Confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
