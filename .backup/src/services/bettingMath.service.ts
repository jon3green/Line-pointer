/**
 * Professional Betting Mathematics Service
 *
 * Implements industry-standard betting calculations:
 * - Kelly Criterion (optimal bet sizing)
 * - Expected Value (EV) calculation
 * - Closing Line Value (CLV) tracking
 * - Vig-free (no-vig) odds
 * - Poisson distribution for score predictions
 * - Sharp money detection
 * - Best line finder across bookmakers
 */

// ============================================================================
// ODDS CONVERSION UTILITIES
// ============================================================================

export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
};

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
};

export function americanToImpliedProb(american: number): number {
  if (american > 0) {
    return 100 / (american + 100);
  } else {
    return Math.abs(american) / (Math.abs(american) + 100);
  }
};

export function decimalToImpliedProb(decimal: number): number {
  return 1 / decimal;
};

// ============================================================================
// VIG REMOVAL (NO-VIG ODDS)
// ============================================================================

interface VigFreeOdds {
  team1: {
    fairProb: number;
    fairDecimalOdds: number;
    fairAmericanOdds: number;
  };
  team2: {
    fairProb: number;
    fairDecimalOdds: number;
    fairAmericanOdds: number;
  };
  vig: number;
  vigPercentage: number;
};

/**
 * Calculate vig-free (true/fair) odds by removing the bookmaker's margin
 * This is essential for accurate EV and Kelly Criterion calculations
 */
export function calculateVigFreeOdds(
  team1American: number,
  team2American: number
): VigFreeOdds {
  // Convert to implied probabilities
  const prob1 = americanToImpliedProb(team1American);
  const prob2 = americanToImpliedProb(team2American);

  // Total implied probability (should be > 1 due to vig)
  const totalProb = prob1 + prob2;

  // Vig amount and percentage
  const vig = totalProb - 1;
  const vigPercentage = (vig / totalProb) * 100;

  // Fair probabilities (removing vig proportionally)
  const fairProb1 = prob1 / totalProb;
  const fairProb2 = prob2 / totalProb;

  // Convert fair probabilities back to odds
  const fairDecimal1 = 1 / fairProb1;
  const fairDecimal2 = 1 / fairProb2;

  return {
    team1: {
      fairProb: fairProb1,
      fairDecimalOdds: fairDecimal1,
      fairAmericanOdds: decimalToAmerican(fairDecimal1)
    },
    team2: {
      fairProb: fairProb2,
      fairDecimalOdds: fairDecimal2,
      fairAmericanOdds: decimalToAmerican(fairDecimal2)
    },
    vig,
    vigPercentage
  };
};

// ============================================================================
// EXPECTED VALUE (EV) CALCULATOR
// ============================================================================

export type EVCalculation = {
  expectedValue: number;
  expectedValuePercentage: number;
  roi: number;
  breakEvenWinRate: number;
  fairWinProb: number;
  isProfitable: boolean;
  profitIfWin: number;
  lossIfLose: number;
};

/**
 * Calculate Expected Value - THE MOST IMPORTANT METRIC
 * Professional bettors ONLY bet when EV > 0 (ideally EV > 2-5%)
 *
 * EV = (Fair Win Probability × Profit if Win) - (Fair Loss Probability × Stake)
 */
export function calculateEV(
  betOddsAmerican: number,
  fairWinProbability: number,
  stake: number = 100
): EVCalculation {
  const decimalOdds = americanToDecimal(betOddsAmerican);
  const profitIfWin = (decimalOdds - 1) * stake;
  const lossIfLose = stake;

  const fairLossProb = 1 - fairWinProbability;

  // Expected Value formula
  const expectedValue = (fairWinProbability * profitIfWin) - (fairLossProb * lossIfLose);
  const expectedValuePercentage = (expectedValue / stake) * 100;
  const roi = expectedValuePercentage;

  // Break-even win rate needed for this bet
  const breakEvenWinRate = americanToImpliedProb(betOddsAmerican);

  return {
    expectedValue,
    expectedValuePercentage,
    roi,
    breakEvenWinRate,
    fairWinProb: fairWinProbability,
    isProfitable: expectedValue > 0,
    profitIfWin,
    lossIfLose
  };
};

// ============================================================================
// KELLY CRITERION (OPTIMAL BET SIZING)
// ============================================================================

export type KellyResult = {
  fullKelly: number;
  fullKellyPercentage: number;
  halfKelly: number;
  halfKellyPercentage: number;
  quarterKelly: number;
  quarterKellyPercentage: number;
  recommendedBet: number;
  recommendedPercentage: number;
  edge: number;
  edgePercentage: number;
  warning?: string;
};

/**
 * Kelly Criterion - OPTIMAL BET SIZING FORMULA
 * Formula: f = (bp - q) / b
 * where:
 *   f = fraction of bankroll to bet
 *   b = decimal odds - 1
 *   p = probability of winning (fair/true probability)
 *   q = probability of losing (1 - p)
 *
 * IMPORTANT: Most pros use fractional Kelly (25-50%) to reduce variance
 */
export function calculateKelly(
  betOddsAmerican: number,
  fairWinProbability: number,
  bankroll: number,
  fractionToUse: number = 0.25 // Default to quarter-Kelly (safest)
): KellyResult {
  const decimalOdds = americanToDecimal(betOddsAmerican);
  const b = decimalOdds - 1;
  const p = fairWinProbability;
  const q = 1 - p;

  // Calculate edge (how much better is the true prob vs implied prob)
  const impliedProb = americanToImpliedProb(betOddsAmerican);
  const edge = p - impliedProb;
  const edgePercentage = (edge * 100);

  // Full Kelly formula
  const fullKellyFraction = (b * p - q) / b;
  const fullKellyPercentage = fullKellyFraction * 100;
  const fullKelly = Math.max(0, fullKellyFraction * bankroll);

  // Fractional Kelly (recommended for real-world betting)
  const halfKelly = fullKelly * 0.5;
  const halfKellyPercentage = fullKellyPercentage * 0.5;
  const quarterKelly = fullKelly * 0.25;
  const quarterKellyPercentage = fullKellyPercentage * 0.25;

  // Recommended bet using specified fraction
  const recommendedBet = fullKelly * fractionToUse;
  const recommendedPercentage = fullKellyPercentage * fractionToUse;

  // Warnings
  let warning: string | undefined;
  if (fullKellyPercentage > 10) {
    warning = 'Very large bet size suggested. Consider using fractional Kelly (25-50%) to reduce risk.';
  }
  if (edge <= 0) {
    warning = 'No edge detected. Do not bet - negative expected value.';
  }
  if (edge < 0.02) {
    warning = 'Edge is small (<2%). Consider passing on this bet.';
  }

  return {
    fullKelly,
    fullKellyPercentage,
    halfKelly,
    halfKellyPercentage,
    quarterKelly,
    quarterKellyPercentage,
    recommendedBet: Math.max(0, recommendedBet),
    recommendedPercentage: Math.max(0, recommendedPercentage),
    edge,
    edgePercentage,
    warning
  };
};

// ============================================================================
// CLOSING LINE VALUE (CLV) - MEASURE OF BETTING SKILL
// ============================================================================

export type CLVResult = {
  clv: number;
  clvPercentage: number;
  beatClosingLine: boolean;
  estimatedEV: number;
  analysis: string;
};

/**
 * Closing Line Value (CLV) - THE BEST PREDICTOR OF LONG-TERM SUCCESS
 *
 * CLV measures if you got better odds than the closing line.
 * Consistently beating the closing line = long-term profitability
 *
 * Positive CLV = You bet at better odds than close
 * Negative CLV = You bet at worse odds than close
 */
export function calculateCLV(
  yourBetOddsAmerican: number,
  closingOddsAmerican: number,
  betAmount: number
): CLVResult {
  const yourDecimal = americanToDecimal(yourBetOddsAmerican);
  const closingDecimal = americanToDecimal(closingOddsAmerican);

  const yourPayout = yourDecimal * betAmount;
  const closingPayout = closingDecimal * betAmount;

  const clv = yourPayout - closingPayout;
  const clvPercentage = ((yourPayout - closingPayout) / closingPayout) * 100;

  const beatClosingLine = clv > 0;

  // Estimate EV based on CLV (rough approximation)
  const estimatedEV = clvPercentage * betAmount / 100;

  let analysis: string;
  if (clvPercentage > 5) {
    analysis = 'Excellent! You beat the closing line significantly. This indicates sharp betting.';
  } else if (clvPercentage > 2) {
    analysis = 'Good CLV. You got better odds than the close, indicating solid betting.';
  } else if (clvPercentage > 0) {
    analysis = 'Positive CLV. You beat the closing line slightly.';
  } else if (clvPercentage > -2) {
    analysis = 'Small negative CLV. Close to closing line.';
  } else {
    analysis = 'Negative CLV. You bet at worse odds than the close. Try to improve timing.';
  }

  return {
    clv,
    clvPercentage,
    beatClosingLine,
    estimatedEV,
    analysis
  };
};

// ============================================================================
// POISSON DISTRIBUTION - SCORE PREDICTION
// ============================================================================

/**
 * Poisson probability mass function
 * P(X = k) = (λ^k * e^-λ) / k!
 */
function poissonPMF(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

export type PoissonPrediction = {
  homeExpectedScore: number;
  awayExpectedScore: number;
  homeWinProb: number;
  awayWinProb: number;
  tieProb: number;
  mostLikelyScore: {
    home: number;
    away: number;
    probability: number;
  };
  over: {
    line: number;
    probability: number;
  };
  under: {
    line: number;
    probability: number;
  };
  scoreProbabilities: { score: string; probability: number }[];
};

/**
 * Poisson Distribution for Score Prediction
 * Models the number of points/goals each team will score
 * Based on average scoring rates
 */
export function poissonScorePrediction(
  homeAvgScore: number,
  awayAvgScore: number,
  totalLine: number = 45
): PoissonPrediction {
  const maxScore = 70; // Maximum reasonable NFL score

  let homeWinProb = 0;
  let awayWinProb = 0;
  let tieProb = 0;
  let mostLikelyProb = 0;
  let mostLikelyHome = 0;
  let mostLikelyAway = 0;

  const scoreProbabilities: { score: string; probability: number }[] = [];

  // Calculate all possible score combinations
  for (let homeScore = 0; homeScore <= maxScore; homeScore++) {
    const homeProb = poissonPMF(homeScore, homeAvgScore);

    for (let awayScore = 0; awayScore <= maxScore; awayScore++) {
      const awayProb = poissonPMF(awayScore, awayAvgScore);
      const combinedProb = homeProb * awayProb;

      // Track most likely score
      if (combinedProb > mostLikelyProb) {
        mostLikelyProb = combinedProb;
        mostLikelyHome = homeScore;
        mostLikelyAway = awayScore;
      }

      // Store top probabilities
      if (homeScore <= 50 && awayScore <= 50) {
        scoreProbabilities.push({
          score: `${homeScore}-${awayScore}`,
          probability: combinedProb * 100
        });
      }

      // Calculate win probabilities
      if (homeScore > awayScore) {
        homeWinProb += combinedProb;
      } else if (awayScore > homeScore) {
        awayWinProb += combinedProb;
      } else {
        tieProb += combinedProb;
      }
    }
  }

  // Calculate over/under probabilities
  let overProb = 0;
  let underProb = 0;

  for (let homeScore = 0; homeScore <= maxScore; homeScore++) {
    for (let awayScore = 0; awayScore <= maxScore; awayScore++) {
      const total = homeScore + awayScore;
      const prob = poissonPMF(homeScore, homeAvgScore) * poissonPMF(awayScore, awayAvgScore);

      if (total > totalLine) {
        overProb += prob;
      } else if (total < totalLine) {
        underProb += prob;
      }
    }
  }

  // Sort score probabilities
  scoreProbabilities.sort((a, b) => b.probability - a.probability);

  return {
    homeExpectedScore: homeAvgScore,
    awayExpectedScore: awayAvgScore,
    homeWinProb: homeWinProb * 100,
    awayWinProb: awayWinProb * 100,
    tieProb: tieProb * 100,
    mostLikelyScore: {
      home: mostLikelyHome,
      away: mostLikelyAway,
      probability: mostLikelyProb * 100
    },
    over: {
      line: totalLine,
      probability: overProb * 100
    },
    under: {
      line: totalLine,
      probability: underProb * 100
    },
    scoreProbabilities: scoreProbabilities.slice(0, 10) // Top 10 most likely scores
  };
};

// ============================================================================
// SHARP MONEY DETECTION
// ============================================================================

export type SharpMoneyIndicators = {
  isSharpMoney: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  indicators: string[];
  reverseLineMovement: boolean;
  steamMove: boolean;
  recommendation: string;
};

/**
 * Detect Sharp Money (Professional Bettors) vs Public Money
 *
 * Sharp indicators:
 * - Reverse line movement (line moves against public betting %)
 * - Steam moves (sudden sharp line movement)
 * - Line movement toward lower vig side
 * - Early line movement before public bets
 */
export function detectSharpMoney(
  openingLine: number,
  currentLine: number,
  publicBettingPercentage: number, // % of bets on favorite
  timeToGame: number // hours until game
): SharpMoneyIndicators {
  const indicators: string[] = [];
  let isSharpMoney = false;
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';

  // Calculate line movement
  const lineMovement = currentLine - openingLine;
  const lineMovementMagnitude = Math.abs(lineMovement);

  // Reverse line movement detection
  let reverseLineMovement = false;
  if (publicBettingPercentage > 65 && lineMovement > 0) {
    // Public on favorite, but line moving toward underdog
    reverseLineMovement = true;
    indicators.push('🔥 Reverse Line Movement: Public on favorite but line moving away');
    isSharpMoney = true;
  } else if (publicBettingPercentage < 35 && lineMovement < 0) {
    reverseLineMovement = true;
    indicators.push('🔥 Reverse Line Movement: Public on underdog but line moving away');
    isSharpMoney = true;
  }

  // Steam move detection (sharp sudden movement)
  let steamMove = false;
  if (lineMovementMagnitude >= 2 && timeToGame > 24) {
    // Large early move = likely sharp
    steamMove = true;
    indicators.push(`⚡ Steam Move: Line moved ${lineMovementMagnitude} points early`);
    isSharpMoney = true;
  }

  // Large line movement
  if (lineMovementMagnitude >= 3) {
    indicators.push(`📊 Significant Line Movement: ${lineMovementMagnitude} points`);
    isSharpMoney = true;
  }

  // Early sharp money
  if (timeToGame > 48 && lineMovementMagnitude >= 1) {
    indicators.push('⏰ Early Line Movement: Sharps betting early');
    isSharpMoney = true;
  }

  // Determine confidence
  const indicatorCount = indicators.length;
  if (indicatorCount >= 3 || (reverseLineMovement && steamMove)) {
    confidence = 'high';
  } else if (indicatorCount >= 2) {
    confidence = 'medium';
  } else if (indicatorCount >= 1) {
    confidence = 'low';
  }

  // Recommendation
  let recommendation: string;
  if (confidence === 'high') {
    recommendation = 'Strong sharp money indicators. Consider following the sharp side.';
  } else if (confidence === 'medium') {
    recommendation = 'Moderate sharp money indicators. Do additional research.';
  } else if (confidence === 'low') {
    recommendation = 'Some sharp indicators present. Monitor line movement.';
  } else {
    recommendation = 'No clear sharp money indicators detected.';
  }

  return {
    isSharpMoney,
    confidence,
    indicators,
    reverseLineMovement,
    steamMove,
    recommendation
  };
};

// ============================================================================
// BEST LINE FINDER
// ============================================================================

export type BookmakerLine = {
  bookmaker: string;
  spread: number;
  spreadOdds: number;
  total: number;
  overOdds: number;
  underOdds: number;
  moneylineHome: number;
  moneylineAway: number;
};

export type BestLines = {
  bestSpreadHome: { bookmaker: string; line: number; odds: number };
  bestSpreadAway: { bookmaker: string; line: number; odds: number };
  bestMoneylineHome: { bookmaker: string; odds: number };
  bestMoneylineAway: { bookmaker: string; odds: number };
  bestOver: { bookmaker: string; line: number; odds: number };
  bestUnder: { bookmaker: string; line: number; odds: number };
  lowestVigSpread: { bookmaker: string; vig: number };
  lowestVigTotal: { bookmaker: string; vig: number };
};

/**
 * Find the best available lines across all bookmakers
 * CRITICAL for maximizing EV - even small differences compound over time
 */
export function findBestLines(bookmakers: BookmakerLine[]): BestLines {
  let bestSpreadHome = bookmakers[0];
  let bestSpreadAway = bookmakers[0];
  let bestMoneylineHome = bookmakers[0];
  let bestMoneylineAway = bookmakers[0];
  let bestOver = bookmakers[0];
  let bestUnder = bookmakers[0];
  let lowestVigSpread = bookmakers[0];
  let lowestVigTotal = bookmakers[0];

  let minSpreadVig = 999;
  let minTotalVig = 999;

  for (const book of bookmakers) {
    // Best spread for home
    if (book.spreadOdds > bestSpreadHome.spreadOdds) {
      bestSpreadHome = book;
    }

    // Best spread for away (inverse line)
    if (book.spreadOdds > bestSpreadAway.spreadOdds) {
      bestSpreadAway = book;
    }

    // Best moneyline
    if (book.moneylineHome > bestMoneylineHome.moneylineHome) {
      bestMoneylineHome = book;
    }
    if (book.moneylineAway > bestMoneylineAway.moneylineAway) {
      bestMoneylineAway = book;
    }

    // Best totals
    if (book.overOdds > bestOver.overOdds) {
      bestOver = book;
    }
    if (book.underOdds > bestUnder.underOdds) {
      bestUnder = book;
    }

    // Lowest vig
    const spreadVig = calculateVigFreeOdds(book.spreadOdds, book.spreadOdds).vigPercentage;
    if (spreadVig < minSpreadVig) {
      minSpreadVig = spreadVig;
      lowestVigSpread = book;
    }

    const totalVig = calculateVigFreeOdds(book.overOdds, book.underOdds).vigPercentage;
    if (totalVig < minTotalVig) {
      minTotalVig = totalVig;
      lowestVigTotal = book;
    }
  }

  return {
    bestSpreadHome: {
      bookmaker: bestSpreadHome.bookmaker,
      line: bestSpreadHome.spread,
      odds: bestSpreadHome.spreadOdds
    },
    bestSpreadAway: {
      bookmaker: bestSpreadAway.bookmaker,
      line: -bestSpreadAway.spread,
      odds: bestSpreadAway.spreadOdds
    },
    bestMoneylineHome: {
      bookmaker: bestMoneylineHome.bookmaker,
      odds: bestMoneylineHome.moneylineHome
    },
    bestMoneylineAway: {
      bookmaker: bestMoneylineAway.bookmaker,
      odds: bestMoneylineAway.moneylineAway
    },
    bestOver: {
      bookmaker: bestOver.bookmaker,
      line: bestOver.total,
      odds: bestOver.overOdds
    },
    bestUnder: {
      bookmaker: bestUnder.bookmaker,
      line: bestUnder.total,
      odds: bestUnder.underOdds
    },
    lowestVigSpread: {
      bookmaker: lowestVigSpread.bookmaker,
      vig: minSpreadVig
    },
    lowestVigTotal: {
      bookmaker: lowestVigTotal.bookmaker,
      vig: minTotalVig
    }
  };
};

export const bettingMathService = {
  // Odds conversion
  americanToDecimal,
  decimalToAmerican,
  americanToImpliedProb,
  decimalToImpliedProb,

  // Core calculations
  calculateVigFreeOdds,
  calculateEV,
  calculateKelly,
  calculateCLV,
  poissonScorePrediction,
  detectSharpMoney,
  findBestLines
};;
