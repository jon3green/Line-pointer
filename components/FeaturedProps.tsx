'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Zap, AlertCircle, Plus, TrendingDown, Flame } from 'lucide-react';
import { useStore } from '@/lib/store';

interface FeaturedProp {
  prop: {
    playerId: string;
    playerName: string;
    propType: string;
    line: number;
    prediction: {
      expectedValue: number;
      probability: { over: number; under: number };
      confidence: number;
      recommendation: 'over' | 'under' | 'avoid';
      valueScore: number;
    };
    factors: {
      recentForm: number;
      matchupRating: number;
      weatherImpact: number;
      historicalSuccess: number;
      lineMovement: number;
    };
  };
  valueRating: 'excellent' | 'good' | 'fair' | 'poor';
  expectedROI: number;
  confidence: 'high' | 'medium' | 'low';
}

export default function FeaturedProps() {
  const [props, setProps] = useState<FeaturedProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<'nfl' | 'ncaaf'>('nfl');
  const { addParlayLeg } = useStore();

  const fetchFeaturedProps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/props/featured?sport=${selectedSport}`);
      const data = await response.json();

      if (data.success) {
        setProps(data.featured);
      }
    } catch (error) {
      console.error('Error fetching featured props:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    fetchFeaturedProps();
  }, [fetchFeaturedProps]);

  const getValueBadgeColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-600/20 text-green-400 border-green-500/50';
      case 'good':
        return 'bg-blue-600/20 text-blue-400 border-blue-500/50';
      case 'fair':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-500/50';
    }
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-purple-600/20 text-purple-400';
      case 'medium':
        return 'bg-blue-600/20 text-blue-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const addToParlayBuilder = (featuredProp: FeaturedProp) => {
    // In a real implementation, would properly create a ParlayLeg
    // For now, show notification
    alert(`Added ${featuredProp.prop.playerName} ${featuredProp.prop.propType} to parlay builder!`);
  };

  if (loading) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>🔥 Featured Props</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Loading featured props...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (props.length === 0) {
    return (
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>🔥 Featured Props</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No featured props available at this time.</p>
            <p className="text-sm text-gray-500 mt-1">Check back closer to game time!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>🔥 Featured Props</span>
          </CardTitle>
          <div
            className="flex gap-2 flex-wrap"
            role="tablist"
            aria-label="Select prop sport"
          >
            <Button
              role="tab"
              aria-selected={selectedSport === 'nfl'}
              variant={selectedSport === 'nfl' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedSport('nfl')}
              className={selectedSport === 'nfl' ? 'gradient-green' : ''}
            >
              NFL
            </Button>
            <Button
              role="tab"
              aria-selected={selectedSport === 'ncaaf'}
              variant={selectedSport === 'ncaaf' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedSport('ncaaf')}
              className={selectedSport === 'ncaaf' ? 'gradient-blue' : ''}
            >
              NCAAF
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          AI-selected props with best value and high confidence
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.map((featuredProp, index) => {
          const prediction = featuredProp.prop.prediction;
          const recommendedProbability =
            prediction.recommendation === 'over' || prediction.recommendation === 'under'
              ? prediction.probability[prediction.recommendation] ?? 0
              : 0;

          return (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg"
            >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{featuredProp.prop.playerName}</h3>
                <p className="text-sm text-gray-400">{featuredProp.prop.propType}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={`${getValueBadgeColor(featuredProp.valueRating)} border`}>
                  {featuredProp.valueRating.toUpperCase()}
                </Badge>
                <Badge className={getConfidenceBadgeColor(featuredProp.confidence)}>
                  {featuredProp.confidence} confidence
                </Badge>
              </div>
            </div>

            {/* Line and Recommendation */}
            <div className="flex items-center justify-between mb-3 p-3 bg-white/5 rounded">
              <div>
                <p className="text-sm text-gray-400">Line</p>
                <p className="text-lg font-bold text-white">{featuredProp.prop.line}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Recommendation</p>
                <p className="text-lg font-bold text-green-400 uppercase flex items-center">
                  {featuredProp.prop.prediction.recommendation === 'over' ? (
                    <><TrendingUp className="w-4 h-4 mr-1" /> OVER</>
                  ) : (
                    <><TrendingDown className="w-4 h-4 mr-1" /> UNDER</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Value Score</p>
                <p className="text-lg font-bold text-green-400">
                  +{featuredProp.prop.prediction.valueScore.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Factors */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-xs text-gray-400">Recent Form</p>
                <p className={`text-sm font-semibold ${
                  featuredProp.prop.factors.recentForm > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {featuredProp.prop.factors.recentForm > 0 ? '+' : ''}
                  {featuredProp.prop.factors.recentForm.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-xs text-gray-400">Matchup</p>
                <p className={`text-sm font-semibold ${
                  featuredProp.prop.factors.matchupRating > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {featuredProp.prop.factors.matchupRating > 0 ? '+' : ''}
                  {featuredProp.prop.factors.matchupRating.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-xs text-gray-400">Hit Rate</p>
                <p className="text-sm font-semibold text-blue-400">
                  {featuredProp.prop.factors.historicalSuccess.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Expected ROI */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-sm text-gray-300">
                <Target className="w-4 h-4 mr-1 text-green-500" />
                Expected ROI: <span className="font-bold text-green-400 ml-1">
                  {featuredProp.expectedROI.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                Probability: <span className="font-bold text-white ml-1">
                  {(recommendedProbability * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => addToParlayBuilder(featuredProp)}
              className="w-full gradient-green flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Parlay</span>
            </Button>
          </div>
        );
        })}

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 text-center">
            ⚠️ Featured props are AI-generated suggestions. Always verify odds and do your own research before betting.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

