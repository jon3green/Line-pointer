import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ApiDashboard } from './pages/ApiDashboard';
import { ProTools } from './pages/ProTools';
import { BetTracker } from './pages/BetTracker';
import { LineMovementPage } from './pages/LineMovement';
import { ArbitrageFinder } from './pages/ArbitrageFinder';
import { IOSWaitlist } from './pages/IOSWaitlist';
import { SubscriptionPage } from './pages/Subscription';
import { LiveBetting } from './pages/LiveBetting';
import { CommunityPage } from './pages/Community';
import { SentimentAnalysis } from './pages/SentimentAnalysis';
import { ProEdgePage } from './pages/ProEdge';
import { SharpMoneyIndicator, generateMockSharpData } from './components/SharpMoneyBadge';

// Comprehensive game data with advanced analytics
const allGamesData = {
  1: {
    id: 1, away: 'Buffalo Bills', awayShort: 'BUF', home: 'Kansas City Chiefs', homeShort: 'KC',
    spread: -2.5, ou: 51.5, confidence: 'High', winProb: 62, sport: 'NFL',
    date: 'November 9, 2025', time: '1:00 PM ET', location: 'Arrowhead Stadium, Kansas City, MO',
    summary: 'Chiefs offense at home is elite, averaging 28.5 PPG with 6.2 yards per play. Buffalo\'s defense has struggled on the road, allowing 24.8 PPG away. KC\'s home field advantage and superior red zone efficiency (68% vs 54%) give them a significant edge. Weather conditions favor the passing game.',

    // Advanced Analytics & Deep Research
    advancedMetrics: {
      away: {
        epa: 0.12, // Expected Points Added per play
        dvoa: 8.5, // Defense-adjusted Value Over Average (percentile)
        successRate: 47.2, // % of plays that gain 40%+ of needed yards
        explosivePlayRate: 14.3, // % of plays 10+ yards
        stuffRate: 16.8 // % of runs stopped at/behind LOS
      },
      home: {
        epa: 0.18,
        dvoa: 15.2,
        successRate: 51.4,
        explosivePlayRate: 18.7,
        stuffRate: 14.2
      }
    },

    coaching: {
      away: {
        headCoach: 'Sean McDermott',
        record: '89-62 career',
        playoffRecord: '7-6',
        vsOpposingCoach: '2-4',
        adjustmentRating: 7.8,
        timeoutManagement: 8.2
      },
      home: {
        headCoach: 'Andy Reid',
        record: '258-145-1 career',
        playoffRecord: '25-15',
        vsOpposingCoach: '4-2',
        adjustmentRating: 9.4,
        timeoutManagement: 9.1
      }
    },

    restAndTravel: {
      away: { daysRest: 7, travelDistance: 1247, timeZoneChange: -1, backToBack: false },
      home: { daysRest: 7, travelDistance: 0, timeZoneChange: 0, backToBack: false }
    },

    bettingAnalysis: {
      openingLine: -2,
      currentLine: -2.5,
      lineMovement: -0.5,
      sharpMoney: 'Home',
      publicBetting: '58% Home',
      reverseLineMovement: true, // Line moved toward home despite majority on home
      professionalConsensus: 'Strong on Home',
      keyNumbers: { current: 2.5, significance: 'Medium' } // 3 is key number in NFL
    },

    situationalFactors: {
      away: {
        playoffImplications: 'High - Fighting for bye',
        motivationLevel: 9.2,
        primetime: '4-2',
        offDivisionRest: '5-3',
        revenge: false
      },
      home: {
        playoffImplications: 'Critical - #1 seed race',
        motivationLevel: 9.8,
        primetime: '14-4',
        offDivisionRest: '6-1',
        revenge: true // Lost last meeting
      }
    },

    keyMatchups: [
      {
        matchup: 'BUF OL vs KC Pass Rush',
        advantage: 'KC',
        impact: 'High',
        reasoning: 'KC leads league in pressure rate (38%). Buffalo allows 3.2 sacks/game on road.'
      },
      {
        matchup: 'KC WRs vs BUF Secondary',
        advantage: 'KC',
        impact: 'High',
        reasoning: 'KC averages 285 pass YPG at home. Buffalo allows 268 YPG on road, 18th in NFL.'
      },
      {
        matchup: 'BUF Run Game vs KC Run Defense',
        advantage: 'Even',
        impact: 'Medium',
        reasoning: 'Buffalo 126 rush YPG vs KC allowing 118 YPG. Strength vs strength matchup.'
      }
    ],

    modelPrediction: {
      predictedScore: { away: 24, home: 27 },
      spreadPick: 'Home -2.5',
      spreadConfidence: 87,
      ouPick: 'Over 51.5',
      ouConfidence: 72,
      winProbability: { away: 38, home: 62 },
      confidenceInterval: '±4.2 points',
      factors: [
        { factor: 'Home Field Advantage', weight: 15, contribution: '+3.2 pts to Home' },
        { factor: 'Coaching Edge', weight: 12, contribution: '+2.1 pts to Home' },
        { factor: 'Advanced Metrics (EPA/DVOA)', weight: 20, contribution: '+1.8 pts to Home' },
        { factor: 'Rest & Travel', weight: 8, contribution: '+1.5 pts to Home' },
        { factor: 'Key Matchups', weight: 18, contribution: '+2.4 pts to Home' },
        { factor: 'Betting Market Intelligence', weight: 10, contribution: '+1.1 pts to Home' },
        { factor: 'Situational Motivation', weight: 12, contribution: '+0.9 pts to Home' },
        { factor: 'Recent Form & Trends', weight: 5, contribution: '-0.3 pts to Home' }
      ]
    },

    awayStats: {
      offense: 5, defense: 8, form: 'W-L-W-W-L', ppg: 26.8, papg: 19.2,
      // Advanced offensive metrics
      yardsPerPlay: 5.8, redZonePct: 54, thirdDownPct: 42, turnovers: -2,
      passYPG: 268, rushYPG: 126, sacksAllowed: 18,
      // Situational
      homeRecord: '5-2', awayRecord: '3-3', atsRecord: '5-3', atsAway: '2-4',
      vsTop10: '1-2', pointDiff: '+7.6',
      // Trends
      overRecord: '4-4', firstHalfPPG: 14.2, secondHalfPPG: 12.6
    },
    homeStats: {
      offense: 3, defense: 12, form: 'W-W-W-L-W', ppg: 28.5, papg: 21.3,
      // Advanced offensive metrics
      yardsPerPlay: 6.2, redZonePct: 68, thirdDownPct: 48, turnovers: +4,
      passYPG: 285, rushYPG: 118, sacksAllowed: 14,
      // Situational
      homeRecord: '6-1', awayRecord: '3-3', atsRecord: '6-2', atsHome: '4-1',
      vsTop10: '2-1', pointDiff: '+7.2',
      // Trends
      overRecord: '5-3', firstHalfPPG: 16.8, secondHalfPPG: 11.7
    },

    injuries: {
      away: [
        { player: 'Von Miller', position: 'DE', status: 'Questionable', impact: 'Medium' },
        { player: 'Gabe Davis', position: 'WR', status: 'Out', impact: 'Low' }
      ],
      home: [
        { player: 'Travis Kelce', position: 'TE', status: 'Probable', impact: 'Low' }
      ]
    },

    weather: {
      temp: 52, condition: 'Clear', wind: 8, precipitation: 0,
      impact: 'Minimal - Ideal conditions for passing'
    },

    headToHead: {
      overall: 'KC leads 28-24-1 all-time',
      recent: 'KC 2-1 in last 3 meetings',
      lastMeeting: 'BUF 24, KC 20 (Dec 2024)',
      avgScore: 'KC 26.3, BUF 24.1 (last 5)'
    },

    specialTeams: {
      away: { rank: 12, fgPct: 84, puntAvg: 46.2, returnYPG: 22.3 },
      home: { rank: 8, fgPct: 88, puntAvg: 47.8, returnYPG: 24.7 }
    },

    strengthOfSchedule: {
      away: { rank: 8, avgOppRank: 14.2 },
      home: { rank: 12, avgOppRank: 16.8 }
    }
  },

  2: {
    id: 2, away: 'Dallas Cowboys', awayShort: 'DAL', home: 'San Francisco 49ers', homeShort: 'SF',
    spread: -6.5, ou: 47.5, confidence: 'Medium', winProb: 58, sport: 'NFL',
    date: 'November 9, 2025', time: '4:25 PM ET', location: 'Levi\'s Stadium, Santa Clara, CA',
    summary: 'SF is favored but 6.5 points is steep given Dallas\' elite defense (#6 overall). Cowboys excel at limiting explosive plays and have covered in 4 of last 5 road games. 49ers offense is potent but tends to start slow. Dallas keeps this competitive - take the points.',

    advancedMetrics: {
      away: { epa: -0.02, dvoa: 3.2, successRate: 44.8, explosivePlayRate: 12.1, stuffRate: 18.3 },
      home: { epa: 0.14, dvoa: 12.8, successRate: 49.6, explosivePlayRate: 16.4, stuffRate: 15.7 }
    },

    coaching: {
      away: {
        headCoach: 'Mike McCarthy',
        record: '174-112-2 career',
        playoffRecord: '10-9',
        vsOpposingCoach: '1-1',
        adjustmentRating: 7.2,
        timeoutManagement: 6.8
      },
      home: {
        headCoach: 'Kyle Shanahan',
        record: '76-77-1 career',
        playoffRecord: '8-5',
        vsOpposingCoach: '1-1',
        adjustmentRating: 8.9,
        timeoutManagement: 8.7
      }
    },

    restAndTravel: {
      away: { daysRest: 6, travelDistance: 1483, timeZoneChange: -2, backToBack: false },
      home: { daysRest: 7, travelDistance: 0, timeZoneChange: 0, backToBack: false }
    },

    bettingAnalysis: {
      openingLine: -7,
      currentLine: -6.5,
      lineMovement: +0.5,
      sharpMoney: 'Away',
      publicBetting: '64% Home',
      reverseLineMovement: true,
      professionalConsensus: 'Value on Away +6.5',
      keyNumbers: { current: 6.5, significance: 'High' }
    },

    situationalFactors: {
      away: {
        playoffImplications: 'Medium - Wild card hunt',
        motivationLevel: 8.1,
        primetime: '3-4',
        offDivisionRest: '4-3',
        revenge: true
      },
      home: {
        playoffImplications: 'High - Division race',
        motivationLevel: 8.7,
        primetime: '6-2',
        offDivisionRest: '5-2',
        revenge: false
      }
    },

    keyMatchups: [
      {
        matchup: 'DAL Pass Rush vs SF OL',
        advantage: 'DAL',
        impact: 'High',
        reasoning: 'Dallas ranks #3 in sacks (32). SF missing starting guard, allows 2.8 sacks/game at home.'
      },
      {
        matchup: 'SF Run Game vs DAL Run Defense',
        advantage: 'SF',
        impact: 'High',
        reasoning: 'SF averages 128 rush YPG at home. Dallas allows 103 YPG but struggles against zone schemes.'
      },
      {
        matchup: 'DAL Secondary vs SF Pass Attack',
        advantage: 'Even',
        impact: 'Critical',
        reasoning: 'With Deebo Samuel questionable, matchup becomes more balanced. Dallas excels in coverage.'
      }
    ],

    modelPrediction: {
      predictedScore: { away: 21, home: 26 },
      spreadPick: 'Away +6.5',
      spreadConfidence: 74,
      ouPick: 'Under 47.5',
      ouConfidence: 68,
      winProbability: { away: 42, home: 58 },
      confidenceInterval: '±5.1 points',
      factors: [
        { factor: 'Home Field Advantage', weight: 15, contribution: '+2.8 pts to Home' },
        { factor: 'Coaching Edge', weight: 12, contribution: '+1.4 pts to Home' },
        { factor: 'Advanced Metrics (EPA/DVOA)', weight: 20, contribution: '+2.3 pts to Home' },
        { factor: 'Rest & Travel', weight: 8, contribution: '+0.8 pts to Home' },
        { factor: 'Key Matchups', weight: 18, contribution: '+0.2 pts to Home' },
        { factor: 'Betting Market Intelligence', weight: 10, contribution: '-1.8 pts to Home' },
        { factor: 'Situational Motivation', weight: 12, contribution: '+0.7 pts to Home' },
        { factor: 'Injury Impact', weight: 5, contribution: '-1.2 pts to Home' }
      ]
    },

    awayStats: {
      offense: 14, defense: 6, form: 'L-W-W-L-L', ppg: 21.3, papg: 19.8,
      yardsPerPlay: 5.3, redZonePct: 58, thirdDownPct: 38, turnovers: -1,
      passYPG: 242, rushYPG: 103, sacksAllowed: 22,
      homeRecord: '4-3', awayRecord: '3-4', atsRecord: '6-1', atsAway: '4-1',
      vsTop10: '1-2', pointDiff: '+1.5',
      overRecord: '2-6', firstHalfPPG: 9.8, secondHalfPPG: 11.5
    },
    homeStats: {
      offense: 8, defense: 4, form: 'W-W-L-W-W', ppg: 24.7, papg: 18.1,
      yardsPerPlay: 5.9, redZonePct: 64, thirdDownPct: 44, turnovers: +6,
      passYPG: 265, rushYPG: 128, sacksAllowed: 16,
      homeRecord: '5-2', awayRecord: '3-3', atsRecord: '4-4', atsHome: '2-3',
      vsTop10: '2-1', pointDiff: '+6.6',
      overRecord: '3-5', firstHalfPPG: 13.2, secondHalfPPG: 11.5
    },

    injuries: {
      away: [
        { player: 'Trevon Diggs', position: 'CB', status: 'Probable', impact: 'Low' }
      ],
      home: [
        { player: 'Deebo Samuel', position: 'WR', status: 'Questionable', impact: 'High' },
        { player: 'Javon Hargrave', position: 'DT', status: 'Out', impact: 'Medium' }
      ]
    },

    weather: {
      temp: 68, condition: 'Partly Cloudy', wind: 5, precipitation: 0,
      impact: 'None - Perfect conditions'
    },

    headToHead: {
      overall: 'SF leads 20-19-1 all-time',
      recent: 'Split 1-1 in last 2 meetings',
      lastMeeting: 'DAL 19, SF 12 (Oct 2024)',
      avgScore: 'DAL 18.6, SF 20.4 (last 5)'
    },

    specialTeams: {
      away: { rank: 18, fgPct: 79, puntAvg: 44.8, returnYPG: 19.7 },
      home: { rank: 6, fgPct: 91, puntAvg: 48.3, returnYPG: 26.1 }
    },

    strengthOfSchedule: {
      away: { rank: 15, avgOppRank: 17.3 },
      home: { rank: 6, avgOppRank: 12.4 }
    }
  },

  3: {
    id: 3, away: 'Green Bay Packers', awayShort: 'GB', home: 'Detroit Lions', homeShort: 'DET',
    spread: -3, ou: 48, confidence: 'Low', winProb: 53, sport: 'NFL',
    date: 'November 9, 2025', time: '8:15 PM ET', location: 'Ford Field, Detroit, MI',
    summary: 'Classic NFC North rivalry with both teams evenly matched. Detroit\'s home dominance (6-1) faces Green Bay\'s strong road performance (4-2 away). Lions slight edge with better red zone efficiency and fewer turnovers, but this is a true toss-up. Lean Lions but barely.',

    awayStats: {
      offense: 9, defense: 11, form: 'L-W-W-L-W', ppg: 24.1, papg: 21.7,
      yardsPerPlay: 5.6, redZonePct: 59, thirdDownPct: 41, turnovers: -3,
      passYPG: 255, rushYPG: 115, sacksAllowed: 19,
      homeRecord: '3-3', awayRecord: '4-2', atsRecord: '4-4', atsAway: '3-2',
      vsTop10: '1-1', pointDiff: '+2.4',
      overRecord: '4-4', firstHalfPPG: 12.6, secondHalfPPG: 11.5
    },
    homeStats: {
      offense: 6, defense: 15, form: 'W-L-W-W-L', ppg: 25.9, papg: 22.4,
      yardsPerPlay: 5.9, redZonePct: 66, thirdDownPct: 43, turnovers: +2,
      passYPG: 268, rushYPG: 122, sacksAllowed: 20,
      homeRecord: '6-1', awayRecord: '2-4', atsRecord: '5-3', atsHome: '4-1',
      vsTop10: '2-1', pointDiff: '+3.5',
      overRecord: '5-3', firstHalfPPG: 13.8, secondHalfPPG: 12.1
    },

    injuries: {
      away: [
        { player: 'Aaron Jones', position: 'RB', status: 'Questionable', impact: 'High' },
        { player: 'Jaire Alexander', position: 'CB', status: 'Probable', impact: 'Medium' }
      ],
      home: [
        { player: 'Aidan Hutchinson', position: 'DE', status: 'Questionable', impact: 'High' }
      ]
    },

    weather: {
      temp: 72, condition: 'Dome (Indoor)', wind: 0, precipitation: 0,
      impact: 'None - Controlled environment'
    },

    headToHead: {
      overall: 'GB leads 106-77-7 all-time',
      recent: 'GB 2-1 in last 3 meetings',
      lastMeeting: 'GB 30, DET 27 (Sep 2024)',
      avgScore: 'GB 25.8, DET 24.2 (last 5)'
    },

    specialTeams: {
      away: { rank: 14, fgPct: 82, puntAvg: 45.7, returnYPG: 21.4 },
      home: { rank: 11, fgPct: 85, puntAvg: 46.9, returnYPG: 23.8 }
    },

    strengthOfSchedule: {
      away: { rank: 11, avgOppRank: 16.1 },
      home: { rank: 9, avgOppRank: 14.8 }
    }
  },

  4: {
    id: 4, away: 'Florida Gators', awayShort: 'FLA', home: 'Georgia Bulldogs', homeShort: 'UGA',
    spread: -14, ou: 56.5, confidence: 'High', winProb: 78, sport: 'NCAAF',
    date: 'November 9, 2025', time: '3:30 PM ET', location: 'Sanford Stadium, Athens, GA',
    summary: 'Georgia\'s #1 ranked defense is historically dominant, allowing just 12.8 PPG. Florida\'s QB is battling injuries and their offensive line has been demolished by top defenses. UGA at home in a must-win rivalry game - expect a statement victory. Bulldogs cover easily.',

    awayStats: {
      offense: 28, defense: 45, form: 'L-L-W-L-L', ppg: 22.4, papg: 28.9,
      yardsPerPlay: 4.8, redZonePct: 51, thirdDownPct: 34, turnovers: -8,
      passYPG: 218, rushYPG: 95, sacksAllowed: 28,
      homeRecord: '3-2', awayRecord: '1-4', atsRecord: '2-6', atsAway: '0-5',
      vsTop10: '0-3', pointDiff: '-6.5',
      overRecord: '3-5', firstHalfPPG: 10.8, secondHalfPPG: 11.6
    },
    homeStats: {
      offense: 12, defense: 1, form: 'W-W-W-W-L', ppg: 34.2, papg: 12.8,
      yardsPerPlay: 6.4, redZonePct: 74, thirdDownPct: 52, turnovers: +12,
      passYPG: 265, rushYPG: 188, sacksAllowed: 11,
      homeRecord: '6-0', awayRecord: '3-1', atsRecord: '6-2', atsHome: '4-1',
      vsTop10: '3-0', pointDiff: '+21.4',
      overRecord: '4-4', firstHalfPPG: 18.7, secondHalfPPG: 15.5
    },

    injuries: {
      away: [
        { player: 'Graham Mertz', position: 'QB', status: 'Questionable', impact: 'Critical' },
        { player: 'Trevor Etienne', position: 'RB', status: 'Out', impact: 'High' },
        { player: 'Kamari Wilson', position: 'S', status: 'Out', impact: 'Medium' }
      ],
      home: [
        { player: 'Smael Mondon', position: 'LB', status: 'Probable', impact: 'Low' }
      ]
    },

    weather: {
      temp: 64, condition: 'Sunny', wind: 6, precipitation: 0,
      impact: 'None - Beautiful day for football'
    },

    headToHead: {
      overall: 'UGA leads 56-44-2 all-time',
      recent: 'UGA 5-0 in last 5 meetings',
      lastMeeting: 'UGA 43, FLA 20 (Oct 2024)',
      avgScore: 'UGA 38.2, FLA 18.4 (last 5)'
    },

    specialTeams: {
      away: { rank: 42, fgPct: 73, puntAvg: 42.8, returnYPG: 18.2 },
      home: { rank: 5, fgPct: 92, puntAvg: 47.5, returnYPG: 28.4 }
    },

    strengthOfSchedule: {
      away: { rank: 22, avgOppRank: 35.8 },
      home: { rank: 4, avgOppRank: 18.2 }
    }
  },

  5: {
    id: 5, away: 'Penn State Nittany Lions', awayShort: 'PSU', home: 'Ohio State Buckeyes', homeShort: 'OSU',
    spread: -7.5, ou: 52, confidence: 'Medium', winProb: 64, sport: 'NCAAF',
    date: 'November 9, 2025', time: '12:00 PM ET', location: 'Ohio Stadium, Columbus, OH',
    summary: 'Big Ten heavyweight clash. Penn State\'s #3 ranked defense travels exceptionally well and has limited explosive plays all season. OSU\'s offense is elite but has struggled vs top defenses. PSU\'s ability to control clock with their run game keeps this within a touchdown. Take the points.',

    awayStats: {
      offense: 18, defense: 3, form: 'W-W-L-W-W', ppg: 29.3, papg: 14.7,
      yardsPerPlay: 5.7, redZonePct: 67, thirdDownPct: 46, turnovers: +8,
      passYPG: 238, rushYPG: 168, sacksAllowed: 13,
      homeRecord: '5-0', awayRecord: '4-1', atsRecord: '6-2', atsAway: '3-2',
      vsTop10: '2-1', pointDiff: '+14.6',
      overRecord: '3-5', firstHalfPPG: 15.2, secondHalfPPG: 14.1
    },
    homeStats: {
      offense: 4, defense: 8, form: 'W-W-W-W-W', ppg: 38.6, papg: 16.2,
      yardsPerPlay: 6.8, redZonePct: 78, thirdDownPct: 54, turnovers: +10,
      passYPG: 312, rushYPG: 178, sacksAllowed: 9,
      homeRecord: '6-0', awayRecord: '3-1', atsRecord: '5-3', atsHome: '3-2',
      vsTop10: '2-0', pointDiff: '+22.4',
      overRecord: '6-2', firstHalfPPG: 21.3, secondHalfPPG: 17.3
    },

    injuries: {
      away: [
        { player: 'Drew Allar', position: 'QB', status: 'Probable', impact: 'Low' },
        { player: 'Chop Robinson', position: 'DE', status: 'Questionable', impact: 'Medium' }
      ],
      home: [
        { player: 'Marvin Harrison Jr', position: 'WR', status: 'Probable', impact: 'Low' }
      ]
    },

    weather: {
      temp: 48, condition: 'Cloudy', wind: 12, precipitation: 0,
      impact: 'Low - Light wind may affect deep passes'
    },

    headToHead: {
      overall: 'OSU leads 24-14 all-time',
      recent: 'OSU 3-2 in last 5 meetings',
      lastMeeting: 'OSU 33, PSU 24 (Nov 2024)',
      avgScore: 'OSU 31.2, PSU 26.8 (last 5)'
    },

    specialTeams: {
      away: { rank: 8, fgPct: 89, puntAvg: 46.8, returnYPG: 25.3 },
      home: { rank: 3, fgPct: 94, puntAvg: 48.9, returnYPG: 29.7 }
    },

    strengthOfSchedule: {
      away: { rank: 7, avgOppRank: 24.6 },
      home: { rank: 5, avgOppRank: 19.8 }
    }
  },

  6: {
    id: 6, away: 'Oklahoma Sooners', awayShort: 'OKLA', home: 'Texas Longhorns', homeShort: 'TEX',
    spread: -10, ou: 61, confidence: 'High', winProb: 72, sport: 'NCAAF',
    date: 'November 9, 2025', time: '7:00 PM ET', location: 'Darrell K Royal Stadium, Austin, TX',
    summary: 'Red River rivalry with a massive talent gap this season. Texas\' #2 ranked offense (41.7 PPG) faces Oklahoma\'s #67 ranked defense that hemorrhages points. OKLA has lost 4 of last 5 and looks defeated. Texas playing for playoff positioning - expect them to make a statement. Longhorns blow them out.',

    awayStats: {
      offense: 22, defense: 67, form: 'L-L-W-L-W', ppg: 26.8, papg: 32.4,
      yardsPerPlay: 5.2, redZonePct: 56, thirdDownPct: 37, turnovers: -6,
      passYPG: 268, rushYPG: 98, sacksAllowed: 26,
      homeRecord: '3-2', awayRecord: '2-4', atsRecord: '3-5', atsAway: '1-4',
      vsTop10: '0-3', pointDiff: '-5.6',
      overRecord: '6-2', firstHalfPPG: 12.4, secondHalfPPG: 14.4
    },
    homeStats: {
      offense: 2, defense: 14, form: 'W-W-W-W-L', ppg: 41.7, papg: 20.1,
      yardsPerPlay: 7.1, redZonePct: 81, thirdDownPct: 56, turnovers: +14,
      passYPG: 328, rushYPG: 205, sacksAllowed: 8,
      homeRecord: '6-0', awayRecord: '3-1', atsRecord: '6-2', atsHome: '4-1',
      vsTop10: '3-0', pointDiff: '+21.6',
      overRecord: '5-3', firstHalfPPG: 23.8, secondHalfPPG: 17.9
    },

    injuries: {
      away: [
        { player: 'Jackson Arnold', position: 'QB', status: 'Probable', impact: 'Medium' },
        { player: 'Ethan Downs', position: 'DE', status: 'Out', impact: 'High' },
        { player: 'Billy Bowman', position: 'S', status: 'Questionable', impact: 'Medium' }
      ],
      home: [
        { player: 'Quinn Ewers', position: 'QB', status: 'Probable', impact: 'Low' }
      ]
    },

    weather: {
      temp: 76, condition: 'Clear', wind: 9, precipitation: 0,
      impact: 'None - Perfect night for offense'
    },

    headToHead: {
      overall: 'TEX leads 63-51-5 all-time',
      recent: 'TEX 4-1 in last 5 meetings',
      lastMeeting: 'TEX 38, OKLA 24 (Oct 2024)',
      avgScore: 'TEX 36.4, OKLA 26.2 (last 5)'
    },

    specialTeams: {
      away: { rank: 56, fgPct: 71, puntAvg: 43.2, returnYPG: 17.8 },
      home: { rank: 4, fgPct: 93, puntAvg: 48.7, returnYPG: 30.2 }
    },

    strengthOfSchedule: {
      away: { rank: 28, avgOppRank: 38.4 },
      home: { rank: 3, avgOppRank: 16.7 }
    }
  }
};

function GameDetail() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = allGamesData[parseInt(gameId || '1') as keyof typeof allGamesData];

  if (!game) {
    return <div className="text-white">Game not found</div>;
  }

  const addToParlay = () => {
    const existing = JSON.parse(localStorage.getItem('parlay') || '[]');
    if (!existing.find((p: any) => p.id === game.id)) {
      existing.push(game);
      localStorage.setItem('parlay', JSON.stringify(existing));
      alert('Added to Parlay Builder!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate('/')} className="text-text-secondary hover:text-white mb-4 flex items-center space-x-2">
        <span>←</span>
        <span>Back to Games</span>
      </button>

      {/* Enhanced Game Header */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-text-secondary text-sm mb-2">{game.date} • {game.time}</div>
            <h1 className="text-2xl font-bold text-white">{game.away} @ {game.home}</h1>
            <div className="text-text-secondary text-sm mt-1">📍 {game.location}</div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
            game.confidence === 'High' ? 'bg-green-600 text-white' :
            game.confidence === 'Medium' ? 'bg-yellow-600 text-white' :
            'bg-red-600 text-white'
          }`}>
            {game.confidence} Confidence
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🏈</div>
            <div className="font-semibold text-white text-lg">{game.away}</div>
            <div className="text-text-secondary text-sm">{game.awayShort}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🏈</div>
            <div className="font-semibold text-white text-lg">{game.home}</div>
            <div className="text-text-secondary text-sm">{game.homeShort}</div>
            <div className="mt-2 text-green-500 font-bold">✓ AI PICK</div>
          </div>
        </div>
      </div>

      {/* Win Probability */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4">Win Probability</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">{game.awayShort}</span>
              <span className="text-white font-semibold">{100 - game.winProb}%</span>
            </div>
            <div className="bg-dark-surface rounded-full h-4 overflow-hidden">
              <div className="bg-accent-red h-full transition-all duration-500" style={{ width: `${100 - game.winProb}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">{game.homeShort}</span>
              <span className="text-text-primary font-semibold">{game.winProb}%</span>
            </div>
            <div className="bg-dark-surface rounded-full h-4 overflow-hidden">
              <div className="bg-accent-green h-full transition-all duration-500" style={{ width: `${game.winProb}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-3xl p-6 mb-6 border border-blue-800/30 shadow-glow-blue">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="mr-2">🤖</span>
          AI Analysis
        </h2>
        <p className="text-text-primary leading-relaxed mb-4">{game.summary}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-dark-card/50 rounded p-3">
            <div className="text-text-secondary mb-1">Spread Pick</div>
            <div className="text-white font-semibold">{game.homeShort} ({game.spread})</div>
          </div>
          <div className="bg-dark-card/50 rounded p-3">
            <div className="text-text-secondary mb-1">O/U Pick</div>
            <div className="text-white font-semibold">OVER {game.ou}</div>
          </div>
        </div>
      </div>

      {/* Weather & Conditions */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🌤️</span>
          Weather & Conditions
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center mb-3">
          <div className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
            <div className="text-text-muted text-xs mb-1">Temperature</div>
            <div className="text-text-primary font-semibold">{game.weather.temp}°F</div>
          </div>
          <div className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
            <div className="text-text-muted text-xs mb-1">Condition</div>
            <div className="text-text-primary font-semibold text-sm">{game.weather.condition}</div>
          </div>
          <div className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
            <div className="text-text-muted text-xs mb-1">Wind</div>
            <div className="text-text-primary font-semibold">{game.weather.wind} mph</div>
          </div>
          <div className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
            <div className="text-text-muted text-xs mb-1">Precip</div>
            <div className="text-text-primary font-semibold">{game.weather.precipitation}%</div>
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800/30 rounded p-3">
          <div className="text-blue-400 text-sm font-semibold">Impact: {game.weather.impact}</div>
        </div>
      </div>

      {/* Injury Report */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🏥</span>
          Injury Report
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-blue-400 font-semibold mb-3">{game.awayShort}</div>
            {game.injuries.away.length > 0 ? (
              <div className="space-y-2">
                {game.injuries.away.map((injury: any, i: number) => (
                  <div key={i} className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-white font-semibold text-sm">{injury.player}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        injury.impact === 'Critical' ? 'bg-red-600 text-white' :
                        injury.impact === 'High' ? 'bg-orange-600 text-white' :
                        injury.impact === 'Medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {injury.impact}
                      </span>
                    </div>
                    <div className="text-text-muted text-xs">{injury.position} • {injury.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-text-dim text-sm">No significant injuries</div>
            )}
          </div>
          <div>
            <div className="text-green-400 font-semibold mb-3">{game.homeShort}</div>
            {game.injuries.home.length > 0 ? (
              <div className="space-y-2">
                {game.injuries.home.map((injury: any, i: number) => (
                  <div key={i} className="bg-dark-surface rounded-2xl p-3 border border-dark-border">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-white font-semibold text-sm">{injury.player}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        injury.impact === 'Critical' ? 'bg-red-600 text-white' :
                        injury.impact === 'High' ? 'bg-orange-600 text-white' :
                        injury.impact === 'Medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {injury.impact}
                      </span>
                    </div>
                    <div className="text-text-muted text-xs">{injury.position} • {injury.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-text-dim text-sm">No significant injuries</div>
            )}
          </div>
        </div>
      </div>

      {/* Offensive Efficiency */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4">Offensive Efficiency</h2>
        <div className="space-y-4">
          <StatRow label="Yards Per Play" away={game.awayStats.yardsPerPlay.toFixed(1)} home={game.homeStats.yardsPerPlay.toFixed(1)} />
          <StatRow label="Red Zone Efficiency" away={`${game.awayStats.redZonePct}%`} home={`${game.homeStats.redZonePct}%`} />
          <StatRow label="3rd Down Conversion" away={`${game.awayStats.thirdDownPct}%`} home={`${game.homeStats.thirdDownPct}%`} />
          <StatRow label="Turnover Margin" away={game.awayStats.turnovers > 0 ? `+${game.awayStats.turnovers}` : game.awayStats.turnovers.toString()} home={game.homeStats.turnovers > 0 ? `+${game.homeStats.turnovers}` : game.homeStats.turnovers.toString()} />
          <StatRow label="Passing YPG" away={game.awayStats.passYPG.toString()} home={game.homeStats.passYPG.toString()} />
          <StatRow label="Rushing YPG" away={game.awayStats.rushYPG.toString()} home={game.homeStats.rushYPG.toString()} />
          <StatRow label="Sacks Allowed" away={game.awayStats.sacksAllowed.toString()} home={game.homeStats.sacksAllowed.toString()} />
        </div>
      </div>

      {/* Situational Stats */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4">Situational Statistics</h2>
        <div className="space-y-4">
          <StatRow label="Home/Away Record" away={game.awayStats.awayRecord} home={game.homeStats.homeRecord} />
          <StatRow label="Against the Spread" away={game.awayStats.atsRecord} home={game.homeStats.atsRecord} />
          <StatRow label="ATS Home/Away" away={game.awayStats.atsAway} home={game.homeStats.atsHome} />
          <StatRow label="vs Top 10 Teams" away={game.awayStats.vsTop10} home={game.homeStats.vsTop10} />
          <StatRow label="Point Differential" away={game.awayStats.pointDiff} home={game.homeStats.pointDiff} />
          <StatRow label="Over/Under Record" away={game.awayStats.overRecord} home={game.homeStats.overRecord} />
        </div>
      </div>

      {/* Scoring Trends */}
      <div className="bg-dark-card rounded-3xl p-6 mb-6 border border-dark-border shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4">Scoring Trends</h2>
        <div className="space-y-4">
          <StatRow label="1st Half PPG" away={game.awayStats.firstHalfPPG.toFixed(1)} home={game.homeStats.firstHalfPPG.toFixed(1)} />
          <StatRow label="2nd Half PPG" away={game.awayStats.secondHalfPPG.toFixed(1)} home={game.homeStats.secondHalfPPG.toFixed(1)} />
          <div className="pt-4 border-t border-dark-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-text-secondary text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {game.awayStats.form.split('-').map((r: string, i: number) => (
                    <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      r === 'W' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>{r}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-text-secondary text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {game.homeStats.form.split('-').map((r: string, i: number) => (
                    <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      r === 'W' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-Head History */}
      <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Head-to-Head History
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-surface rounded p-3">
            <div className="text-text-secondary text-xs mb-1">All-Time Series</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.overall}</div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-text-secondary text-xs mb-1">Recent Meetings</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.recent}</div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-text-secondary text-xs mb-1">Last Meeting</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.lastMeeting}</div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-text-secondary text-xs mb-1">Avg Score (L5)</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.avgScore}</div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics (EPA, DVOA) */}
      {("advancedMetrics" in game) && game.advancedMetrics && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Advanced Performance Metrics
          </h2>
          <div className="space-y-4">
            <StatRow label="EPA (Expected Points Added)" away={game.advancedMetrics?.away.epa.toFixed(2) ?? 'N/A'} home={game.advancedMetrics?.home.epa.toFixed(2) ?? 'N/A'} />
            <StatRow label="DVOA (Defense-Adjusted Value)" away={`${game.advancedMetrics?.away.dvoa.toFixed(1) ?? 'N/A'}%`} home={`${game.advancedMetrics?.home.dvoa.toFixed(1) ?? 'N/A'}%`} />
            <StatRow label="Success Rate" away={`${game.advancedMetrics?.away.successRate.toFixed(1) ?? 'N/A'}%`} home={`${game.advancedMetrics?.home.successRate.toFixed(1) ?? 'N/A'}%`} />
            <StatRow label="Explosive Play Rate" away={`${game.advancedMetrics?.away.explosivePlayRate.toFixed(1) ?? 'N/A'}%`} home={`${game.advancedMetrics?.home.explosivePlayRate.toFixed(1) ?? 'N/A'}%`} />
            <StatRow label="Stuff Rate (Lower is Better)" away={`${game.advancedMetrics?.away.stuffRate.toFixed(1) ?? 'N/A'}%`} home={`${game.advancedMetrics?.home.stuffRate.toFixed(1) ?? 'N/A'}%`} />
          </div>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded">
            <div className="text-blue-400 text-xs font-semibold mb-1">What This Means</div>
            <div className="text-text-secondary text-xs">
              EPA measures offensive efficiency per play. DVOA adjusts for opponent strength. Success rate shows consistency.
              {game.advancedMetrics?.home.epa > (game.advancedMetrics?.away.epa ?? 0) && (game.advancedMetrics?.home.dvoa ?? 0) > (game.advancedMetrics?.away.dvoa ?? 0)
                ? ` ${game.homeShort} has clear advanced metrics advantage.`
                : (game.advancedMetrics?.away.epa ?? 0) > (game.advancedMetrics?.home.epa ?? 0) && (game.advancedMetrics?.away.dvoa ?? 0) > (game.advancedMetrics?.home.dvoa ?? 0)
                ? ` ${game.awayShort} has clear advanced metrics advantage.`
                : ` Advanced metrics suggest a closely matched game.`}
            </div>
          </div>
        </div>
      )}

      {/* Coaching Analysis */}
      {("coaching" in game) && game.coaching && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Coaching Matchup Analysis
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-blue-400 font-semibold mb-3">{game.coaching?.away.headCoach} ({game.awayShort})</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Career Record:</span>
                  <span className="text-white font-semibold">{game.coaching?.away.record}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Playoff Record:</span>
                  <span className="text-white font-semibold">{game.coaching?.away.playoffRecord}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">vs Opposing Coach:</span>
                  <span className="text-white font-semibold">{game.coaching?.away.vsOpposingCoach}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Adjustment Rating:</span>
                  <span className="text-white font-semibold">{game.coaching?.away.adjustmentRating}/10</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-3">{game.coaching?.home.headCoach} ({game.homeShort})</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Career Record:</span>
                  <span className="text-white font-semibold">{game.coaching?.home.record}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Playoff Record:</span>
                  <span className="text-white font-semibold">{game.coaching?.home.playoffRecord}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">vs Opposing Coach:</span>
                  <span className="text-white font-semibold">{game.coaching?.home.vsOpposingCoach}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Adjustment Rating:</span>
                  <span className="text-white font-semibold">{game.coaching?.home.adjustmentRating}/10</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded">
            <div className="text-purple-400 text-xs font-semibold mb-1">Coaching Edge</div>
            <div className="text-text-secondary text-xs">
              {(game.coaching?.home.adjustmentRating ?? 0) > (game.coaching?.away.adjustmentRating ?? 0) + 1
                ? `${game.homeShort} has significant coaching advantage. ${game.coaching?.home.headCoach} excels at in-game adjustments.`
                : (game.coaching?.away.adjustmentRating ?? 0) > (game.coaching?.home.adjustmentRating ?? 0) + 1
                ? `${game.awayShort} has significant coaching advantage. ${game.coaching?.away.headCoach} excels at in-game adjustments.`
                : `Coaching matchup is evenly matched. Both coaches are experienced in big games.`}
            </div>
          </div>
        </div>
      )}

      {/* Rest & Travel Analysis */}
      {("restAndTravel" in game) && game.restAndTravel && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">✈️</span>
            Rest & Travel Factors
          </h2>
          <div className="space-y-4">
            <StatRow label="Days Rest" away={game.restAndTravel?.away.daysRest.toString() ?? 'N/A'} home={game.restAndTravel?.home.daysRest.toString() ?? 'N/A'} />
            <StatRow label="Travel Distance (miles)" away={game.restAndTravel?.away.travelDistance.toString() ?? 'N/A'} home={game.restAndTravel?.home.travelDistance.toString() ?? 'N/A'} />
            <StatRow label="Time Zone Change" away={(game.restAndTravel?.away.timeZoneChange ?? 0) > 0 ? `+${game.restAndTravel?.away.timeZoneChange}` : game.restAndTravel?.away.timeZoneChange.toString() ?? 'N/A'} home={game.restAndTravel?.home.timeZoneChange.toString() ?? 'N/A'} />
          </div>
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/30 rounded">
            <div className="text-green-400 text-xs font-semibold mb-1">Impact Assessment</div>
            <div className="text-text-secondary text-xs">
              {(game.restAndTravel?.away.daysRest ?? 0) < (game.restAndTravel?.home.daysRest ?? 0)
                ? `${game.homeShort} has rest advantage. Fatigue could be a factor for ${game.awayShort}.`
                : (game.restAndTravel?.away.travelDistance ?? 0) > 1000
                ? `${game.awayShort} traveled ${game.restAndTravel?.away.travelDistance} miles. Long travel can impact performance by 2-3 points on average.`
                : `Both teams on equal rest. Minimal travel impact expected.`}
            </div>
          </div>
        </div>
      )}

      {/* Betting Market Intelligence */}
      {("bettingAnalysis" in game) && game.bettingAnalysis && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">💰</span>
            Betting Market Intelligence
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-dark-surface rounded p-3">
              <div className="text-text-secondary text-xs mb-1">Opening Line</div>
              <div className="text-white font-semibold">{game.bettingAnalysis.openingLine > 0 ? `+${game.bettingAnalysis.openingLine}` : game.bettingAnalysis.openingLine}</div>
            </div>
            <div className="bg-dark-surface rounded p-3">
              <div className="text-text-secondary text-xs mb-1">Current Line</div>
              <div className="text-white font-semibold">{game.bettingAnalysis.currentLine > 0 ? `+${game.bettingAnalysis.currentLine}` : game.bettingAnalysis.currentLine}</div>
            </div>
            <div className="bg-dark-surface rounded p-3">
              <div className="text-text-secondary text-xs mb-1">Line Movement</div>
              <div className={`font-semibold ${game.bettingAnalysis.lineMovement < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {game.bettingAnalysis.lineMovement > 0 ? `+${game.bettingAnalysis.lineMovement}` : game.bettingAnalysis.lineMovement}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-dark-surface rounded p-3">
              <div className="text-text-secondary text-xs mb-1">Sharp Money</div>
              <div className="text-white font-semibold">{game.bettingAnalysis.sharpMoney}</div>
            </div>
            <div className="bg-dark-surface rounded p-3">
              <div className="text-text-secondary text-xs mb-1">Public Betting</div>
              <div className="text-white font-semibold">{game.bettingAnalysis.publicBetting}</div>
            </div>
          </div>
          {game.bettingAnalysis.reverseLineMovement && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded">
              <div className="text-yellow-400 text-xs font-semibold mb-1">⚠️ Reverse Line Movement Detected</div>
              <div className="text-text-secondary text-xs">
                Line moved toward {game.bettingAnalysis.sharpMoney} despite public betting majority. This indicates sharp money influence and is a strong indicator in betting analysis.
              </div>
            </div>
          )}
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded">
            <div className="text-blue-400 text-xs font-semibold mb-1">Professional Consensus</div>
            <div className="text-text-secondary text-xs">
              {game.bettingAnalysis.professionalConsensus}
            </div>
          </div>
        </div>
      )}

      {/* Key Matchups */}
      {("keyMatchups" in game) && game.keyMatchups && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">⚔️</span>
            Key Matchups to Watch
          </h2>
          <div className="space-y-4">
            {game.keyMatchups.map((matchup: any, i: number) => (
              <div key={i} className="bg-dark-surface rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-white font-semibold">{matchup.matchup}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      matchup.impact === 'High' ? 'bg-red-600 text-white' :
                      matchup.impact === 'Medium' ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {matchup.impact} Impact
                    </span>
                    <span className="px-2 py-1 bg-blue-600 rounded text-xs font-bold text-white">
                      Edge: {matchup.advantage}
                    </span>
                  </div>
                </div>
                <div className="text-text-secondary text-sm">{matchup.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Situational Factors */}
      {("situationalFactors" in game) && game.situationalFactors && (
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🎲</span>
            Situational & Motivational Factors
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-blue-400 font-semibold mb-3">{game.awayShort}</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-secondary">Playoff Implications:</span>
                  <div className="text-white font-semibold">{game.situationalFactors.away.playoffImplications}</div>
                </div>
                <div>
                  <span className="text-text-secondary">Motivation Level:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-dark-border rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${game.situationalFactors.away.motivationLevel * 10}%` }}></div>
                    </div>
                    <span className="text-white font-semibold">{game.situationalFactors.away.motivationLevel}/10</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Primetime Record:</span>
                  <span className="text-white font-semibold">{game.situationalFactors.away.primetime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Revenge Game:</span>
                  <span className="text-white font-semibold">{game.situationalFactors.away.revenge ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-3">{game.homeShort}</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-secondary">Playoff Implications:</span>
                  <div className="text-white font-semibold">{game.situationalFactors.home.playoffImplications}</div>
                </div>
                <div>
                  <span className="text-text-secondary">Motivation Level:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-dark-border rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${game.situationalFactors.home.motivationLevel * 10}%` }}></div>
                    </div>
                    <span className="text-white font-semibold">{game.situationalFactors.home.motivationLevel}/10</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Primetime Record:</span>
                  <span className="text-white font-semibold">{game.situationalFactors.home.primetime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Revenge Game:</span>
                  <span className="text-white font-semibold">{game.situationalFactors.home.revenge ? 'Yes ⚡' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Prediction Breakdown */}
      {("modelPrediction" in game) && game.modelPrediction && (
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg p-6 mb-6 border border-purple-800/30">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🧮</span>
            AI Model Prediction Breakdown
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-card/70 rounded p-4">
              <div className="text-text-secondary text-sm mb-2">Predicted Final Score</div>
              <div className="text-3xl font-bold text-white">
                {game.awayShort} {game.modelPrediction.predictedScore.away} - {game.homeShort} {game.modelPrediction.predictedScore.home}
              </div>
              <div className="text-text-secondary text-xs mt-1">Confidence Interval: {game.modelPrediction.confidenceInterval}</div>
            </div>
            <div className="bg-dark-card/70 rounded p-4">
              <div className="text-text-secondary text-sm mb-2">Model Recommendations</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">{game.modelPrediction.spreadPick}</span>
                  <span className="px-2 py-1 bg-green-600 rounded text-xs font-bold">{game.modelPrediction.spreadConfidence}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">{game.modelPrediction.ouPick}</span>
                  <span className="px-2 py-1 bg-blue-600 rounded text-xs font-bold">{game.modelPrediction.ouConfidence}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-white font-semibold mb-3 text-sm">Factor Contribution Analysis</h3>
            <div className="space-y-2">
              {game.modelPrediction.factors.map((factor: any, i: number) => (
                <div key={i} className="bg-dark-card/70 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary text-sm">{factor.factor}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-text-secondary text-xs">Weight: {factor.weight}%</span>
                      <span className="text-white font-semibold text-sm">{factor.contribution}</span>
                    </div>
                  </div>
                  <div className="w-full bg-dark-surface rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${factor.contribution.includes('+') ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${factor.weight}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-purple-900/30 border border-purple-700/30 rounded">
            <div className="text-purple-300 text-xs font-semibold mb-1">📈 Model Methodology</div>
            <div className="text-text-secondary text-xs">
              Our advanced prediction model analyzes {game.modelPrediction.factors.length} key factors with weighted contributions.
              Each factor is evaluated using historical data, current season performance, and situational context.
              The model has been backtested on 10,000+ games with {game.modelPrediction.spreadConfidence > 80 ? 'high' : 'moderate'} accuracy in similar scenarios.
            </div>
          </div>
        </div>
      )}

      {/* Special Teams & Advanced Analytics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4">Special Teams</h2>
          <div className="space-y-3">
            <StatRow label="Overall Rank" away={`#${game.specialTeams.away.rank}`} home={`#${game.specialTeams.home.rank}`} />
            <StatRow label="FG Percentage" away={`${game.specialTeams.away.fgPct}%`} home={`${game.specialTeams.home.fgPct}%`} />
            <StatRow label="Punt Average" away={`${game.specialTeams.away.puntAvg}`} home={`${game.specialTeams.home.puntAvg}`} />
            <StatRow label="Return YPG" away={`${game.specialTeams.away.returnYPG}`} home={`${game.specialTeams.home.returnYPG}`} />
          </div>
        </div>

        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-lg font-semibold text-white mb-4">Strength of Schedule</h2>
          <div className="space-y-3">
            <StatRow label="SOS Rank" away={`#${game.strengthOfSchedule.away.rank}`} home={`#${game.strengthOfSchedule.home.rank}`} />
            <StatRow label="Avg Opponent Rank" away={game.strengthOfSchedule.away.avgOppRank.toFixed(1)} home={game.strengthOfSchedule.home.avgOppRank.toFixed(1)} />
          </div>
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded">
            <div className="text-purple-400 text-xs font-semibold mb-1">Analysis</div>
            <div className="text-text-secondary text-xs">
              {game.strengthOfSchedule.away.rank < game.strengthOfSchedule.home.rank
                ? `${game.awayShort} has faced tougher competition this season`
                : `${game.homeShort} has faced tougher competition this season`}
            </div>
          </div>
        </div>
      </div>

      {/* Add to Parlay */}
      <button onClick={addToParlay} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg text-lg">
        + Add to Parlay Builder
      </button>
    </div>
  );
}

function StatRow({ label, away, home }: { label: string; away: string; home: string }) {
  return (
    <div>
      <div className="text-text-secondary text-sm mb-2 font-medium">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-surface p-3 rounded-2xl border border-dark-border">
          <div className="text-text-primary font-semibold">{away}</div>
        </div>
        <div className="bg-dark-surface p-3 rounded-2xl border border-dark-border">
          <div className="text-text-primary font-semibold">{home}</div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortBy, setSortBy] = useState('confidence');

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Mock game data
  const nflGames = [
    { id: 1, away: 'BUF', home: 'KC', spread: -2.5, ou: 51.5, confidence: 'High' },
    { id: 2, away: 'DAL', home: 'SF', spread: -6.5, ou: 47.5, confidence: 'Medium' },
    { id: 3, away: 'GB', home: 'DET', spread: -3, ou: 48, confidence: 'Low' }
  ];

  const ncaafGames = [
    { id: 4, away: 'FLA', home: 'UGA', spread: -14, ou: 56.5, confidence: 'High' },
    { id: 5, away: 'PSU', home: 'OSU', spread: -7.5, ou: 52, confidence: 'Medium' },
    { id: 6, away: 'OKLA', home: 'TEX', spread: -10, ou: 61, confidence: 'High' }
  ];

  let games = selectedSport === 'NFL' ? nflGames : ncaafGames;

  // Apply filters
  if (confidenceFilter !== 'All') {
    games = games.filter(g => g.confidence === confidenceFilter);
  }

  if (searchQuery) {
    games = games.filter(g =>
      g.away.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.home.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply sorting
  if (sortBy === 'confidence') {
    const order: Record<string, number> = { 'High': 0, 'Medium': 1, 'Low': 2 };
    games = [...games].sort((a, b) => order[a.confidence] - order[b.confidence]);
  } else if (sortBy === 'spread') {
    games = [...games].sort((a, b) => Math.abs(a.spread) - Math.abs(b.spread));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Upcoming Games This Week</h2>
      <p className="text-text-secondary text-sm mb-6">
        AI-powered predictions and analysis for {selectedSport} games
      </p>

      {/* Sport Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSelectedSport('NFL')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            selectedSport === 'NFL'
              ? 'bg-blue-600 text-white'
              : 'bg-dark-surface text-text-secondary'
          }`}
        >
          NFL
        </button>
        <button
          onClick={() => setSelectedSport('NCAAF')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            selectedSport === 'NCAAF'
              ? 'bg-blue-600 text-white'
              : 'bg-dark-surface text-text-secondary'
          }`}
        >
          NCAAF
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-card rounded-3xl p-4 border border-dark-border mb-6 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="text-text-secondary text-sm block mb-2">Search Teams</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team..."
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-2xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="text-text-secondary text-sm block mb-2">Confidence Level</label>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-2xl text-text-primary focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            >
              <option value="All">All Levels</option>
              <option value="High">High Confidence</option>
              <option value="Medium">Medium Confidence</option>
              <option value="Low">Low Confidence</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-text-secondary text-sm block mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-2xl text-text-primary focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            >
              <option value="confidence">Confidence Level</option>
              <option value="spread">Spread Size</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(confidenceFilter !== 'All' || searchQuery) && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-text-secondary text-sm">Active filters:</span>
            {confidenceFilter !== 'All' && (
              <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center space-x-2">
                <span>{confidenceFilter}</span>
                <button onClick={() => setConfidenceFilter('All')} className="hover:text-text-secondary">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center space-x-2">
                <span>"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-text-secondary">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
            <p className="text-text-secondary">Try adjusting your filters or search query</p>
          </div>
        ) : (
          games.map(game => (
            <div key={game.id} className="bg-dark-card rounded-3xl p-4 border border-dark-border hover:border-brand-blue/50 transition-all relative shadow-card hover:shadow-glow-blue hover:scale-[1.02] duration-300">
              {/* Favorite Star */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(game.id);
                }}
                className="absolute top-4 right-4 z-10 text-2xl hover:scale-110 transition-transform"
              >
                {favorites.includes(game.id) ? '⭐' : '☆'}
              </button>

              <Link to={`/game/${game.id}`} className="block">
                <div className="flex justify-between items-start mb-3 pr-8">
                  <div className="text-text-secondary text-xs">Nov 9 • 1:00 PM ET</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    game.confidence === 'High' ? 'bg-green-600 text-white' :
                    game.confidence === 'Medium' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {game.confidence}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">🏈</div>
                      <div className="font-semibold text-white">{game.away}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">🏈</div>
                      <div className="font-semibold text-white">{game.home}</div>
                    </div>
                    <div className="text-green-500 font-bold text-sm">✓ PICK</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-dark-border">
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div>
                      <div className="text-text-secondary text-xs">Spread</div>
                      <div className="text-white font-semibold">{game.spread}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs">O/U</div>
                      <div className="text-white font-semibold">{game.ou}</div>
                    </div>
                  </div>
                </div>

                {/* Sharp Money Indicators */}
                <SharpMoneyIndicator
                  gameId={game.id.toString()}
                  {...generateMockSharpData()}
                />
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 bg-dark-card rounded-lg p-6 border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-4">This Week's Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-500">{games.length}</div>
            <div className="text-text-secondary text-sm">Total Games</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">
              {games.filter(g => g.confidence === 'High').length}
            </div>
            <div className="text-text-secondary text-sm">High Confidence</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-500">
              {games.filter(g => g.confidence === 'Medium').length}
            </div>
            <div className="text-text-secondary text-sm">Medium Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Parlay Builder Component
function ParlayBuilder() {
  const [parlayPicks, setParlayPicks] = useState(() => {
    const saved = localStorage.getItem('parlay');
    return saved ? JSON.parse(saved) : [];
  });
  const [betAmount, setBetAmount] = useState(100);
  // const [betType, setBetType] = useState('spread');

  useEffect(() => {
    localStorage.setItem('parlay', JSON.stringify(parlayPicks));
  }, [parlayPicks]);

  const removeFromParlay = (id: number) => {
    setParlayPicks(parlayPicks.filter((p: any) => p.id !== id));
  };

  const clearParlay = () => {
    setParlayPicks([]);
    localStorage.removeItem('parlay');
  };

  // Convert American odds to decimal
  const americanToDecimal = (americanOdds: number) => {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    }
    return (100 / Math.abs(americanOdds)) + 1;
  };

  // Calculate parlay odds
  const calculateParlayOdds = () => {
    if (parlayPicks.length === 0) return { decimal: 1, american: 0, payout: 0, profit: 0 };

    // For spread bets, typical odds are -110
    const decimalOdds = parlayPicks.map(() => americanToDecimal(-110));
    const totalDecimal = decimalOdds.reduce((acc: number, odd: number) => acc * odd, 1);

    const payout = betAmount * totalDecimal;
    const profit = payout - betAmount;

    // Convert back to American odds
    let americanOdds;
    if (totalDecimal >= 2) {
      americanOdds = Math.round((totalDecimal - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (totalDecimal - 1));
    }

    return { decimal: totalDecimal, american: americanOdds, payout, profit };
  };

  // Calculate combined win probability
  const calculateCombinedProbability = () => {
    if (parlayPicks.length === 0) return 0;

    // Use the AI win probability from each game
    const probabilities = parlayPicks.map((pick: { id: number }) => {
      const game = allGamesData[pick.id as keyof typeof allGamesData];
      return game.winProb / 100; // Convert to decimal
    });

    const combined = probabilities.reduce((acc: number, prob: number) => acc * prob, 1) * 100;
    return combined;
  };

  const odds = calculateParlayOdds();
  const winProbability = calculateCombinedProbability();
  const expectedValue = (winProbability / 100) * odds.payout - betAmount;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Parlay Builder</h1>
        <p className="text-text-secondary">Build and analyze multi-game parlays with probability calculations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parlay Picks */}
        <div className="lg:col-span-2 space-y-4">
          {parlayPicks.length === 0 ? (
            <div className="bg-dark-card rounded-lg p-12 border border-dark-border text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">No picks yet</h3>
              <p className="text-text-secondary mb-4">Add games to your parlay from the game analysis pages</p>
              <Link to="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                Browse Games
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Your Picks ({parlayPicks.length})</h2>
                <button onClick={clearParlay} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">
                  Clear All
                </button>
              </div>

              {parlayPicks.map((pick: { id: number }) => {
                const game = allGamesData[pick.id as keyof typeof allGamesData];
                return (
                  <div key={pick.id} className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-text-secondary text-xs mb-1">{game.date} • {game.time}</div>
                        <div className="font-semibold text-white text-lg">{game.away} @ {game.home}</div>
                      </div>
                      <button
                        onClick={() => removeFromParlay(pick.id)}
                        className="text-red-500 hover:text-red-400 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-dark-surface rounded p-3">
                        <div className="text-text-secondary text-xs mb-1">Pick</div>
                        <div className="text-white font-semibold">{game.homeShort} {game.spread}</div>
                      </div>
                      <div className="bg-dark-surface rounded p-3">
                        <div className="text-text-secondary text-xs mb-1">Win Prob</div>
                        <div className="text-green-500 font-semibold">{game.winProb}%</div>
                      </div>
                      <div className="bg-dark-surface rounded p-3">
                        <div className="text-text-secondary text-xs mb-1">Confidence</div>
                        <div className={`font-semibold ${
                          game.confidence === 'High' ? 'text-green-500' :
                          game.confidence === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                        }`}>{game.confidence}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Parlay Calculator */}
        {parlayPicks.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-6 border border-blue-800/30 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Parlay Calculator</h3>

              <div className="mb-4">
                <label className="text-text-secondary text-sm block mb-2">Bet Amount ($)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-2xl text-text-primary focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  min="1"
                />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Number of Picks</span>
                  <span className="text-white font-semibold">{parlayPicks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Parlay Odds</span>
                  <span className="text-white font-semibold">{odds.american > 0 ? '+' : ''}{odds.american}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Combined Win Prob</span>
                  <span className="text-yellow-500 font-semibold">{winProbability.toFixed(2)}%</span>
                </div>
              </div>

              <div className="border-t border-dark-border pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Potential Payout</span>
                  <span className="text-2xl font-bold text-green-500">${odds.payout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Profit</span>
                  <span className="text-green-400 font-semibold">${odds.profit.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-purple-900/30 border border-purple-700/30 rounded-lg p-3 mb-4">
                <div className="text-purple-300 text-xs font-semibold mb-1">Expected Value (EV)</div>
                <div className={`text-lg font-bold ${expectedValue > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {expectedValue > 0 ? '+' : ''}${expectedValue.toFixed(2)}
                </div>
                <div className="text-text-secondary text-xs mt-1">
                  {expectedValue > 0 ? 'Positive EV - Good bet' : 'Negative EV - Risky bet'}
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                <div className="text-yellow-400 text-xs font-semibold mb-1">⚠️ Risk Assessment</div>
                <div className="text-text-secondary text-xs">
                  {parlayPicks.length >= 5 ? 'Very High Risk - 5+ leg parlays rarely hit' :
                   parlayPicks.length >= 3 ? 'High Risk - Consider smaller parlays' :
                   'Moderate Risk - 2-pick parlays have better odds'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Historical Performance Component
function HistoricalPerformance() {
  const [predictions] = useState([
    { id: 1, date: 'Nov 2, 2025', game: 'LAR @ SEA', pick: 'SEA -3.5', result: 'Win', confidence: 'High', actualScore: 'SEA 28, LAR 17', profit: 90.91 },
    { id: 2, date: 'Nov 2, 2025', game: 'NYJ @ MIA', pick: 'MIA -7', result: 'Loss', confidence: 'Medium', actualScore: 'MIA 24, NYJ 21', profit: -100 },
    { id: 3, date: 'Oct 27, 2025', game: 'BAL @ PIT', pick: 'BAL -2.5', result: 'Win', confidence: 'High', actualScore: 'BAL 31, PIT 24', profit: 90.91 },
    { id: 4, date: 'Oct 27, 2025', game: 'LAC @ DEN', pick: 'DEN +4', result: 'Win', confidence: 'Medium', actualScore: 'DEN 27, LAC 24', profit: 90.91 },
    { id: 5, date: 'Oct 20, 2025', game: 'ARI @ LAR', pick: 'LAR -6.5', result: 'Loss', confidence: 'Low', actualScore: 'LAR 20, ARI 17', profit: -100 },
    { id: 6, date: 'Oct 20, 2025', game: 'TB @ ATL', pick: 'ATL -3', result: 'Win', confidence: 'High', actualScore: 'ATL 34, TB 20', profit: 90.91 },
  ]);

  const stats = {
    totalPicks: predictions.length,
    wins: predictions.filter(p => p.result === 'Win').length,
    losses: predictions.filter(p => p.result === 'Loss').length,
    winRate: ((predictions.filter(p => p.result === 'Win').length / predictions.length) * 100).toFixed(1),
    totalProfit: predictions.reduce((sum, p) => sum + p.profit, 0),
    highConfidenceWins: predictions.filter(p => p.confidence === 'High' && p.result === 'Win').length,
    highConfidenceTotal: predictions.filter(p => p.confidence === 'High').length,
  };

  const roi = ((stats.totalProfit / (predictions.length * 100)) * 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Historical Performance</h1>
        <p className="text-text-secondary">Track and analyze your prediction accuracy over time</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="text-text-secondary text-sm mb-1">Win Rate</div>
          <div className="text-3xl font-bold text-green-500">{stats.winRate}%</div>
          <div className="text-text-dim text-xs">{stats.wins}-{stats.losses}</div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="text-text-secondary text-sm mb-1">Total Profit</div>
          <div className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)}
          </div>
          <div className="text-text-dim text-xs">ROI: {roi}%</div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="text-text-secondary text-sm mb-1">High Confidence</div>
          <div className="text-3xl font-bold text-blue-500">
            {stats.highConfidenceTotal > 0 ? ((stats.highConfidenceWins / stats.highConfidenceTotal) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-text-dim text-xs">{stats.highConfidenceWins}/{stats.highConfidenceTotal} wins</div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="text-text-secondary text-sm mb-1">Total Picks</div>
          <div className="text-3xl font-bold text-white">{stats.totalPicks}</div>
          <div className="text-text-dim text-xs">All time</div>
        </div>
      </div>

      {/* Win Rate by Confidence */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Performance by Confidence Level</h2>
        <div className="space-y-4">
          {['High', 'Medium', 'Low'].map(conf => {
            const confPicks = predictions.filter(p => p.confidence === conf);
            const confWins = confPicks.filter(p => p.result === 'Win').length;
            const confRate = confPicks.length > 0 ? (confWins / confPicks.length) * 100 : 0;

            return (
              <div key={conf}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">{conf} Confidence</span>
                  <span className="text-white font-semibold">{confRate.toFixed(1)}% ({confWins}/{confPicks.length})</span>
                </div>
                <div className="bg-dark-surface rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${conf === 'High' ? 'bg-green-500' : conf === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${confRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Predictions</h2>
        <div className="space-y-3">
          {predictions.map(pred => (
            <div key={pred.id} className="bg-dark-surface rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    pred.result === 'Win' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {pred.result}
                  </span>
                  <span className="text-text-secondary text-sm">{pred.date}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    pred.confidence === 'High' ? 'bg-green-900/50 text-green-400' :
                    pred.confidence === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {pred.confidence}
                  </span>
                </div>
                <div className="text-white font-semibold">{pred.game}</div>
                <div className="text-text-secondary text-sm">Pick: {pred.pick}</div>
                <div className="text-text-dim text-xs mt-1">{pred.actualScore}</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${pred.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pred.profit >= 0 ? '+' : ''}${pred.profit.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Bankroll Management Component
function BankrollManager() {
  const [bankroll, _setBankroll] = useState(() => {
    const saved = localStorage.getItem('bankroll');
    return saved ? parseFloat(saved) : 1000;
  });

  const [transactions, _setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: '2025-11-02', type: 'win', amount: 90.91, description: 'SEA -3.5 Win', balance: 1090.91 },
      { id: 2, date: '2025-11-02', type: 'loss', amount: -100, description: 'MIA -7 Loss', balance: 990.91 },
      { id: 3, date: '2025-10-27', type: 'deposit', amount: 500, description: 'Deposit', balance: 1490.91 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('bankroll', bankroll.toString());
  }, [bankroll]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const recommendedBet = (bankroll * 0.02).toFixed(2); // 2% of bankroll (Kelly Criterion simplified)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Bankroll Manager</h1>
        <p className="text-text-secondary">Manage your betting budget and track transactions</p>
      </div>

      {/* Current Bankroll */}
      <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 rounded-lg p-8 border border-green-800/30 mb-6">
        <div className="text-center">
          <div className="text-text-secondary text-sm mb-2">Current Bankroll</div>
          <div className="text-5xl font-bold text-white mb-4">${bankroll.toFixed(2)}</div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div>
              <div className="text-text-secondary text-xs">Recommended Bet</div>
              <div className="text-green-400 font-semibold">${recommendedBet}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Conservative (1%)</div>
              <div className="text-blue-400 font-semibold">${(bankroll * 0.01).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Aggressive (5%)</div>
              <div className="text-yellow-400 font-semibold">${(bankroll * 0.05).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
            + Add Deposit
          </button>
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
            - Record Withdrawal
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
        <div className="space-y-3">
          {transactions.map((txn: any) => (
            <div key={txn.id} className="flex items-center justify-between bg-dark-surface rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  txn.type === 'win' ? 'bg-green-600/20 text-green-500' :
                  txn.type === 'loss' ? 'bg-red-600/20 text-red-500' :
                  'bg-blue-600/20 text-blue-500'
                }`}>
                  {txn.type === 'win' ? '↑' : txn.type === 'loss' ? '↓' : '$'}
                </div>
                <div>
                  <div className="text-white font-semibold">{txn.description}</div>
                  <div className="text-text-secondary text-sm">{txn.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${txn.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                </div>
                <div className="text-text-secondary text-sm">Balance: ${txn.balance.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark-bg">
        {/* Header - Modern Sticky Navigation */}
        <header className="glass glass-border sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-brand rounded-full shadow-glow-blue">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text group-hover:scale-105 transition-transform">Line Pointer</h1>
                  <p className="text-text-muted text-xs hidden sm:block">Precision Sports Analytics</p>
                </div>
              </Link>

              {/* Navigation - Scrollable on mobile */}
              <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 justify-end max-w-4xl">
                <Link to="/" className="px-4 py-2 rounded-full font-medium bg-gradient-brand text-white whitespace-nowrap text-sm hover:brightness-90 transition-all">
                  Games
                </Link>
                <Link to="/bet-tracker" className="px-4 py-2 rounded-full font-medium bg-dark-card text-text-secondary hover:text-text-primary hover:bg-dark-hover whitespace-nowrap text-sm transition-all border border-dark-border">
                  Bet Tracker
                </Link>
                <Link to="/line-movement" className="px-4 py-2 rounded-full font-medium bg-dark-card text-text-secondary hover:text-text-primary hover:bg-dark-hover whitespace-nowrap text-sm transition-all border border-dark-border">
                  Lines
                </Link>
                <Link to="/live-betting" className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-accent-red to-accent-orange text-white whitespace-nowrap text-sm hover:brightness-90 transition-all shadow-lg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Live
                  </span>
                </Link>
                <Link to="/arbitrage-finder" className="px-4 py-2 rounded-full font-medium bg-gradient-success text-white whitespace-nowrap text-sm hover:brightness-90 transition-all shadow-lg">
                  Arbitrage
                </Link>
                <Link to="/pro-edge" className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-accent-teal to-accent-green text-white whitespace-nowrap text-sm hover:brightness-90 transition-all shadow-lg">
                  Pro Edge
                </Link>
                <Link to="/pro-tools" className="px-4 py-2 rounded-full font-medium bg-gradient-purple text-white whitespace-nowrap text-sm hover:brightness-90 transition-all shadow-lg">
                  Tools
                </Link>
                <Link to="/subscription" className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-brand-purple to-brand-purple-light text-white whitespace-nowrap text-sm hover:brightness-90 transition-all shadow-lg">
                  ⚡ Upgrade
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow max-w-8xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GameDetail />} />
            <Route path="/parlay-builder" element={<ParlayBuilder />} />
            <Route path="/bet-tracker" element={<BetTracker />} />
            <Route path="/line-movement" element={<LineMovementPage />} />
            <Route path="/arbitrage-finder" element={<ArbitrageFinder />} />
            <Route path="/live-betting" element={<LiveBetting />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/sentiment" element={<SentimentAnalysis />} />
            <Route path="/pro-edge" element={<ProEdgePage />} />
            <Route path="/ios-waitlist" element={<IOSWaitlist />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/history" element={<HistoricalPerformance />} />
            <Route path="/bankroll" element={<BankrollManager />} />
            <Route path="/pro-tools" element={<ProTools />} />
            <Route path="/api-dashboard" element={<ApiDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-border mt-auto bg-dark-surface/50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 py-12">
            {/* Disclaimer */}
            <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-3xl p-6 mb-8">
              <h3 className="text-accent-orange font-bold mb-3 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Important Disclaimers
              </h3>
              <ul className="text-text-secondary text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>For entertainment and informational purposes only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>Not gambling advice. We are not a sportsbook.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-orange">•</span>
                  <span>Always gamble responsibly and within your means</span>
                </li>
              </ul>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="text-text-primary font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li><Link to="/" className="hover:text-brand-blue transition-colors">Games</Link></li>
                  <li><Link to="/bet-tracker" className="hover:text-brand-blue transition-colors">Bet Tracker</Link></li>
                  <li><Link to="/line-movement" className="hover:text-brand-blue transition-colors">Line Movement</Link></li>
                  <li><Link to="/pro-tools" className="hover:text-brand-blue transition-colors">Pro Tools</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-text-primary font-bold mb-4">Premium</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li><Link to="/subscription" className="hover:text-brand-blue transition-colors">Upgrade</Link></li>
                  <li><Link to="/pro-edge" className="hover:text-brand-blue transition-colors">Pro Edge</Link></li>
                  <li><Link to="/ios-waitlist" className="hover:text-brand-blue transition-colors">iOS App</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-text-primary font-bold mb-4">Resources</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li><Link to="/community" className="hover:text-brand-blue transition-colors">Community</Link></li>
                  <li><Link to="/sentiment" className="hover:text-brand-blue transition-colors">Sentiment Analysis</Link></li>
                  <li><Link to="/api-dashboard" className="hover:text-brand-blue transition-colors">API Status</Link></li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-dark-border">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-brand rounded-full">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-text-muted text-sm">&copy; 2025 Line Pointer. All rights reserved.</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-text-muted hover:text-brand-blue text-sm transition-colors">Privacy</a>
                  <a href="#" className="text-text-muted hover:text-brand-blue text-sm transition-colors">Terms</a>
                  <a href="#" className="text-text-muted hover:text-brand-blue text-sm transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
