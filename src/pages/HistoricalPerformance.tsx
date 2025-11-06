import { mockHistoricalData } from '../data/mockGames';
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Historical Performance</h2>
        <p className="text-gray-400 text-sm">
          Track AI prediction accuracy over time
        </p>
      </div>

      {/* Sport Filter */}
      <div className="flex space-x-2 mb-6">
        {(['All', 'NFL', 'NCAAF'] as const).map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedSport === sport
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-6 border border-blue-800/30">
          <div className="text-blue-400 text-sm mb-2">Overall Accuracy</div>
          <div className="text-4xl font-bold text-white mb-1">{overallAccuracy}%</div>
          <div className="text-gray-400 text-xs">
            {totalCorrect} / {totalPredictions} predictions
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-6 border border-green-800/30">
          <div className="text-green-400 text-sm mb-2">Total Correct</div>
          <div className="text-4xl font-bold text-white mb-1">{totalCorrect}</div>
          <div className="text-gray-400 text-xs">Winning predictions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-lg p-6 border border-purple-800/30">
          <div className="text-purple-400 text-sm mb-2">Total Analyzed</div>
          <div className="text-4xl font-bold text-white mb-1">{totalPredictions}</div>
          <div className="text-gray-400 text-xs">Games predicted</div>
        </div>
      </div>

      {/* Performance by Bet Type */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Performance by Bet Type</h3>
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
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Week by Week Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-gray-400 font-semibold">Date</th>
                <th className="text-left py-3 px-2 text-gray-400 font-semibold">Sport</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">Games</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">Correct</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">Accuracy</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">Spread</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">Moneyline</th>
                <th className="text-center py-3 px-2 text-gray-400 font-semibold">O/U</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record, index) => (
                <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-2 text-white">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      record.sport === 'NFL' ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'
                    }`}>
                      {record.sport}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-white">{record.totalPredictions}</td>
                  <td className="py-3 px-2 text-center text-green-400 font-semibold">{record.correctPredictions}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-semibold ${
                      record.accuracy >= 70 ? 'text-green-400' : record.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {record.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">{record.byBetType.spread.accuracy.toFixed(0)}%</td>
                  <td className="py-3 px-2 text-center text-gray-300">{record.byBetType.moneyline.accuracy.toFixed(0)}%</td>
                  <td className="py-3 px-2 text-center text-gray-300">{record.byBetType.overUnder.accuracy.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-6 border border-green-800/30">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Performance Insights
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Moneyline predictions show strongest performance at {moneylineAccuracy}% accuracy</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>High confidence picks historically hit at 70%+ rate</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-500 mr-2">•</span>
            <span>College football predictions tend to be more volatile due to larger talent gaps</span>
          </li>
        </ul>
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
    if (acc >= 70) return 'text-green-400';
    if (acc >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white font-semibold">{type}</div>
        <div className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
          {accuracy.toFixed(1)}%
        </div>
      </div>
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
        <div
          className="bg-blue-600 h-full transition-all"
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <div className="text-gray-400 text-xs">
        {correct} correct out of {total} predictions
      </div>
    </div>
  );
}
