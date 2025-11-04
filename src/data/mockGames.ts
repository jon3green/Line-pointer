import { Game, HistoricalRecord } from '../types';

export const mockNFLGames: Game[] = [
  {
    id: 'nfl-1',
    sport: 'NFL',
    homeTeam: {
      id: 'kc',
      name: 'Kansas City Chiefs',
      shortName: 'KC',
      logo: '🏈',
      color: '#E31837',
      secondaryColor: '#FFB81C'
    },
    awayTeam: {
      id: 'buf',
      name: 'Buffalo Bills',
      shortName: 'BUF',
      logo: '🏈',
      color: '#00338D',
      secondaryColor: '#C60C30'
    },
    date: '2025-11-09',
    time: '1:00 PM ET',
    spread: -2.5,
    overUnder: 51.5,
    homeMoneyline: -135,
    awayMoneyline: +115,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'home',
      winProbability: 62,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'Chiefs offense at home is elite, averaging 28.5 PPG. Buffalo\'s defense has struggled on the road. Expect a high-scoring affair with KC covering.'
    },
    stats: {
      homeTeam: {
        offenseRank: 3,
        defenseRank: 12,
        recentForm: 'W-W-W-L-W',
        injuries: ['WR - Questionable'],
        avgPointsScored: 28.5,
        avgPointsAllowed: 21.3
      },
      awayTeam: {
        offenseRank: 5,
        defenseRank: 8,
        recentForm: 'W-L-W-W-L',
        injuries: ['OL - Out', 'LB - Doubtful'],
        avgPointsScored: 26.8,
        avgPointsAllowed: 19.2
      },
      weather: {
        condition: 'Clear',
        temperature: 65,
        windSpeed: 8
      }
    }
  },
  {
    id: 'nfl-2',
    sport: 'NFL',
    homeTeam: {
      id: 'sf',
      name: 'San Francisco 49ers',
      shortName: 'SF',
      logo: '🏈',
      color: '#AA0000',
      secondaryColor: '#B3995D'
    },
    awayTeam: {
      id: 'dal',
      name: 'Dallas Cowboys',
      shortName: 'DAL',
      logo: '🏈',
      color: '#041E42',
      secondaryColor: '#869397'
    },
    date: '2025-11-09',
    time: '4:25 PM ET',
    spread: -6.5,
    overUnder: 47.5,
    homeMoneyline: -280,
    awayMoneyline: +230,
    aiConfidence: 'Medium',
    aiPrediction: {
      winner: 'home',
      winProbability: 58,
      spreadPick: 'away',
      overUnderPick: 'under',
      summary: 'SF is favored but 6.5 points is steep. Dallas defense has been solid. Take the points with Cowboys in a defensive battle.'
    },
    stats: {
      homeTeam: {
        offenseRank: 8,
        defenseRank: 4,
        recentForm: 'W-W-L-W-W',
        injuries: ['RB - Probable'],
        avgPointsScored: 24.7,
        avgPointsAllowed: 18.1
      },
      awayTeam: {
        offenseRank: 14,
        defenseRank: 6,
        recentForm: 'L-W-W-L-L',
        injuries: ['QB - Probable', 'DE - Out'],
        avgPointsScored: 21.3,
        avgPointsAllowed: 19.8
      },
      weather: {
        condition: 'Partly Cloudy',
        temperature: 58,
        windSpeed: 12
      }
    }
  },
  {
    id: 'nfl-3',
    sport: 'NFL',
    homeTeam: {
      id: 'det',
      name: 'Detroit Lions',
      shortName: 'DET',
      logo: '🏈',
      color: '#0076B6',
      secondaryColor: '#B0B7BC'
    },
    awayTeam: {
      id: 'gb',
      name: 'Green Bay Packers',
      shortName: 'GB',
      logo: '🏈',
      color: '#203731',
      secondaryColor: '#FFB612'
    },
    date: '2025-11-10',
    time: '8:20 PM ET',
    spread: -3,
    overUnder: 48,
    homeMoneyline: -155,
    awayMoneyline: +130,
    aiConfidence: 'Low',
    aiPrediction: {
      winner: 'home',
      winProbability: 53,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'Classic NFC North rivalry. Both teams well-matched. Lions slight edge at home, but this could go either way.'
    },
    stats: {
      homeTeam: {
        offenseRank: 6,
        defenseRank: 15,
        recentForm: 'W-L-W-W-L',
        injuries: ['TE - Questionable'],
        avgPointsScored: 25.9,
        avgPointsAllowed: 22.4
      },
      awayTeam: {
        offenseRank: 9,
        defenseRank: 11,
        recentForm: 'L-W-W-L-W',
        injuries: ['CB - Out', 'WR - Questionable'],
        avgPointsScored: 24.1,
        avgPointsAllowed: 21.7
      },
      weather: {
        condition: 'Clear',
        temperature: 42,
        windSpeed: 5
      }
    }
  }
];

export const mockNCAAFGames: Game[] = [
  {
    id: 'ncaaf-1',
    sport: 'NCAAF',
    homeTeam: {
      id: 'uga',
      name: 'Georgia Bulldogs',
      shortName: 'UGA',
      logo: '🏈',
      color: '#BA0C2F',
      secondaryColor: '#000000'
    },
    awayTeam: {
      id: 'fla',
      name: 'Florida Gators',
      shortName: 'FLA',
      logo: '🏈',
      color: '#0021A5',
      secondaryColor: '#FA4616'
    },
    date: '2025-11-08',
    time: '3:30 PM ET',
    spread: -14,
    overUnder: 56.5,
    homeMoneyline: -450,
    awayMoneyline: +340,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'home',
      winProbability: 78,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'Georgia\'s defense is dominant, ranked #1 nationally. Florida struggling with injuries. Bulldogs should cover easily at home.'
    },
    stats: {
      homeTeam: {
        offenseRank: 12,
        defenseRank: 1,
        recentForm: 'W-W-W-W-L',
        injuries: [],
        avgPointsScored: 34.2,
        avgPointsAllowed: 12.8
      },
      awayTeam: {
        offenseRank: 28,
        defenseRank: 45,
        recentForm: 'L-L-W-L-L',
        injuries: ['QB - Questionable', 'RB - Out', 'OL - Out'],
        avgPointsScored: 22.4,
        avgPointsAllowed: 28.9
      },
      weather: {
        condition: 'Sunny',
        temperature: 72,
        windSpeed: 6
      }
    }
  },
  {
    id: 'ncaaf-2',
    sport: 'NCAAF',
    homeTeam: {
      id: 'osu',
      name: 'Ohio State Buckeyes',
      shortName: 'OSU',
      logo: '🏈',
      color: '#BB0000',
      secondaryColor: '#666666'
    },
    awayTeam: {
      id: 'psu',
      name: 'Penn State Nittany Lions',
      shortName: 'PSU',
      logo: '🏈',
      color: '#041E42',
      secondaryColor: '#FFFFFF'
    },
    date: '2025-11-08',
    time: '7:30 PM ET',
    spread: -7.5,
    overUnder: 52,
    homeMoneyline: -310,
    awayMoneyline: +250,
    aiConfidence: 'Medium',
    aiPrediction: {
      winner: 'home',
      winProbability: 64,
      spreadPick: 'away',
      overUnderPick: 'under',
      summary: 'Big Ten showdown. PSU defense travels well. OSU wins but Penn State keeps it close. Take the Nittany Lions with the points.'
    },
    stats: {
      homeTeam: {
        offenseRank: 4,
        defenseRank: 8,
        recentForm: 'W-W-W-W-W',
        injuries: ['LB - Probable'],
        avgPointsScored: 38.6,
        avgPointsAllowed: 16.2
      },
      awayTeam: {
        offenseRank: 18,
        defenseRank: 3,
        recentForm: 'W-W-L-W-W',
        injuries: ['WR - Questionable'],
        avgPointsScored: 29.3,
        avgPointsAllowed: 14.7
      },
      weather: {
        condition: 'Cloudy',
        temperature: 48,
        windSpeed: 10
      }
    }
  },
  {
    id: 'ncaaf-3',
    sport: 'NCAAF',
    homeTeam: {
      id: 'tex',
      name: 'Texas Longhorns',
      shortName: 'TEX',
      logo: '🏈',
      color: '#BF5700',
      secondaryColor: '#FFFFFF'
    },
    awayTeam: {
      id: 'okla',
      name: 'Oklahoma Sooners',
      shortName: 'OKLA',
      logo: '🏈',
      color: '#841617',
      secondaryColor: '#FFF'
    },
    date: '2025-11-09',
    time: '12:00 PM ET',
    spread: -10,
    overUnder: 61,
    homeMoneyline: -380,
    awayMoneyline: +300,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'home',
      winProbability: 72,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'Red River rivalry renewed. Texas offense is explosive. Oklahoma defense ranks near bottom. Expect fireworks and a Texas blowout.'
    },
    stats: {
      homeTeam: {
        offenseRank: 2,
        defenseRank: 14,
        recentForm: 'W-W-W-W-L',
        injuries: ['DL - Out'],
        avgPointsScored: 41.7,
        avgPointsAllowed: 20.1
      },
      awayTeam: {
        offenseRank: 22,
        defenseRank: 67,
        recentForm: 'L-L-W-L-W',
        injuries: ['QB - Probable', 'CB - Out', 'S - Questionable'],
        avgPointsScored: 26.8,
        avgPointsAllowed: 32.4
      },
      weather: {
        condition: 'Sunny',
        temperature: 78,
        windSpeed: 7
      }
    }
  }
];

export const mockHistoricalData: HistoricalRecord[] = [
  {
    date: '2025-10-28',
    sport: 'NFL',
    totalPredictions: 16,
    correctPredictions: 11,
    accuracy: 68.75,
    byBetType: {
      spread: { total: 16, correct: 10, accuracy: 62.5 },
      moneyline: { total: 16, correct: 11, accuracy: 68.75 },
      overUnder: { total: 16, correct: 9, accuracy: 56.25 }
    }
  },
  {
    date: '2025-10-28',
    sport: 'NCAAF',
    totalPredictions: 25,
    correctPredictions: 18,
    accuracy: 72,
    byBetType: {
      spread: { total: 25, correct: 17, accuracy: 68 },
      moneyline: { total: 25, correct: 19, accuracy: 76 },
      overUnder: { total: 25, correct: 16, accuracy: 64 }
    }
  },
  {
    date: '2025-10-21',
    sport: 'NFL',
    totalPredictions: 14,
    correctPredictions: 9,
    accuracy: 64.29,
    byBetType: {
      spread: { total: 14, correct: 8, accuracy: 57.14 },
      moneyline: { total: 14, correct: 9, accuracy: 64.29 },
      overUnder: { total: 14, correct: 8, accuracy: 57.14 }
    }
  }
];
