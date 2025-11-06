/**
 * Pro Edge Dashboard
 * Professional betting tools: CLV, Edge Scores, Sharp Analysis, Props
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clvService, CLVStats, CLVAlert, ClosingLinePrediction } from '../services/clv.service';
import { edgeService, EdgeScore, SharpBookComparison, StatisticalModel, InjuryImpact, RiskManagement } from '../services/edge.service';
import { propModelService, PropModel } from '../services/propModel.service';
import { sharpMoneyService, SharpMoneyData, SharpMoneyStats } from '../services/sharpMoney.service';
import { regressionModelService } from '../services/regressionModel.service';
import type { RegressionPrediction, ModelPerformance } from '../services/regressionModel.service';
import { weatherImpactService } from '../services/weatherImpact.service';
import type { WeatherImpactData, StadiumData } from '../services/weatherImpact.service';
import { strategyService } from '../services/strategy.service';
import type { DailyStrategy } from '../services/strategy.service';
import { injuryImpactService } from '../services/injuryImpact.service';
import type { TeamInjuryReport } from '../services/injuryImpact.service';
import { correlationService } from '../services/correlation.service';
import type { ParlayCorrelationReport, ParlayLeg } from '../services/correlation.service';

export function ProEdgePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clv' | 'edge' | 'books' | 'props' | 'risk' | 'sharp' | 'model' | 'weather' | 'strategy'>('strategy');
  const [clvStats, setClvStats] = useState<CLVStats | null>(null);
  const [clvAlerts, setClvAlerts] = useState<CLVAlert[]>([]);
  const [edgeScores, setEdgeScores] = useState<EdgeScore[]>([]);
  const [bookComparison, setBookComparison] = useState<SharpBookComparison | null>(null);
  const [topProps, setTopProps] = useState<PropModel[]>([]);
  const [riskManagement, setRiskManagement] = useState<RiskManagement | null>(null);

  // New services state
  const [sharpMoneyData, setSharpMoneyData] = useState<SharpMoneyData | null>(null);
  const [sharpStats, setSharpStats] = useState<SharpMoneyStats | null>(null);
  const [regressionPredictions, setRegressionPredictions] = useState<RegressionPrediction[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [weatherImpacts, setWeatherImpacts] = useState<WeatherImpactData[]>([]);
  const [stadiums, setStadiums] = useState<StadiumData[]>([]);

  // Strategy services state
  const [dailyStrategy, setDailyStrategy] = useState<DailyStrategy | null>(null);
  const [injuryReports, setInjuryReports] = useState<TeamInjuryReport[]>([]);
  const [parlayCorrelation, setParlayCorrelation] = useState<ParlayCorrelationReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load CLV data
    setClvStats(clvService.getCLVStats());
    setClvAlerts(clvService.getCLVAlerts());

    // Generate edge scores for demo games
    const mockEdgeScores = [
      edgeService.calculateEdgeScore('game1', -3.0, -2.5, -4.5, 75, 45, -5.0, { restAdvantage: 2, backToBackOpponent: true }),
      edgeService.calculateEdgeScore('game2', -7.5, -7.0, -8.0, 55, 65, -6.5, { divisionalRevenge: true }),
      edgeService.calculateEdgeScore('game3', -2.5, -3.0, -2.0, 40, 70, -4.0, { popularTeam: true })
    ];
    setEdgeScores(mockEdgeScores);

    // Load book comparison
    setBookComparison(edgeService.compareSharpBooks('game1'));

    // Load prop models
    setTopProps(propModelService.getTopPropPicks(1.5, 0.70));

    // Calculate risk management
    setRiskManagement(edgeService.calculateRiskManagement(10000, 1500, 3.5, 0.75));

    // Load sharp money data
    const sharpData = await sharpMoneyService.getSharpMoneyData('game1', 'NFL');
    setSharpMoneyData(sharpData);
    setSharpStats(sharpMoneyService.getSharpMoneyStats());

    // Generate regression predictions
    const predictions = [
      regressionModelService.generatePrediction('game1', 'NFL', 'Chiefs', 'Bills', -2.5, {}),
      regressionModelService.generatePrediction('game2', 'NFL', '49ers', 'Cowboys', -7.5, {}),
      regressionModelService.generatePrediction('game3', 'NCAAF', 'Georgia', 'Florida', -14.5, {})
    ];
    setRegressionPredictions(predictions);
    setModelPerformance(regressionModelService.getModelPerformance());

    // Generate weather impacts
    const weatherData = [
      weatherImpactService.calculateImpact('game1', 'Arrowhead Stadium', 32, 18, 'none'),
      weatherImpactService.calculateImpact('game2', 'Lambeau Field', 15, 12, 'snow'),
      weatherImpactService.calculateImpact('game3', 'Mercedes-Benz Superdome', 72, 0, 'none')
    ];
    setWeatherImpacts(weatherData);
    setStadiums(weatherImpactService.getAllStadiums());

    // Load strategy data
    const strategy = strategyService.findOpportunities();
    setDailyStrategy(strategy);

    // Load injury reports
    const injuries = [
      injuryImpactService.getTeamInjuryReport('Chiefs', 'Chiefs vs Bills'),
      injuryImpactService.getTeamInjuryReport('49ers', '49ers vs Cowboys')
    ];
    setInjuryReports(injuries);

    // Mock parlay for correlation analysis
    const mockParlay: ParlayLeg[] = [
      { gameId: 'game1', matchup: 'Chiefs vs Bills', betType: 'spread', selection: 'Chiefs -7', team: 'Chiefs', probability: 0.52 },
      { gameId: 'game1', matchup: 'Chiefs vs Bills', betType: 'total', selection: 'UNDER 50', probability: 0.51 }
    ];
    const correlationReport = correlationService.analyzeParlayCorrelations(mockParlay);
    setParlayCorrelation(correlationReport);
  };

  const getEdgeColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 50) return 'text-gray-400';
    return 'text-red-500';
  };

  const getRecommendationBadge = (rec: string) => {
    const badges = {
      'STRONG_BET': 'bg-green-600 text-white',
      'LEAN': 'bg-yellow-600 text-white',
      'PASS': 'bg-gray-600 text-white',
      'AVOID': 'bg-red-600 text-white'
    };
    return badges[rec as keyof typeof badges] || 'bg-gray-600 text-white';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">💎 Pro Edge Dashboard</h1>
            <p className="text-gray-300">Professional betting analytics for serious bettors</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'strategy'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🎯 Winning Strategy
        </button>
        <button
          onClick={() => setActiveTab('clv')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'clv'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          📊 CLV Tracking
        </button>
        <button
          onClick={() => setActiveTab('edge')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'edge'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🎯 Edge Scores
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'books'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          📚 Book Shopping
        </button>
        <button
          onClick={() => setActiveTab('props')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'props'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🏀 Player Props
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'risk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          ⚖️ Risk Management
        </button>
        <button
          onClick={() => setActiveTab('sharp')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'sharp'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          💎 Sharp Money
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'model'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🧠 Regression Model
        </button>
        <button
          onClick={() => setActiveTab('weather')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'weather'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🌤️ Weather Impact
        </button>
      </div>

      {/* Winning Strategy Tab */}
      {activeTab === 'strategy' && dailyStrategy && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Today's Winning Opportunities</h2>

          {/* Strategy Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Total Opportunities</div>
              <div className="text-3xl font-bold text-white">{dailyStrategy.summary.totalOpportunities}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-green-800">
              <div className="text-gray-400 text-sm mb-1">Strong Bets</div>
              <div className="text-3xl font-bold text-green-500">{dailyStrategy.summary.strongBets}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-yellow-800">
              <div className="text-gray-400 text-sm mb-1">Leans</div>
              <div className="text-3xl font-bold text-yellow-500">{dailyStrategy.summary.leans}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Avg Edge Score</div>
              <div className="text-3xl font-bold text-blue-500">{dailyStrategy.summary.avgEdgeScore.toFixed(0)}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Potential Exposure</div>
              <div className="text-3xl font-bold text-purple-500">${dailyStrategy.summary.potentialExposure.toFixed(0)}</div>
            </div>
          </div>

          {/* Opportunities */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">High-CLV Spots</h3>
            {dailyStrategy.opportunities.length === 0 && (
              <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
                <div className="text-6xl mb-4">🔍</div>
                <div className="text-white font-semibold mb-2">No opportunities found today</div>
                <div className="text-gray-400">Filters are very strict - only showing highest-value bets</div>
              </div>
            )}

            {dailyStrategy.opportunities.map((opp, idx) => (
              <div key={idx} className={`rounded-lg p-6 border ${
                opp.edgeScore.recommendation === 'STRONG BET' ? 'bg-green-900/20 border-green-600' :
                opp.edgeScore.recommendation === 'LEAN' ? 'bg-yellow-900/20 border-yellow-600' :
                'bg-gray-900 border-gray-800'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">{opp.matchup}</h4>
                    <div className="text-gray-300">{opp.sport} • {opp.side === 'home' ? 'HOME' : 'AWAY'} • {opp.currentLine > 0 ? '+' : ''}{opp.currentLine}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-2 rounded font-semibold mb-2 ${
                      opp.edgeScore.recommendation === 'STRONG BET' ? 'bg-green-600' :
                      opp.edgeScore.recommendation === 'LEAN' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    } text-white`}>
                      {opp.edgeScore.recommendation}
                    </div>
                    <div className="text-2xl font-bold text-white">{opp.edgeScore.overall}/100</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-sm">Expected CLV</div>
                    <div className="text-green-500 font-bold text-lg">+{opp.expectedCLV.toFixed(1)} pts</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Sharp Consensus</div>
                    <div className="text-white font-semibold">{opp.sharpConsensusPercent}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Public Betting</div>
                    <div className="text-gray-300">{opp.publicBettingPercent}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">RLM</div>
                    <div className={`font-semibold ${opp.isRLM ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {opp.isRLM ? '✓ YES' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Line Movement */}
                <div className="bg-gray-800 p-3 rounded mb-4">
                  <div className="text-sm text-gray-400">Line Movement</div>
                  <div className="text-white">
                    Opening: {opp.openingLine > 0 ? '+' : ''}{opp.openingLine} → Current: {opp.currentLine > 0 ? '+' : ''}{opp.currentLine}
                    <span className={`ml-2 ${opp.lineMovement > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ({opp.lineMovement > 0 ? '+' : ''}{opp.lineMovement.toFixed(1)})
                    </span>
                  </div>
                </div>

                {/* Stake Recommendation */}
                <div className="bg-blue-900/20 border border-blue-600 rounded p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-semibold">Recommended Stake</div>
                      <div className="text-gray-300 text-sm">Quarter Kelly: {opp.stakePercentage.toFixed(1)}% of bankroll</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-500">${opp.recommendedStake.toFixed(0)}</div>
                  </div>
                </div>

                {/* Action Needed */}
                <div className={`p-3 rounded font-semibold text-center ${
                  opp.actionNeeded === 'BET NOW' ? 'bg-red-600 text-white' :
                  opp.actionNeeded === 'LINE GETTING WORSE' ? 'bg-yellow-600 text-white' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {opp.actionNeeded} • {opp.hoursUntilKickoff}hrs until kickoff
                </div>

                {/* Reasoning */}
                {opp.edgeScore.reasoning.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <div className="text-white font-semibold text-sm">WHY THIS BET:</div>
                    {opp.edgeScore.reasoning.map((reason, ridx) => (
                      <div key={ridx} className="text-green-400 text-sm">✓ {reason}</div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {opp.edgeScore.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {opp.edgeScore.warnings.map((warning, widx) => (
                      <div key={widx} className="text-yellow-400 text-sm">{warning}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Injury Reports */}
          {injuryReports.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">🏥 Key Injuries</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {injuryReports.map((report, idx) => (
                  <div key={idx} className={`rounded-lg p-6 border ${
                    report.severity === 'critical' ? 'bg-red-900/20 border-red-600' :
                    report.severity === 'significant' ? 'bg-yellow-900/20 border-yellow-600' :
                    'bg-gray-900 border-gray-800'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{report.team}</h4>
                        <div className="text-gray-400 text-sm">{report.game}</div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-semibold ${
                        report.severity === 'critical' ? 'bg-red-600' :
                        report.severity === 'significant' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      } text-white`}>
                        {report.severity.toUpperCase()}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-2xl font-bold text-red-500">{report.totalSpreadImpact.toFixed(1)} pts</div>
                      <div className="text-gray-400 text-sm">Total spread impact</div>
                    </div>

                    <div className="text-gray-300 text-sm mb-3">{report.summary}</div>

                    {report.injuries.map((injury, iidx) => (
                      <div key={iidx} className="bg-gray-800 p-3 rounded mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-semibold">{injury.player} ({injury.position})</div>
                            <div className="text-gray-400 text-xs">{injury.status.toUpperCase()}</div>
                          </div>
                          <div className="text-red-500 font-bold">{injury.spreadImpact.toFixed(1)} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parlay Correlation Warning */}
          {parlayCorrelation && (
            <div className={`rounded-lg p-6 border ${
              parlayCorrelation.severity === 'bad' ? 'bg-red-900/20 border-red-600' :
              parlayCorrelation.severity === 'risky' ? 'bg-yellow-900/20 border-yellow-600' :
              parlayCorrelation.severity === 'caution' ? 'bg-orange-900/20 border-orange-600' :
              'bg-gray-900 border-gray-800'
            }`}>
              <h3 className="text-xl font-bold text-white mb-4">🔗 Parlay Correlation Analysis</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Assumed Probability</div>
                  <div className="text-white font-bold">{(parlayCorrelation.assumedProbability * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">True Probability</div>
                  <div className="text-yellow-500 font-bold">{(parlayCorrelation.adjustedProbability * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Value Reduction</div>
                  <div className="text-red-500 font-bold text-lg">{parlayCorrelation.valueReduction.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">High Correlations</div>
                  <div className="text-white font-bold">{parlayCorrelation.highCorrelations}</div>
                </div>
              </div>

              <div className={`p-4 rounded mb-4 ${
                parlayCorrelation.severity === 'bad' ? 'bg-red-600' :
                parlayCorrelation.severity === 'risky' ? 'bg-yellow-600' :
                'bg-gray-700'
              } text-white font-semibold`}>
                {parlayCorrelation.overallWarning}
              </div>

              {parlayCorrelation.correlations.map((corr, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded mb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{corr.bet1.selection} + {corr.bet2.selection}</div>
                      <div className="text-gray-400 text-sm">{corr.warning}</div>
                    </div>
                    <div className={`text-lg font-bold ${
                      Math.abs(corr.correlationCoefficient) > 0.5 ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {(corr.correlationCoefficient * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm">{corr.recommendation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLV Tracking Tab */}
      {activeTab === 'clv' && clvStats && (
        <div className="space-y-6">
          {/* CLV Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Avg CLV</div>
              <div className={`text-3xl font-bold ${clvStats.avgCLV > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {clvStats.avgCLV > 0 ? '+' : ''}{clvStats.avgCLV.toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs mt-1">Points per bet</div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Positive CLV %</div>
              <div className="text-3xl font-bold text-white">{clvStats.positiveCLVPercentage.toFixed(1)}%</div>
              <div className="text-gray-500 text-xs mt-1">{clvStats.positiveCLVBets} of {clvStats.totalBets} bets</div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Expected ROI</div>
              <div className={`text-3xl font-bold ${clvStats.expectedROI > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {clvStats.expectedROI > 0 ? '+' : ''}{clvStats.expectedROI.toFixed(1)}%
              </div>
              <div className="text-gray-500 text-xs mt-1">Based on CLV correlation</div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Recent Trend</div>
              <div className={`text-2xl font-bold ${
                clvStats.recentTrend === 'improving' ? 'text-green-500' :
                clvStats.recentTrend === 'declining' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {clvStats.recentTrend === 'improving' ? '📈 UP' :
                 clvStats.recentTrend === 'declining' ? '📉 DOWN' : '➡️ STABLE'}
              </div>
              <div className="text-gray-500 text-xs mt-1">Last 20 vs prev 20</div>
            </div>
          </div>

          {/* CLV by Sport */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">CLV by Sport</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(clvStats.bySport).map(([sport, data]) => (
                <div key={sport} className="bg-gray-800 rounded-lg p-4">
                  <div className="text-white font-semibold mb-2">{sport}</div>
                  <div className={`text-2xl font-bold ${data.avgCLV > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.avgCLV > 0 ? '+' : ''}{data.avgCLV.toFixed(2)}
                  </div>
                  <div className="text-gray-400 text-sm">{data.count} bets</div>
                </div>
              ))}
            </div>
          </div>

          {/* CLV Alerts */}
          {clvAlerts.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">CLV Alerts</h2>
              <div className="space-y-3">
                {clvAlerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.type === 'excellent_clv' ? 'bg-green-900/20 border-green-600' :
                      alert.type === 'good_clv' ? 'bg-blue-900/20 border-blue-600' :
                      'bg-red-900/20 border-red-600'
                    }`}
                  >
                    <p className="text-white">{alert.message}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Expected CLV: {alert.expectedCLV > 0 ? '+' : ''}{alert.expectedCLV.toFixed(1)} points
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>What is CLV?</strong> Closing Line Value is the difference between your bet line and the closing line.
              Research shows that bettors who consistently beat the closing line are profitable long-term. 1 point of CLV ≈ 2.5% increase in win rate.
            </p>
          </div>
        </div>
      )}

      {/* Edge Scores Tab */}
      {activeTab === 'edge' && (
        <div className="space-y-6">
          {edgeScores.map((edge, idx) => (
            <div key={idx} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Game {idx + 1}</h3>
                  <p className="text-gray-400 text-sm">Complete edge analysis</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getEdgeColor(edge.overall)}`}>
                    {edge.overall.toFixed(0)}
                  </div>
                  <div className="text-gray-400 text-sm">Overall Score</div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-4 py-2 rounded-lg font-bold ${getRecommendationBadge(edge.recommendation)}`}>
                      {edge.recommendation.replace('_', ' ')}
                    </span>
                    <span className="ml-4 text-white">
                      Suggested Stake: <span className="text-green-500 font-bold">{edge.suggestedStake.toFixed(1)}%</span> of bankroll
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Confidence: <span className="text-white font-semibold">{(edge.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Edge Factors */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {Object.entries(edge.factors).map(([key, factor]) => (
                  <div key={key} className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-xl font-bold ${factor.score > 60 ? 'text-green-500' : factor.score > 40 ? 'text-gray-400' : 'text-red-500'}`}>
                        {factor.score.toFixed(0)}
                      </div>
                      <div className="text-gray-500 text-xs">{factor.weight}% weight</div>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{factor.details}</div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              {edge.insights.length > 0 && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-3">
                  <div className="font-semibold text-green-400 mb-2">💡 Insights</div>
                  {edge.insights.map((insight, i) => (
                    <div key={i} className="text-green-300 text-sm">{insight}</div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {edge.warnings.length > 0 && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <div className="font-semibold text-red-400 mb-2">⚠️ Warnings</div>
                  {edge.warnings.map((warning, i) => (
                    <div key={i} className="text-red-300 text-sm">{warning}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Shopping Tab */}
      {activeTab === 'books' && bookComparison && (
        <div className="space-y-6">
          {/* Best Lines Summary */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">🏆 Best Available Lines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Best Spread</div>
                <div className="text-white font-bold text-xl">{bookComparison.bestLines.spread.line} @ {bookComparison.bestLines.spread.odds}</div>
                <div className="text-green-500 text-sm">{bookComparison.bestLines.spread.book}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Best Total</div>
                <div className="text-white font-bold text-xl">{bookComparison.bestLines.total.line} @ {bookComparison.bestLines.total.odds}</div>
                <div className="text-green-500 text-sm">{bookComparison.bestLines.total.book}</div>
              </div>
            </div>
          </div>

          {/* All Books Comparison */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 overflow-x-auto">
            <h2 className="text-xl font-bold text-white mb-4">📚 All Books</h2>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Book</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Spread</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">ML Home</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">ML Away</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Object.entries(bookComparison.books).map(([name, data]) => (
                  <tr key={name} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{name}</span>
                        {data.isSharpBook && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                            SHARP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">{data.spread} ({data.spreadOdds})</td>
                    <td className="px-4 py-3 text-center text-white">{data.total} ({data.totalOdds})</td>
                    <td className="px-4 py-3 text-center text-white">{data.moneylineHome}</td>
                    <td className="px-4 py-3 text-center text-white">{data.moneylineAway}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Discrepancies */}
          {bookComparison.discrepancies.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">⚡ Market Inefficiencies Detected</h2>
              {bookComparison.discrepancies.map((disc, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 mb-3">
                  <div className="text-white font-semibold mb-2">{disc.description}</div>
                  <div className="text-green-500">Expected Value: +{disc.edge.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Props Tab */}
      {activeTab === 'props' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">🔥 Top Prop Picks</h2>
            {topProps.length === 0 ? (
              <p className="text-gray-400">No high-confidence props available right now</p>
            ) : (
              <div className="space-y-4">
                {topProps.map(prop => (
                  <div key={prop.propId} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">{prop.player}</div>
                        <div className="text-gray-400 text-sm">{prop.team} vs {prop.opponent}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-lg font-bold ${
                          prop.recommendedBet === 'over' ? 'bg-green-600 text-white' :
                          prop.recommendedBet === 'under' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {prop.recommendedBet.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="bg-gray-900 rounded p-2">
                        <div className="text-gray-400 text-xs">Stat</div>
                        <div className="text-white font-semibold">{prop.stat}</div>
                      </div>
                      <div className="bg-gray-900 rounded p-2">
                        <div className="text-gray-400 text-xs">Projection</div>
                        <div className="text-blue-500 font-bold">{prop.projection.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-900 rounded p-2">
                        <div className="text-gray-400 text-xs">Book Line</div>
                        <div className="text-white font-semibold">{prop.bookLine}</div>
                      </div>
                      <div className="bg-gray-900 rounded p-2">
                        <div className="text-gray-400 text-xs">Edge</div>
                        <div className={`font-bold ${prop.edge > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {prop.edge > 0 ? '+' : ''}{prop.edge.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-400">
                        Confidence: <span className="text-white font-semibold">{(prop.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-gray-400">
                        Historical Hit Rate: <span className="text-white font-semibold">{prop.historicalHitRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Management Tab */}
      {activeTab === 'risk' && riskManagement && (
        <div className="space-y-6">
          {/* Bankroll Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Total Bankroll</div>
              <div className="text-3xl font-bold text-white">${riskManagement.bankroll.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Current Exposure</div>
              <div className={`text-3xl font-bold ${riskManagement.exposure.percentage > 30 ? 'text-red-500' : 'text-yellow-500'}`}>
                ${riskManagement.exposure.current.toLocaleString()}
              </div>
              <div className="text-gray-500 text-sm">{riskManagement.exposure.percentage.toFixed(1)}% at risk</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Available</div>
              <div className="text-3xl font-bold text-green-500">${riskManagement.exposure.remaining.toLocaleString()}</div>
            </div>
          </div>

          {/* Kelly Criterion Stakes */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Kelly Criterion Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Conservative (10% Kelly)</div>
                <div className="text-2xl font-bold text-blue-500">${riskManagement.kellyStake.conservative}</div>
                <div className="text-gray-500 text-xs mt-1">Safest approach</div>
              </div>
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                <div className="text-green-400 text-sm mb-2">Recommended (25% Kelly) ⭐</div>
                <div className="text-2xl font-bold text-green-500">${riskManagement.kellyStake.fractional}</div>
                <div className="text-gray-500 text-xs mt-1">Optimal risk/reward</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Aggressive (Full Kelly)</div>
                <div className="text-2xl font-bold text-red-500">${riskManagement.kellyStake.full}</div>
                <div className="text-gray-500 text-xs mt-1">High variance</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(riskManagement.alerts.overexposed || riskManagement.alerts.stopLossHit) && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Risk Alerts</h2>
              <div className="space-y-2">
                {riskManagement.alerts.overexposed && (
                  <div className="text-red-300">• Over 30% exposure - reduce position sizes</div>
                )}
                {riskManagement.alerts.stopLossHit && (
                  <div className="text-red-300">• Stop loss threshold reached - consider taking a break</div>
                )}
              </div>
            </div>
          )}

          {/* Risk Guidelines */}
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">📚 Risk Management Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white font-semibold mb-2">Position Sizing</div>
                <ul className="text-gray-300 space-y-1">
                  <li>• Max 5% per single bet</li>
                  <li>• Max 30% total exposure</li>
                  <li>• Use Quarter Kelly for optimal growth</li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-2">Discipline</div>
                <ul className="text-gray-300 space-y-1">
                  <li>• Stop if down 20% in a day</li>
                  <li>• Max 2 correlated bets</li>
                  <li>• Track every bet for CLV</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sharp Money Tab */}
      {activeTab === 'sharp' && sharpMoneyData && sharpStats && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">💎 Sharp Money Analysis</h2>

          {/* Sharp Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Sharp Accuracy</div>
              <div className="text-3xl font-bold text-green-500">{(sharpStats.avgSharpAccuracy * 100).toFixed(1)}%</div>
              <div className="text-gray-400 text-xs mt-1">Following sharp consensus</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Steam Moves</div>
              <div className="text-3xl font-bold text-yellow-500">{sharpStats.steamMovesDetected}</div>
              <div className="text-gray-400 text-xs mt-1">2+ points in &lt;10 mins</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">RLM Opportunities</div>
              <div className="text-3xl font-bold text-blue-500">{sharpStats.rlmOpportunities}</div>
              <div className="text-gray-400 text-xs mt-1">Reverse line movement</div>
            </div>
          </div>

          {/* Current Game Sharp Analysis */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">{sharpMoneyData.matchup}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-gray-400 text-sm">Public %</div>
                <div className="text-white font-semibold">{sharpMoneyData.publicBettingPercentage.home}% Home</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Money %</div>
                <div className="text-white font-semibold">{sharpMoneyData.moneyPercentage.home}% Home</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Line Movement</div>
                <div className="text-white font-semibold">{sharpMoneyData.currentLine} ({sharpMoneyData.lineVelocity.toFixed(1)}/hr)</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Sharp Consensus</div>
                <div className="text-white font-semibold uppercase">{sharpMoneyData.sharpConsensus.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Sharp Indicators */}
            {sharpMoneyData.indicators.length > 0 && (
              <div className="space-y-3">
                <div className="text-white font-semibold mb-2">Sharp Signals:</div>
                {sharpMoneyData.indicators.map((indicator, idx) => (
                  <div key={idx} className={`p-4 rounded border ${
                    indicator.severity === 'critical' ? 'bg-red-900/20 border-red-600' :
                    indicator.severity === 'high' ? 'bg-yellow-900/20 border-yellow-600' :
                    'bg-blue-900/20 border-blue-600'
                  }`}>
                    <div className="text-white font-medium">{indicator.type.toUpperCase()}</div>
                    <div className="text-gray-300 text-sm mt-1">{indicator.description}</div>
                    <div className="text-gray-400 text-xs mt-2">Confidence: {(indicator.confidence * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Book Comparison */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Pinnacle vs Other Books</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-900/20 rounded border border-blue-600">
                <div className="text-gray-400 text-sm">Pinnacle (Sharp)</div>
                <div className="text-white font-bold text-lg">{sharpMoneyData.pinnacleSpread.toFixed(1)}</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-gray-400 text-sm">DraftKings</div>
                <div className="text-white font-bold text-lg">{sharpMoneyData.draftKingsSpread.toFixed(1)}</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <div className="text-gray-400 text-sm">FanDuel</div>
                <div className="text-white font-bold text-lg">{sharpMoneyData.fanDuelSpread.toFixed(1)}</div>
              </div>
            </div>
            <div className="mt-4 text-gray-300">
              Max discrepancy: <span className="text-yellow-500 font-bold">{sharpMoneyData.maxDiscrepancy.toFixed(1)} points</span>
            </div>
          </div>
        </div>
      )}

      {/* Regression Model Tab */}
      {activeTab === 'model' && modelPerformance && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">🧠 Advanced Regression Model</h2>

          {/* Model Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Model Accuracy</div>
              <div className="text-3xl font-bold text-green-500">{(modelPerformance.accuracy * 100).toFixed(1)}%</div>
              <div className="text-gray-400 text-xs mt-1">{modelPerformance.totalPredictions} predictions</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Average ROI</div>
              <div className="text-3xl font-bold text-blue-500">+{(modelPerformance.profitability * 100).toFixed(1)}%</div>
              <div className="text-gray-400 text-xs mt-1">Following model</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Avg Error</div>
              <div className="text-3xl font-bold text-gray-400">{modelPerformance.avgError.toFixed(1)} pts</div>
              <div className="text-gray-400 text-xs mt-1">Typical prediction error</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">High Confidence</div>
              <div className="text-3xl font-bold text-yellow-500">{(modelPerformance.byConfidence.high.accuracy * 100).toFixed(1)}%</div>
              <div className="text-gray-400 text-xs mt-1">{modelPerformance.byConfidence.high.count} bets</div>
            </div>
          </div>

          {/* Model Predictions */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Current Predictions</h3>
            {regressionPredictions.map((prediction, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xl font-bold text-white mb-1">Game {idx + 1} - {prediction.sport}</div>
                    <div className="text-gray-400">Model Prediction: {prediction.predictedScore.margin > 0 ? 'Home' : 'Away'} by {Math.abs(prediction.predictedScore.margin).toFixed(1)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-2 rounded font-semibold ${
                      prediction.recommendation.confidence === 'high' ? 'bg-green-600' :
                      prediction.recommendation.confidence === 'medium' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    } text-white`}>
                      {prediction.recommendation.side.toUpperCase()} - {prediction.recommendation.confidence}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-sm">Predicted Score</div>
                    <div className="text-white font-semibold">{prediction.predictedScore.home.toFixed(1)} - {prediction.predictedScore.away.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Edge vs Line</div>
                    <div className="text-yellow-500 font-bold">{prediction.recommendation.edge >= 0 ? '+' : ''}{prediction.recommendation.edge.toFixed(1)} pts</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Model Confidence</div>
                    <div className="text-white font-semibold">{(prediction.confidence * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Suggested Stake</div>
                    <div className="text-green-500 font-bold">{prediction.recommendation.suggestedStake.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Confidence Interval */}
                <div className="mt-4 p-3 bg-gray-800 rounded">
                  <div className="text-gray-400 text-sm mb-1">95% Confidence Interval</div>
                  <div className="text-white">{prediction.confidenceInterval.lower.toFixed(1)} to {prediction.confidenceInterval.upper.toFixed(1)} point margin</div>
                </div>
              </div>
            ))}
          </div>

          {/* Model Performance by Sport */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Performance by Sport</h3>
            <div className="space-y-3">
              {Object.entries(modelPerformance.bySport).map(([sport, stats]) => (
                <div key={sport} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                  <div className="text-white font-semibold">{sport}</div>
                  <div className="text-right">
                    <div className="text-green-500">{(stats.accuracy * 100).toFixed(1)}% Accuracy</div>
                    <div className="text-gray-400 text-sm">ROI: +{(stats.roi * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weather Impact Tab */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">🌤️ Weather Impact Analysis</h2>

          {/* Weather Impacts */}
          <div className="space-y-4">
            {weatherImpacts.map((weather, idx) => (
              <div key={idx} className={`rounded-lg p-6 border ${
                weather.scoringImpact <= -5 ? 'bg-blue-900/20 border-blue-600' :
                weather.scoringImpact <= -3 ? 'bg-yellow-900/20 border-yellow-600' :
                'bg-gray-900 border-gray-800'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{weather.stadium}</h3>
                    <div className="text-gray-300">{weather.temperature}°F • Wind: {weather.windSpeed} MPH • {weather.precipitation === 'none' ? 'No Precipitation' : weather.precipitation.toUpperCase()}</div>
                  </div>
                  <div className={`px-4 py-2 rounded font-semibold ${
                    weather.totalRecommendation === 'STRONG_UNDER' ? 'bg-blue-600 text-white' :
                    weather.totalRecommendation === 'LEAN_UNDER' ? 'bg-blue-700 text-white' :
                    weather.totalRecommendation === 'LEAN_OVER' ? 'bg-red-700 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {weather.totalRecommendation.replace('_', ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-sm">Scoring Impact</div>
                    <div className={`text-2xl font-bold ${weather.scoringImpact < 0 ? 'text-blue-500' : 'text-red-500'}`}>
                      {weather.scoringImpact >= 0 ? '+' : ''}{weather.scoringImpact} pts
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Passing Impact</div>
                    <div className={`text-lg font-semibold ${weather.passingEffectiveness < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {weather.passingEffectiveness >= 0 ? '+' : ''}{weather.passingEffectiveness}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Rushing Advantage</div>
                    <div className={`text-lg font-semibold ${weather.rushingAdvantage > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {weather.rushingAdvantage >= 0 ? '+' : ''}{weather.rushingAdvantage}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Confidence</div>
                    <div className="text-white font-semibold">{(weather.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Weather Factors */}
                {weather.factors.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-white font-semibold mb-2">Key Factors:</div>
                    {weather.factors.map((factor, fidx) => (
                      <div key={fidx} className="p-3 bg-gray-800 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-white font-medium uppercase">{factor.type}</div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            factor.severity === 'critical' ? 'bg-red-600' :
                            factor.severity === 'high' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          } text-white font-semibold`}>
                            {factor.severity}
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm">{factor.description}</div>
                        <div className="text-gray-400 text-xs mt-2">{factor.historicalData}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stadium Database */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Stadium Database</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stadiums.map((stadium, idx) => (
                <div key={idx} className="p-4 bg-gray-800 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-semibold">{stadium.name}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      stadium.type === 'dome' ? 'bg-green-600' : 'bg-blue-600'
                    } text-white`}>
                      {stadium.type.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">{stadium.city}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Dec Avg Temp</div>
                      <div className="text-white">{stadium.avgTempDecember}°F</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Avg Wind</div>
                      <div className="text-white">{stadium.avgWindSpeed} MPH</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-500 text-xs">Bad Weather UNDER Rate</div>
                      <div className="text-blue-500 font-semibold">{(stadium.historicalUnderRate * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
