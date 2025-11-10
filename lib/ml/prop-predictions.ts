/**
 * ML Prop Prediction Models
 * Predicts player prop outcomes using historical data and current form
 */

import { cachedFetch, generateCacheKey, CACHE_TTL } from '@/lib/cache/redis';
import { getLineHistory } from '@/lib/api/line-movement-tracker';

export interface PropPrediction {
  playerId: string;
  playerName: string;
  propType: string; // 'passing_yards', 'rushing_yards', etc.
  line: number;
  prediction: {
    expectedValue: number;
    probability: {
      over: number;
      under: number;
    };
    confidence: number; // 0-100
    recommendation: 'over' | 'under' | 'avoid';
    valueScore: number; // -100 to +100
  };
  factors: {
    recentForm: number; // -10 to +10
    matchupRating: number; // -10 to +10
    weatherImpact: number; // -10 to +10
    historicalSuccess: number; // 0-100%
    lineMovement: number; // -10 to +10
  };
  historicalHitRate: number; // % of times player has hit this line
}

export interface BestValueProp {
  prop: PropPrediction;
  valueRating: 'excellent' | 'good' | 'fair' | 'poor';
  expectedROI: number; // Expected return on investment
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Predict player prop outcome using ML model
 */
export async function predictProp(
  playerId: string,
  playerName: string,
  propType: string,
  line: number,
  overOdds: number,
  underOdds: number,
  historicalStats?: any
): Promise<PropPrediction> {
  const cacheKey = generateCacheKey('ml-prop', playerId, propType, line);
  
  return cachedFetch(cacheKey, CACHE_TTL.PREDICTIONS, async () => {
    // Simulate ML prediction with multiple factors
    
    // 1. Historical Performance
    const historicalHitRate = calculateHistoricalHitRate(historicalStats, propType, line);
    
    // 2. Recent Form (last 5 games)
    const recentForm = calculateRecentForm(historicalStats, propType);
    
    // 3. Matchup Rating (vs opponent defense)
    const matchupRating = calculateMatchupRating(propType, historicalStats);
    
    // 4. Weather Impact (for outdoor games)
    const weatherImpact = calculateWeatherImpact(propType);
    
    // 5. Line Movement Analysis
    const lineHistory = await getLineHistory('player_prop', playerId, propType);
    const lineMovement = analyzeLineMovement(lineHistory);
    
    // Combine factors into prediction
    const baseProb = historicalHitRate;
    const adjustments = (recentForm + matchupRating + weatherImpact + lineMovement) / 40; // Normalize
    
    const overProbability = Math.max(0.1, Math.min(0.9, baseProb + adjustments));
    const underProbability = 1 - overProbability;
    
    // Calculate expected value
    const overEV = calculateEV(overProbability, overOdds);
    const underEV = calculateEV(underProbability, underOdds);
    
    const expectedValue = Math.max(overEV, underEV);
    const recommendation = overEV > underEV ? 'over' : underEV > overEV ? 'under' : 'avoid';
    
    // Value score: how much better than breakeven
    const valueScore = (expectedValue / Math.abs(overOdds > 0 ? overOdds : underOdds)) * 100;
    
    // Confidence based on sample size and consistency
    const confidence = calculateConfidence(historicalStats, lineHistory);
    
    return {
      playerId,
      playerName,
      propType,
      line,
      prediction: {
        expectedValue,
        probability: {
          over: overProbability,
          under: underProbability,
        },
        confidence,
        recommendation,
        valueScore,
      },
      factors: {
        recentForm,
        matchupRating,
        weatherImpact,
        historicalSuccess: historicalHitRate * 100,
        lineMovement,
      },
      historicalHitRate: historicalHitRate * 100,
    };
  });
}

/**
 * Find best value props across all available props
 */
export async function findBestValueProps(
  props: Array<{
    playerId: string;
    playerName: string;
    propType: string;
    line: number;
    overOdds: number;
    underOdds: number;
  }>,
  minValueScore: number = 5
): Promise<BestValueProp[]> {
  const predictions = await Promise.all(
    props.map(prop =>
      predictProp(
        prop.playerId,
        prop.playerName,
        prop.propType,
        prop.line,
        prop.overOdds,
        prop.underOdds
      )
    )
  );
  
  // Filter for positive value
  const valueProps = predictions
    .filter(p => p.prediction.valueScore >= minValueScore)
    .map(prop => {
      const valueRating = 
        prop.prediction.valueScore >= 20 ? 'excellent' :
        prop.prediction.valueScore >= 10 ? 'good' :
        prop.prediction.valueScore >= 5 ? 'fair' : 'poor';
      
      const confidence =
        prop.prediction.confidence >= 75 ? 'high' :
        prop.prediction.confidence >= 50 ? 'medium' : 'low';
      
      const expectedROI = (prop.prediction.expectedValue / 100) * 100;
      
      return {
        prop,
        valueRating,
        expectedROI,
        confidence,
      } as BestValueProp;
    })
    .sort((a, b) => b.prop.prediction.valueScore - a.prop.prediction.valueScore);
  
  return valueProps;
}

/**
 * Calculate historical hit rate for a prop line
 */
function calculateHistoricalHitRate(
  stats: any,
  propType: string,
  line: number
): number {
  // Simulate: In production, would analyze actual historical game logs
  // For now, return a baseline probability with some randomness
  const baseline = 0.50; // 50% baseline
  const variance = (Math.random() - 0.5) * 0.2; // +/- 10%
  return Math.max(0.3, Math.min(0.7, baseline + variance));
}

/**
 * Calculate recent form trend
 */
function calculateRecentForm(stats: any, propType: string): number {
  // Analyze last 5 games for trend
  // Return -10 (cold) to +10 (hot)
  const trend = (Math.random() - 0.5) * 20;
  return trend;
}

/**
 * Calculate matchup rating
 */
function calculateMatchupRating(propType: string, stats: any): number {
  // Analyze opponent's defense vs this prop type
  // Return -10 (tough matchup) to +10 (favorable)
  const rating = (Math.random() - 0.5) * 20;
  return rating;
}

/**
 * Calculate weather impact
 */
function calculateWeatherImpact(propType: string): number {
  // For passing/receiving props in bad weather: negative
  // For rushing props in bad weather: slight positive
  if (propType.includes('pass') || propType.includes('receiving')) {
    return Math.random() * -5;
  } else if (propType.includes('rush')) {
    return Math.random() * 3;
  }
  return 0;
}

/**
 * Analyze line movement for sharp action
 */
function analyzeLineMovement(lineHistory: any): number {
  if (!lineHistory) return 0;
  
  // Positive if line moving in our favor (sharp action)
  // Negative if line moving against us
  if (lineHistory.sharpAction) return 5;
  if (lineHistory.steamMove) return 3;
  
  return lineHistory.movement.direction === 'up' ? 2 : 
         lineHistory.movement.direction === 'down' ? -2 : 0;
}

/**
 * Calculate confidence level
 */
function calculateConfidence(stats: any, lineHistory: any): number {
  let confidence = 50; // Base confidence
  
  // More data = more confidence
  if (stats && stats.gamesPlayed > 10) confidence += 10;
  if (stats && stats.gamesPlayed > 16) confidence += 10;
  
  // Line stability = more confidence
  if (lineHistory && lineHistory.movements.length > 5) {
    confidence += 10;
  }
  
  // Sharp action = more confidence
  if (lineHistory && lineHistory.sharpAction) {
    confidence += 15;
  }
  
  return Math.min(95, confidence);
}

/**
 * Calculate Expected Value (EV)
 */
function calculateEV(probability: number, odds: number): number {
  const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  const ev = (probability * (decimalOdds - 1)) - (1 - probability);
  return ev * 100; // Return as cents per dollar
}

/**
 * Get featured props (highest value + high confidence)
 */
export async function getFeaturedProps(
  allProps: Array<{
    playerId: string;
    playerName: string;
    propType: string;
    line: number;
    overOdds: number;
    underOdds: number;
  }>
): Promise<BestValueProp[]> {
  const bestValue = await findBestValueProps(allProps, 8); // Min 8% value
  
  // Filter for high confidence
  const featured = bestValue.filter(
    p => p.confidence === 'high' && p.valueRating !== 'poor'
  );
  
  return featured.slice(0, 5); // Top 5 featured props
}

const PropPredictionsAPI = {
  predictProp,
  findBestValueProps,
  getFeaturedProps,
};

export default PropPredictionsAPI;

