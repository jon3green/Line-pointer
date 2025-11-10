'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertCircle, Activity, Target } from 'lucide-react';

export default function MLInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ['ml-insights'],
    queryFn: async () => {
      const response = await fetch('/api/ml/insights?days=30');
      if (!response.ok) throw new Error('Failed to fetch ML insights');
      return response.json();
    },
    refetchInterval: 600000, // Refetch every 10 minutes
  });

  if (isLoading) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <span>ML Learning Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Analyzing predictions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.insights) {
    return null;
  }

  const { insights, adjustments } = data;

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span>ML Learning Status</span>
          <Badge className="bg-purple-600/20 text-purple-400">
            <Activity className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <p className="text-sm text-gray-300">{insights.summary}</p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-400">Overall</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.performance.accuracy}%</p>
            <p className="text-xs text-gray-500">{insights.performance.totalPredictions} picks</p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-400">Spread</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.performance.spreadAccuracy}%</p>
            <p className="text-xs text-gray-500">ATS accuracy</p>
          </div>
        </div>

        {/* ML Improvements */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>Learning Improvements:</span>
          </h4>
          <div className="space-y-2">
            {insights.improvements.length > 0 ? (
              insights.improvements.map((improvement: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-white/5 rounded">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-xs text-gray-300 flex-1">{improvement}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Model is well-calibrated. No major adjustments needed.</p>
            )}
          </div>
        </div>

        {/* Adjustments Applied */}
        {(Math.abs(adjustments.spreadBias) > 1 ||
          Math.abs(adjustments.totalBias) > 1 ||
          Math.abs(adjustments.confidenceCalibration) > 0.03) && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Active Adjustments:</h4>
            <div className="space-y-1 text-xs">
              {Math.abs(adjustments.spreadBias) > 1 && (
                <div className="flex items-center justify-between text-gray-300">
                  <span>Spread Bias:</span>
                  <span className="font-semibold">
                    {adjustments.spreadBias > 0 ? '+' : ''}
                    {adjustments.spreadBias.toFixed(1)} pts
                  </span>
                </div>
              )}
              {Math.abs(adjustments.totalBias) > 1 && (
                <div className="flex items-center justify-between text-gray-300">
                  <span>Total Bias:</span>
                  <span className="font-semibold">
                    {adjustments.totalBias > 0 ? '+' : ''}
                    {adjustments.totalBias.toFixed(1)} pts
                  </span>
                </div>
              )}
              {Math.abs(adjustments.confidenceCalibration) > 0.03 && (
                <div className="flex items-center justify-between text-gray-300">
                  <span>Confidence:</span>
                  <span className="font-semibold">
                    {adjustments.confidenceCalibration > 0 ? 'Boosted' : 'Reduced'} by{' '}
                    {Math.abs(adjustments.confidenceCalibration * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learn More */}
        <div className="mt-4 text-center">
          <a
            href="/accuracy"
            className="text-purple-400 hover:text-purple-300 text-sm font-semibold inline-flex items-center space-x-1"
          >
            <span>View Full Analytics →</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
