import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Comprehensive game data with advanced analytics
const allGamesData = {
  1: {
    id: 1, away: 'Buffalo Bills', awayShort: 'BUF', home: 'Kansas City Chiefs', homeShort: 'KC',
    spread: -2.5, ou: 51.5, confidence: 'High', winProb: 62, sport: 'NFL',
    date: 'November 9, 2025', time: '1:00 PM ET', location: 'Arrowhead Stadium, Kansas City, MO',
    summary: 'Chiefs offense at home is elite, averaging 28.5 PPG with 6.2 yards per play. Buffalo\'s defense has struggled on the road, allowing 24.8 PPG away. KC\'s home field advantage and superior red zone efficiency (68% vs 54%) give them a significant edge. Weather conditions favor the passing game.',

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
  const game = allGamesData[parseInt(gameId || '1')];

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
      <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-4 flex items-center space-x-2">
        <span>←</span>
        <span>Back to Games</span>
      </button>

      {/* Enhanced Game Header */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-gray-400 text-sm mb-2">{game.date} • {game.time}</div>
            <h1 className="text-2xl font-bold text-white">{game.away} @ {game.home}</h1>
            <div className="text-gray-400 text-sm mt-1">📍 {game.location}</div>
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
            <div className="text-gray-400 text-sm">{game.awayShort}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🏈</div>
            <div className="font-semibold text-white text-lg">{game.home}</div>
            <div className="text-gray-400 text-sm">{game.homeShort}</div>
            <div className="mt-2 text-green-500 font-bold">✓ AI PICK</div>
          </div>
        </div>
      </div>

      {/* Win Probability */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Win Probability</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{game.awayShort}</span>
              <span className="text-white font-semibold">{100 - game.winProb}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div className="bg-red-600 h-full" style={{ width: `${100 - game.winProb}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{game.homeShort}</span>
              <span className="text-white font-semibold">{game.winProb}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div className="bg-green-600 h-full" style={{ width: `${game.winProb}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-6 mb-6 border border-blue-800/30">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="mr-2">🤖</span>
          AI Analysis
        </h2>
        <p className="text-gray-200 leading-relaxed mb-4">{game.summary}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900/50 rounded p-3">
            <div className="text-gray-400 mb-1">Spread Pick</div>
            <div className="text-white font-semibold">{game.homeShort} ({game.spread})</div>
          </div>
          <div className="bg-gray-900/50 rounded p-3">
            <div className="text-gray-400 mb-1">O/U Pick</div>
            <div className="text-white font-semibold">OVER {game.ou}</div>
          </div>
        </div>
      </div>

      {/* Weather & Conditions */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🌤️</span>
          Weather & Conditions
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center mb-3">
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Temperature</div>
            <div className="text-white font-semibold">{game.weather.temp}°F</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Condition</div>
            <div className="text-white font-semibold text-sm">{game.weather.condition}</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Wind</div>
            <div className="text-white font-semibold">{game.weather.wind} mph</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Precip</div>
            <div className="text-white font-semibold">{game.weather.precipitation}%</div>
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800/30 rounded p-3">
          <div className="text-blue-400 text-sm font-semibold">Impact: {game.weather.impact}</div>
        </div>
      </div>

      {/* Injury Report */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🏥</span>
          Injury Report
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-blue-400 font-semibold mb-3">{game.awayShort}</div>
            {game.injuries.away.length > 0 ? (
              <div className="space-y-2">
                {game.injuries.away.map((injury, i) => (
                  <div key={i} className="bg-gray-800 rounded p-3">
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
                    <div className="text-gray-400 text-xs">{injury.position} • {injury.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No significant injuries</div>
            )}
          </div>
          <div>
            <div className="text-green-400 font-semibold mb-3">{game.homeShort}</div>
            {game.injuries.home.length > 0 ? (
              <div className="space-y-2">
                {game.injuries.home.map((injury, i) => (
                  <div key={i} className="bg-gray-800 rounded p-3">
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
                    <div className="text-gray-400 text-xs">{injury.position} • {injury.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No significant injuries</div>
            )}
          </div>
        </div>
      </div>

      {/* Offensive Efficiency */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
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
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
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
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Scoring Trends</h2>
        <div className="space-y-4">
          <StatRow label="1st Half PPG" away={game.awayStats.firstHalfPPG.toFixed(1)} home={game.homeStats.firstHalfPPG.toFixed(1)} />
          <StatRow label="2nd Half PPG" away={game.awayStats.secondHalfPPG.toFixed(1)} home={game.homeStats.secondHalfPPG.toFixed(1)} />
          <div className="pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {game.awayStats.form.split('-').map((r, i) => (
                    <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      r === 'W' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>{r}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-2">Recent Form</div>
                <div className="flex space-x-1">
                  {game.homeStats.form.split('-').map((r, i) => (
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
      <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Head-to-Head History
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">All-Time Series</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.overall}</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Recent Meetings</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.recent}</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Last Meeting</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.lastMeeting}</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">Avg Score (L5)</div>
            <div className="text-white font-semibold text-sm">{game.headToHead.avgScore}</div>
          </div>
        </div>
      </div>

      {/* Special Teams & Advanced Analytics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Special Teams</h2>
          <div className="space-y-3">
            <StatRow label="Overall Rank" away={`#${game.specialTeams.away.rank}`} home={`#${game.specialTeams.home.rank}`} />
            <StatRow label="FG Percentage" away={`${game.specialTeams.away.fgPct}%`} home={`${game.specialTeams.home.fgPct}%`} />
            <StatRow label="Punt Average" away={`${game.specialTeams.away.puntAvg}`} home={`${game.specialTeams.home.puntAvg}`} />
            <StatRow label="Return YPG" away={`${game.specialTeams.away.returnYPG}`} home={`${game.specialTeams.home.returnYPG}`} />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Strength of Schedule</h2>
          <div className="space-y-3">
            <StatRow label="SOS Rank" away={`#${game.strengthOfSchedule.away.rank}`} home={`#${game.strengthOfSchedule.home.rank}`} />
            <StatRow label="Avg Opponent Rank" away={game.strengthOfSchedule.away.avgOppRank.toFixed(1)} home={game.strengthOfSchedule.home.avgOppRank.toFixed(1)} />
          </div>
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded">
            <div className="text-purple-400 text-xs font-semibold mb-1">Analysis</div>
            <div className="text-gray-300 text-xs">
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
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-white font-semibold">{away}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-white font-semibold">{home}</div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [selectedSport, setSelectedSport] = useState('NFL');

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

  const games = selectedSport === 'NFL' ? nflGames : ncaafGames;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Upcoming Games This Week</h2>
      <p className="text-gray-400 text-sm mb-6">
        AI-powered predictions and analysis for {selectedSport} games
      </p>

      {/* Sport Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSelectedSport('NFL')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            selectedSport === 'NFL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300'
          }`}
        >
          NFL
        </button>
        <button
          onClick={() => setSelectedSport('NCAAF')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            selectedSport === 'NCAAF'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300'
          }`}
        >
          NCAAF
        </button>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <Link key={game.id} to={`/game/${game.id}`}>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div className="text-gray-400 text-xs">Nov 9 • 1:00 PM ET</div>
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

              <div className="pt-3 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Spread</div>
                    <div className="text-white font-semibold">{game.spread}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">O/U</div>
                    <div className="text-white font-semibold">{game.ou}</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">This Week's Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-500">{games.length}</div>
            <div className="text-gray-400 text-sm">Total Games</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">
              {games.filter(g => g.confidence === 'High').length}
            </div>
            <div className="text-gray-400 text-sm">High Confidence</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-500">
              {games.filter(g => g.confidence === 'Medium').length}
            </div>
            <div className="text-gray-400 text-sm">Medium Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-950">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏈</span>
              <h1 className="text-xl font-bold text-white">AI Sports Analyst</h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1 mt-4">
              <Link to="/" className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
                Games
              </Link>
              <Link to="/parlay-builder" className="px-4 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700">
                Parlay Builder
              </Link>
              <Link to="/history" className="px-4 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700">
                Performance
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GameDetail />} />
            <Route path="/parlay-builder" element={<div className="text-white text-center py-12"><h2 className="text-2xl font-bold mb-4">Parlay Builder</h2><p className="text-gray-400">Coming soon! Add games from analysis pages.</p></div>} />
            <Route path="/history" element={<div className="text-white text-center py-12"><h2 className="text-2xl font-bold mb-4">Historical Performance</h2><p className="text-gray-400">Track your prediction accuracy (coming soon)</p></div>} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
              <h3 className="text-yellow-500 font-semibold mb-2 text-sm">⚠️ Important Disclaimers</h3>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• For entertainment and informational purposes only</li>
                <li>• Not gambling advice. We are not a sportsbook.</li>
                <li>• Always gamble responsibly</li>
              </ul>
            </div>
            <div className="text-center text-gray-500 text-xs">
              <p>&copy; 2025 AI Sports Analyst</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
