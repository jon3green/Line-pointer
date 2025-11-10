'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Award, BarChart3, Calendar } from 'lucide-react';

interface AccuracyData {
  period: string;
  sport: string;
  overall: {
    total: number;
    correct: number;
    accuracy: number;
  };
  byBetType: {
    spread: { total: number; correct: number; accuracy: number };
    total: { total: number; correct: number; accuracy: number };
    moneyline: { total: number; correct: number; accuracy: number };
  };
  highConfidence: {
    total: number;
    correct: number;
    accuracy: number;
  };
  bySport: Array<{
    sport: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  trend: Array<{
    date: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export default function AccuracyTrackerPage() {
  const [period, setPeriod] = useState('weekly');
  const [sport, setSport] = useState('all');

  const { data, isLoading, error, refetch } = useQuery<AccuracyData>({
    queryKey: ['accuracy', period, sport],
    queryFn: async () => {
      const response = await fetch(`/api/predictions/accuracy?period=${period}&sport=${sport}`);
      if (!response.ok) throw new Error('Failed to fetch accuracy data');
      return response.json();
    },
  });

  // Auto-update results
  const updateResults = async () => {
    try {
      const response = await fetch('/api/predictions/update-results', { method: 'POST' });
      const result = await response.json();
      console.log('Results updated:', result);
      refetch();
    } catch (error) {
      console.error('Error updating results:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderWithAuth />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <Target className="w-10 h-10 text-green-500" />
            <span>Prediction Accuracy Tracker</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Track model performance and prediction accuracy across all games
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="season">This Season</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Sports</option>
              <option value="NFL">NFL</option>
              <option value="NCAAF">NCAAF</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={updateResults}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Update Results
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-white text-center py-12">Loading accuracy data...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-12">
            Error loading data. Try updating results or check back later.
          </div>
        ) : data ? (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="glass-morphism border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <Badge className="bg-green-600/20 text-green-400">
                      {data.overall.accuracy >= 60 ? 'Excellent' : data.overall.accuracy >= 50 ? 'Good' : 'Building'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Overall Accuracy</p>
                    <p className="text-white text-3xl font-bold">{data.overall.accuracy.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.overall.correct}/{data.overall.total} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Award className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">High Confidence (≥70%)</p>
                    <p className="text-white text-3xl font-bold">{data.highConfidence.accuracy.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.highConfidence.correct}/{data.highConfidence.total} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <BarChart3 className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Predictions</p>
                    <p className="text-white text-3xl font-bold">{data.overall.total}</p>
                    <p className="text-xs text-gray-500 mt-1">Tracked games</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Best Bet Type</p>
                    <p className="text-white text-2xl font-bold">
                      {Math.max(
                        data.byBetType.spread.accuracy,
                        data.byBetType.total.accuracy,
                        data.byBetType.moneyline.accuracy
                      ) === data.byBetType.spread.accuracy
                        ? 'Spread'
                        : Math.max(data.byBetType.total.accuracy, data.byBetType.moneyline.accuracy) === data.byBetType.total.accuracy
                        ? 'Total'
                        : 'ML'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.max(
                        data.byBetType.spread.accuracy,
                        data.byBetType.total.accuracy,
                        data.byBetType.moneyline.accuracy
                      ).toFixed(1)}% accuracy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Bet Type */}
            <Card className="glass-morphism border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-xl text-white">Performance by Bet Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Spread', data: data.byBetType.spread, color: 'bg-green-500' },
                    { name: 'Total (Over/Under)', data: data.byBetType.total, color: 'bg-blue-500' },
                    { name: 'Moneyline', data: data.byBetType.moneyline, color: 'bg-purple-500' },
                  ].map((type) => (
                    <div key={type.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">{type.name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400">
                            {type.data.correct}/{type.data.total}
                          </span>
                          <span className="text-white font-bold">{type.data.accuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`${type.color} h-2 rounded-full transition-all`}
                          style={{ width: `${type.data.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            {data.trend && data.trend.length > 0 && (
              <Card className="glass-morphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>7-Day Accuracy Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.trend.map((day) => (
                      <div key={day.date} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">{day.date}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400">
                            {day.correct}/{day.total}
                          </span>
                          <span
                            className={`font-bold ${
                              day.accuracy >= 60 ? 'text-green-400' : day.accuracy >= 50 ? 'text-yellow-400' : 'text-gray-400'
                            }`}
                          >
                            {day.total > 0 ? `${day.accuracy.toFixed(1)}%` : 'No games'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
