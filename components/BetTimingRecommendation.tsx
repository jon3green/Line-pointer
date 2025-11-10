'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Target,
} from 'lucide-react';

interface BetTimingRecommendationProps {
  gameId: string;
  externalGameId?: string;
}

export default function BetTimingRecommendation({
  gameId,
  externalGameId,
}: BetTimingRecommendationProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['bet-timing', gameId],
    queryFn: async () => {
      const url = `/api/betting/timing/${gameId}${
        externalGameId ? `?externalGameId=${externalGameId}` : ''
      }`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch timing recommendation');
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const recommendation = data?.data;

  if (!recommendation) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Bet Timing</h3>
        </div>
        <div className="text-center py-6">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No timing data available</p>
        </div>
      </div>
    );
  }

  // Action styling
  const getActionStyle = (action: string) => {
    switch (action) {
      case 'bet_now':
        return {
          bg: 'from-green-900/30 to-slate-800',
          border: 'border-green-700/50',
          icon: CheckCircle,
          iconColor: 'text-green-400',
          text: 'BET NOW',
          textColor: 'text-green-400',
        };
      case 'wait':
        return {
          bg: 'from-yellow-900/30 to-slate-800',
          border: 'border-yellow-700/50',
          icon: Clock,
          iconColor: 'text-yellow-400',
          text: 'WAIT',
          textColor: 'text-yellow-400',
        };
      case 'avoid':
        return {
          bg: 'from-red-900/30 to-slate-800',
          border: 'border-red-700/50',
          icon: XCircle,
          iconColor: 'text-red-400',
          text: 'AVOID',
          textColor: 'text-red-400',
        };
      default:
        return {
          bg: 'from-slate-900 to-slate-800',
          border: 'border-slate-700/50',
          icon: Clock,
          iconColor: 'text-slate-400',
          text: 'WAIT',
          textColor: 'text-slate-400',
        };
    }
  };

  const actionStyle = getActionStyle(recommendation.action);
  const ActionIcon = actionStyle.icon;

  // Confidence badge color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Risk level badge color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/20 text-green-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'high':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div
      className={`bg-gradient-to-br ${actionStyle.bg} rounded-xl border ${actionStyle.border} p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Bet Timing Advisor</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(
              recommendation.confidence
            )}`}
          >
            {recommendation.confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <ActionIcon className={`w-12 h-12 ${actionStyle.iconColor}`} />
        <div className="flex-1">
          <div className={`text-2xl font-bold ${actionStyle.textColor} mb-1`}>
            {actionStyle.text}
          </div>
          <div className="text-sm text-slate-300">{recommendation.optimalWindow}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 mb-1">Risk Level</div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
              recommendation.riskLevel
            )}`}
          >
            {recommendation.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            recommendation.indicators.sharpMoney
              ? 'bg-emerald-900/20 border-emerald-700/30'
              : 'bg-slate-800/30 border-slate-700/30'
          }`}
        >
          <Target
            className={`w-4 h-4 ${
              recommendation.indicators.sharpMoney ? 'text-emerald-400' : 'text-slate-600'
            }`}
          />
          <span className="text-xs text-slate-300">Sharp Money</span>
          <span className="ml-auto">
            {recommendation.indicators.sharpMoney ? '✓' : '—'}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            recommendation.indicators.steamMove
              ? 'bg-red-900/20 border-red-700/30'
              : 'bg-slate-800/30 border-slate-700/30'
          }`}
        >
          <Zap
            className={`w-4 h-4 ${
              recommendation.indicators.steamMove ? 'text-red-400' : 'text-slate-600'
            }`}
          />
          <span className="text-xs text-slate-300">Steam Move</span>
          <span className="ml-auto">
            {recommendation.indicators.steamMove ? '✓' : '—'}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            recommendation.indicators.highVolatility
              ? 'bg-orange-900/20 border-orange-700/30'
              : 'bg-slate-800/30 border-slate-700/30'
          }`}
        >
          <TrendingUp
            className={`w-4 h-4 ${
              recommendation.indicators.highVolatility ? 'text-orange-400' : 'text-slate-600'
            }`}
          />
          <span className="text-xs text-slate-300">High Volatility</span>
          <span className="ml-auto">
            {recommendation.indicators.highVolatility ? '⚠' : '—'}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            recommendation.indicators.favorableMovement
              ? 'bg-blue-900/20 border-blue-700/30'
              : 'bg-slate-800/30 border-slate-700/30'
          }`}
        >
          {recommendation.expectedMovement.direction === 'up' ? (
            <TrendingUp
              className={`w-4 h-4 ${
                recommendation.indicators.favorableMovement
                  ? 'text-blue-400'
                  : 'text-slate-600'
              }`}
            />
          ) : (
            <TrendingDown
              className={`w-4 h-4 ${
                recommendation.indicators.favorableMovement
                  ? 'text-blue-400'
                  : 'text-slate-600'
              }`}
            />
          )}
          <span className="text-xs text-slate-300">Favorable Line</span>
          <span className="ml-auto">
            {recommendation.indicators.favorableMovement ? '✓' : '—'}
          </span>
        </div>
      </div>

      {/* Expected Movement */}
      {recommendation.expectedMovement.magnitude > 0 && (
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Expected Line Movement</div>
          <div className="flex items-center gap-2">
            {recommendation.expectedMovement.direction === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm font-bold text-white">
              {recommendation.expectedMovement.magnitude.toFixed(1)} points{' '}
              {recommendation.expectedMovement.direction}
            </span>
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-2">Analysis:</div>
        {recommendation.reasoning.map((reason: string, index: number) => (
          <div
            key={index}
            className="text-sm text-slate-300 flex items-start gap-2 pl-2"
          >
            <span className="text-blue-400 mt-0.5">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
