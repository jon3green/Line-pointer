'use client';

import { Game } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Shield, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamComparisonProps {
  game: Game;
}

export default function TeamComparison({ game }: TeamComparisonProps) {
  // Mock team stats - in production, fetch from API
  const homeStats = {
    wins: 10,
    losses: 2,
    pointsPerGame: 28.5,
    pointsAllowed: 19.3,
    offensiveRank: 3,
    defensiveRank: 7,
    streak: 'W3',
    atsRecord: '8-4',
    overUnderRecord: '7-5',
  };

  const awayStats = {
    wins: 8,
    losses: 4,
    pointsPerGame: 24.2,
    pointsAllowed: 22.1,
    offensiveRank: 8,
    defensiveRank: 12,
    streak: 'L1',
    atsRecord: '6-6',
    overUnderRecord: '5-7',
  };

  const StatComparison = ({ 
    label, 
    homeValue, 
    awayValue, 
    higher = 'better',
    format = 'number'
  }: {
    label: string;
    homeValue: number | string;
    awayValue: number | string;
    higher?: 'better' | 'worse';
    format?: 'number' | 'rank' | 'record';
  }) => {
    const homeNum = typeof homeValue === 'number' ? homeValue : parseFloat(homeValue as string);
    const awayNum = typeof awayValue === 'number' ? awayValue : parseFloat(awayValue as string);
    
    let homeWins = false;
    if (format === 'rank') {
      homeWins = homeNum < awayNum; // Lower rank is better
    } else {
      homeWins = higher === 'better' ? homeNum > awayNum : homeNum < awayNum;
    }

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/10">
        <div className={`text-right ${homeWins ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
          {homeValue}
          {homeWins && <TrendingUp className="w-4 h-4 inline ml-1" />}
        </div>
        <div className="text-center text-sm text-gray-400">
          {label}
        </div>
        <div className={`text-left ${!homeWins ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
          {!homeWins && <TrendingUp className="w-4 h-4 inline mr-1" />}
          {awayValue}
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-morphism border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-center">Team Comparison</CardTitle>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">{game.homeTeam.abbreviation}</span>
            </div>
            <p className="text-sm text-white font-semibold">{game.homeTeam.name}</p>
            <p className="text-xs text-gray-400">{game.homeTeam.record}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl text-gray-400">VS</span>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">{game.awayTeam.abbreviation}</span>
            </div>
            <p className="text-sm text-white font-semibold">{game.awayTeam.name}</p>
            <p className="text-xs text-gray-400">{game.awayTeam.record}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Record */}
        <StatComparison
          label="Record"
          homeValue={`${homeStats.wins}-${homeStats.losses}`}
          awayValue={`${awayStats.wins}-${awayStats.losses}`}
          higher="better"
        />

        {/* Points Per Game */}
        <StatComparison
          label="PPG"
          homeValue={homeStats.pointsPerGame}
          awayValue={awayStats.pointsPerGame}
          higher="better"
        />

        {/* Points Allowed */}
        <StatComparison
          label="Pts Allowed"
          homeValue={homeStats.pointsAllowed}
          awayValue={awayStats.pointsAllowed}
          higher="worse"
        />

        {/* Offensive Rank */}
        <StatComparison
          label="Offensive Rank"
          homeValue={homeStats.offensiveRank}
          awayValue={awayStats.offensiveRank}
          format="rank"
        />

        {/* Defensive Rank */}
        <StatComparison
          label="Defensive Rank"
          homeValue={homeStats.defensiveRank}
          awayValue={awayStats.defensiveRank}
          format="rank"
        />

        {/* Current Streak */}
        <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/10">
          <div className="text-right">
            <Badge className={homeStats.streak.startsWith('W') ? 'bg-green-500' : 'bg-red-500'}>
              {homeStats.streak}
            </Badge>
          </div>
          <div className="text-center text-sm text-gray-400">
            Streak
          </div>
          <div className="text-left">
            <Badge className={awayStats.streak.startsWith('W') ? 'bg-green-500' : 'bg-red-500'}>
              {awayStats.streak}
            </Badge>
          </div>
        </div>

        {/* ATS Record */}
        <StatComparison
          label="ATS Record"
          homeValue={homeStats.atsRecord}
          awayValue={awayStats.atsRecord}
          format="record"
        />

        {/* Over/Under Record */}
        <StatComparison
          label="O/U Record"
          homeValue={homeStats.overUnderRecord}
          awayValue={awayStats.overUnderRecord}
          format="record"
        />

        {/* Key Advantages */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg space-y-3">
          <h4 className="text-sm font-semibold text-white mb-2">Key Advantages</h4>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Target className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">{game.homeTeam.abbreviation}: Home Field</p>
                <p className="text-xs text-gray-400">Historically strong at home (7-1)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">{game.awayTeam.abbreviation}: Defense</p>
                <p className="text-xs text-gray-400">Top 5 defensive unit this season</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

