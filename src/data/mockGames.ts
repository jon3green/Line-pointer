import type { Game, HistoricalRecord } from '../types';

export const mockNFLGames: Game[] = [
  {
    id: 'nfl-1',
    sport: 'NFL',
    homeTeam: {
      id: 'ne',
      name: 'New England Patriots',
      shortName: 'NE',
      logo: '🏈',
      color: '#002244',
      secondaryColor: '#C60C30'
    },
    awayTeam: {
      id: 'nyj',
      name: 'New York Jets',
      shortName: 'NYJ',
      logo: '🏈',
      color: '#125740',
      secondaryColor: '#000000'
    },
    date: '2025-11-14',
    time: '8:15 PM ET',
    spread: -3,
    overUnder: 42.5,
    homeMoneyline: -155,
    awayMoneyline: +130,
    aiConfidence: 'Medium',
    aiPrediction: {
      winner: 'home',
      winProbability: 59,
      spreadPick: 'home',
      overUnderPick: 'under',
      summary: 'Thursday night divisional battle. Patriots defense at home gives them the edge. Expect a low-scoring defensive struggle with NE covering.'
    },
    stats: {
      homeTeam: {
        offenseRank: 18,
        defenseRank: 7,
        recentForm: 'W-L-L-W-L',
        injuries: ['WR - Questionable'],
        avgPointsScored: 20.4,
        avgPointsAllowed: 19.1
      },
      awayTeam: {
        offenseRank: 24,
        defenseRank: 12,
        recentForm: 'L-L-W-L-W',
        injuries: ['OL - Out', 'LB - Doubtful'],
        avgPointsScored: 18.7,
        avgPointsAllowed: 22.3
      },
      weather: {
        condition: 'Clear',
        temperature: 48,
        windSpeed: 10
      }
    }
  },
  {
    id: 'nfl-2',
    sport: 'NFL',
    homeTeam: {
      id: 'phi',
      name: 'Philadelphia Eagles',
      shortName: 'PHI',
      logo: '🏈',
      color: '#004C54',
      secondaryColor: '#A5ACAF'
    },
    awayTeam: {
      id: 'det',
      name: 'Detroit Lions',
      shortName: 'DET',
      logo: '🏈',
      color: '#0076B6',
      secondaryColor: '#B0B7BC'
    },
    date: '2025-11-17',
    time: '8:20 PM ET',
    spread: -2.5,
    overUnder: 52.5,
    homeMoneyline: -140,
    awayMoneyline: +120,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'away',
      winProbability: 56,
      spreadPick: 'away',
      overUnderPick: 'over',
      summary: 'Sunday Night Football showcase. Lions high-powered offense travels well. Eagles at home but Detroit\'s balance gives them the edge. Lions win outright.'
    },
    stats: {
      homeTeam: {
        offenseRank: 7,
        defenseRank: 9,
        recentForm: 'W-W-W-L-W',
        injuries: ['CB - Probable'],
        avgPointsScored: 26.8,
        avgPointsAllowed: 20.2
      },
      awayTeam: {
        offenseRank: 2,
        defenseRank: 11,
        recentForm: 'W-W-L-W-W',
        injuries: ['TE - Questionable'],
        avgPointsScored: 30.2,
        avgPointsAllowed: 22.8
      },
      weather: {
        condition: 'Clear',
        temperature: 52,
        windSpeed: 8
      }
    }
  },
  {
    id: 'nfl-3',
    sport: 'NFL',
    homeTeam: {
      id: 'mia',
      name: 'Miami Dolphins',
      shortName: 'MIA',
      logo: '🏈',
      color: '#008E97',
      secondaryColor: '#FC4C02'
    },
    awayTeam: {
      id: 'was',
      name: 'Washington Commanders',
      shortName: 'WAS',
      logo: '🏈',
      color: '#5A1414',
      secondaryColor: '#FFB612'
    },
    date: '2025-11-17',
    time: '9:30 AM ET',
    spread: -3.5,
    overUnder: 48.5,
    homeMoneyline: -170,
    awayMoneyline: +145,
    aiConfidence: 'Medium',
    aiPrediction: {
      winner: 'home',
      winProbability: 61,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'International game in Madrid. Dolphins offense clicking with Tua healthy. Washington struggles in unusual venues. Miami covers in European showcase.'
    },
    stats: {
      homeTeam: {
        offenseRank: 4,
        defenseRank: 16,
        recentForm: 'W-W-W-W-L',
        injuries: [],
        avgPointsScored: 28.6,
        avgPointsAllowed: 23.4
      },
      awayTeam: {
        offenseRank: 13,
        defenseRank: 14,
        recentForm: 'L-W-L-W-L',
        injuries: ['RB - Out', 'DE - Questionable'],
        avgPointsScored: 23.9,
        avgPointsAllowed: 24.1
      },
      weather: {
        condition: 'Sunny',
        temperature: 68,
        windSpeed: 6
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
      id: 'tex',
      name: 'Texas Longhorns',
      shortName: 'TEX',
      logo: '🏈',
      color: '#BF5700',
      secondaryColor: '#FFFFFF'
    },
    date: '2025-11-15',
    time: '7:30 PM ET',
    spread: -6.5,
    overUnder: 50.5,
    homeMoneyline: -260,
    awayMoneyline: +210,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'home',
      winProbability: 68,
      spreadPick: 'home',
      overUnderPick: 'under',
      summary: 'Massive SEC showdown in Athens. Georgia\'s defense at home is elite. Texas offense will struggle against the Bulldogs D. Georgia covers in defensive battle.'
    },
    stats: {
      homeTeam: {
        offenseRank: 8,
        defenseRank: 2,
        recentForm: 'W-W-W-W-L',
        injuries: ['LB - Questionable'],
        avgPointsScored: 32.8,
        avgPointsAllowed: 13.2
      },
      awayTeam: {
        offenseRank: 5,
        defenseRank: 12,
        recentForm: 'W-W-W-L-W',
        injuries: ['OL - Probable'],
        avgPointsScored: 35.6,
        avgPointsAllowed: 19.8
      },
      weather: {
        condition: 'Clear',
        temperature: 58,
        windSpeed: 8
      }
    }
  },
  {
    id: 'ncaaf-2',
    sport: 'NCAAF',
    homeTeam: {
      id: 'bama',
      name: 'Alabama Crimson Tide',
      shortName: 'ALA',
      logo: '🏈',
      color: '#9E1B32',
      secondaryColor: '#828A8F'
    },
    awayTeam: {
      id: 'okla',
      name: 'Oklahoma Sooners',
      shortName: 'OKLA',
      logo: '🏈',
      color: '#841617',
      secondaryColor: '#FFF'
    },
    date: '2025-11-15',
    time: '3:30 PM ET',
    spread: -13.5,
    overUnder: 54.5,
    homeMoneyline: -420,
    awayMoneyline: +320,
    aiConfidence: 'High',
    aiPrediction: {
      winner: 'home',
      winProbability: 75,
      spreadPick: 'home',
      overUnderPick: 'over',
      summary: 'Alabama dominant at home with playoff hopes on the line. Oklahoma struggling in first SEC season. Tide rolls big in Tuscaloosa.'
    },
    stats: {
      homeTeam: {
        offenseRank: 3,
        defenseRank: 6,
        recentForm: 'W-W-W-W-W',
        injuries: [],
        avgPointsScored: 38.2,
        avgPointsAllowed: 15.6
      },
      awayTeam: {
        offenseRank: 28,
        defenseRank: 42,
        recentForm: 'L-L-W-L-L',
        injuries: ['QB - Questionable', 'RB - Out'],
        avgPointsScored: 24.3,
        avgPointsAllowed: 30.8
      },
      weather: {
        condition: 'Partly Cloudy',
        temperature: 65,
        windSpeed: 10
      }
    }
  },
  {
    id: 'ncaaf-3',
    sport: 'NCAAF',
    homeTeam: {
      id: 'pitt',
      name: 'Pittsburgh Panthers',
      shortName: 'PITT',
      logo: '🏈',
      color: '#003594',
      secondaryColor: '#FFB81C'
    },
    awayTeam: {
      id: 'nd',
      name: 'Notre Dame Fighting Irish',
      shortName: 'ND',
      logo: '🏈',
      color: '#0C2340',
      secondaryColor: '#C99700'
    },
    date: '2025-11-15',
    time: '12:00 PM ET',
    spread: -7,
    overUnder: 48,
    homeMoneyline: -290,
    awayMoneyline: +235,
    aiConfidence: 'Medium',
    aiPrediction: {
      winner: 'away',
      winProbability: 58,
      spreadPick: 'away',
      overUnderPick: 'under',
      summary: 'College GameDay in Pittsburgh. Notre Dame\'s playoff push continues. Irish defense will frustrate Pitt offense. ND wins and covers on the road.'
    },
    stats: {
      homeTeam: {
        offenseRank: 18,
        defenseRank: 24,
        recentForm: 'W-L-W-W-L',
        injuries: ['WR - Out', 'DL - Questionable'],
        avgPointsScored: 28.4,
        avgPointsAllowed: 24.7
      },
      awayTeam: {
        offenseRank: 11,
        defenseRank: 4,
        recentForm: 'W-W-W-W-L',
        injuries: ['CB - Probable'],
        avgPointsScored: 33.6,
        avgPointsAllowed: 16.2
      },
      weather: {
        condition: 'Cloudy',
        temperature: 52,
        windSpeed: 12
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
