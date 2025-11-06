import { mockHistoricalData } from '../data/mockGames';
import { Link } from 'react-router-dom';
import type { Sport } from '../types';
import { useState } from 'react';

export default function HistoricalPerformance() {
  const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');

  const filteredData = selectedSport === 'All'
    ? mockHistoricalData
    : mockHistoricalData.filter(record => record.sport === selectedSport);

  // Calculate overall stats
  const totalPredictions = filteredData.reduce((sum, record) => sum + record.totalPredictions, 0);
  const totalCorrect = filteredData.reduce((sum, record) => sum + record.correctPredictions, 0);
  const overallAccuracy = totalPredictions > 0 ? ((totalCorrect / totalPredictions) * 100).toFixed(1) : '0';

  // Calculate by bet type
  const spreadStats = {
    total: filteredData.reduce((sum, record) => sum + record.byBetType.spread.total, 0),
    correct: filteredData.reduce((sum, record) => sum + record.byBetType.spread.correct, 0)
  };
  const moneylineStats = {
    total: filteredData.reduce((sum, record) => sum + record.byBetType.moneyline.total, 0),
    correct: filteredData.reduce((sum, record) => sum + record.byBetType.moneyline.correct, 0)
  };
  const overUnderStats = {
    total: filteredData.reduce((sum, record) => sum + record.byBetType.overUnder.total, 0),
    correct: filteredData.reduce((sum, record) => sum + record.byBetType.overUnder.correct, 0)
  };

  const spreadAccuracy = spreadStats.total > 0 ? ((spreadStats.correct / spreadStats.total) * 100).toFixed(1) : '0';
  const moneylineAccuracy = moneylineStats.total > 0 ? ((moneylineStats.correct / moneylineStats.total) * 100).toFixed(1) : '0';
  const overUnderAccuracy = overUnderStats.total > 0 ? ((overUnderStats.correct / overUnderStats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Games</span>
        </Link>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Historical Performance</h1>
        <p className="text-text-secondary text-lg">
          Track AI prediction accuracy over time
        </p>
      </div>

      {/* Sport Filter */}
      <div className="pill-container inline-flex">
        {(['All', 'NFL', 'NCAAF'] as const).map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`pill-item ${selectedSport === sport ? 'pill-item-active' : 'pill-item-inactive'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 border-brand-blue/30">
          <div className="text-brand-blue-light text-sm mb-2 font-semibold">OVERALL ACCURACY</div>
          <div className="text-5xl font-bold gradient-text mb-2">{overallAccuracy}%</div>
          <div className="text-text-muted text-sm">
            {totalCorrect} / {totalPredictions} predictions
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-green/10 to-accent-green/5 border-accent-green/30">
          <div className="text-accent-green-light text-sm mb-2 font-semibold">TOTAL CORRECT</div>
          <div className="text-5xl font-bold gradient-text-green mb-2">{totalCorrect}</div>
          <div className="text-text-muted text-sm">Winning predictions</div>
        </div>

        <div className="card bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 border-brand-purple/30">
          <div className="text-brand-purple-light text-sm mb-2 font-semibold">TOTAL ANALYZED</div>
          <div className="text-5xl font-bold gradient-text-purple mb-2">{totalPredictions}</div>
          <div className="text-text-muted text-sm">Games predicted</div>
        </div>
      </div>

      {/* Performance by Bet Type */}
      <div className="card">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Performance by Bet Type</h3>
        <div className="space-y-4">
          <BetTypeCard
            type="Spread"
            accuracy={parseFloat(spreadAccuracy)}
            correct={spreadStats.correct}
            total={spreadStats.total}
          />
          <BetTypeCard
            type="Moneyline"
            accuracy={parseFloat(moneylineAccuracy)}
            correct={moneylineStats.correct}
            total={moneylineStats.total}
          />
          <BetTypeCard
            type="Over/Under"
            accuracy={parseFloat(overUnderAccuracy)}
            correct={overUnderStats.correct}
            total={overUnderStats.total}
          />
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="card">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Week by Week Results</h3>
        <div className="overflow-x-auto scrollbar-custom">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-4 px-4 text-text-secondary font-bold text-xs uppercase">Date</th>
                <th className="text-left py-4 px-4 text-text-secondary font-bold text-xs uppercase">Sport</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">Games</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">Correct</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">Accuracy</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">Spread</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">Moneyline</th>
                <th className="text-center py-4 px-4 text-text-secondary font-bold text-xs uppercase">O/U</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record, index) => (
                <tr key={index} className="border-b border-dark-border hover:bg-dark-hover transition-colors">
                  <td className="py-4 px-4 text-text-primary font-medium">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge ${
                      record.sport === 'NFL' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {record.sport}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-text-primary font-semibold">{record.totalPredictions}</td>
                  <td className="py-4 px-4 text-center text-accent-green-light font-bold">{record.correctPredictions}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-bold ${
                      record.accuracy >= 70 ? 'gradient-text-green' : record.accuracy >= 60 ? 'text-accent-orange' : 'text-accent-red'
                    }`}>
                      {record.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-text-primary font-medium">{record.byBetType.spread.accuracy.toFixed(0)}%</td>
                  <td className="py-4 px-4 text-center text-text-primary font-medium">{record.byBetType.moneyline.accuracy.toFixed(0)}%</td>
                  <td className="py-4 px-4 text-center text-text-primary font-medium">{record.byBetType.overUnder.accuracy.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="card bg-gradient-to-br from-accent-green/10 to-brand-blue/10 border-accent-green/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-text-primary mb-4">Performance Insights</h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-accent-green-light rounded-full mt-2"></span>
                <span>Moneyline predictions show strongest performance at {moneylineAccuracy}% accuracy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-accent-green-light rounded-full mt-2"></span>
                <span>High confidence picks historically hit at 70%+ rate</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-accent-orange rounded-full mt-2"></span>
                <span>College football predictions tend to be more volatile due to larger talent gaps</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component
interface BetTypeCardProps {
  type: string;
  accuracy: number;
  correct: number;
  total: number;
}

function BetTypeCard({ type, accuracy, correct, total }: BetTypeCardProps) {
  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return 'gradient-text-green';
    if (acc >= 60) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getBarColor = (acc: number) => {
    if (acc >= 70) return 'bg-gradient-success';
    if (acc >= 60) return 'bg-gradient-to-r from-accent-orange to-yellow-600';
    return 'bg-gradient-to-r from-accent-red to-red-600';
  };

  return (
    <div className="stat-card hover:border-brand-blue/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-text-primary font-bold text-lg">{type}</div>
        <div className={`text-3xl font-bold ${getAccuracyColor(accuracy)}`}>
          {accuracy.toFixed(1)}%
        </div>
      </div>
      <div className="bg-dark-surface rounded-full h-3 overflow-hidden mb-3 border border-dark-border">
        <div
          className={`${getBarColor(accuracy)} h-full transition-all duration-1000`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <div className="text-text-muted text-sm">
        {correct} correct out of {total} predictions
      </div>
    </div>
  );
}
