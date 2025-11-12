'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [trends, setTrends] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [sport, setSport] = useState('all');
  const [chartType, setChartType] = useState('accuracy_trend');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, period, sport, chartType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch trends
      const sportParam = sport !== 'all' ? `&sport=${sport}` : '';
      const trendsRes = await fetch(`/api/analytics/trends?period=${period}${sportParam}`);
      const trendsData = await trendsRes.json();
      if (trendsData.success) {
        setTrends(trendsData.trends);
      }

      // Fetch performance
      const perfRes = await fetch(`/api/analytics/performance?sport=${sport === 'all' ? '' : sport}`);
      const perfData = await perfRes.json();
      if (perfData.success) {
        setPerformance(perfData.performance);
      }

      // Fetch chart data
      const chartRes = await fetch(`/api/analytics/charts?type=${chartType}${sportParam}`);
      const chartData = await chartRes.json();
      if (chartData.success) {
        setChartData(chartData.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your prediction performance and accuracy metrics</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Sports</option>
            <option value="NFL">NFL</option>
            <option value="NCAAF">NCAAF</option>
            <option value="NBA">NBA</option>
            <option value="MLB">MLB</option>
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="accuracy_trend">Accuracy Trend</option>
            <option value="confidence_calibration">Confidence Calibration</option>
            <option value="clv_distribution">CLV Distribution</option>
            <option value="sport_comparison">Sport Comparison</option>
          </select>
        </div>

        {/* Stats Summary */}
        {trends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Total Predictions</div>
              <div className="text-3xl font-bold">
                {trends.reduce((sum, t) => sum + t.totalPredictions, 0)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Avg Accuracy</div>
              <div className="text-3xl font-bold text-green-400">
                {(trends.reduce((sum, t) => sum + t.accuracy, 0) / trends.length).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
              <div className="text-3xl font-bold text-blue-400">
                {(trends.reduce((sum, t) => sum + t.avgConfidence, 0) / trends.length).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Avg CLV</div>
              <div className="text-3xl font-bold text-purple-400">
                {(trends.reduce((sum, t) => sum + t.avgCLV, 0) / trends.length).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        {chartData && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {chartType === 'accuracy_trend' && 'Accuracy Trend'}
              {chartType === 'confidence_calibration' && 'Confidence Calibration'}
              {chartType === 'clv_distribution' && 'CLV Distribution'}
              {chartType === 'sport_comparison' && 'Sport Comparison'}
            </h2>
            <div className="h-80">
              {chartType === 'sport_comparison' ? (
                <Bar
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: chartData.datasets[0].label,
                      data: chartData.datasets[0].data,
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 1,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, max: 100 },
                    },
                  }}
                />
              ) : (
                <Line
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: chartData.datasets[0].label,
                      data: chartData.datasets[0].data,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.3,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, max: chartType === 'accuracy_trend' ? 100 : undefined },
                    },
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Performance Breakdown */}
        {performance && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Sport */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Performance by Sport</h3>
              <div className="space-y-3">
                {performance.bySport.map((sport: any) => (
                  <div key={sport.sport} className="flex justify-between items-center">
                    <span className="text-gray-300">{sport.sport}</span>
                    <div className="text-right">
                      <div className="text-white font-semibold">{sport.accuracy}%</div>
                      <div className="text-xs text-gray-400">{sport.totalPredictions} predictions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Confidence */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">By Confidence Level</h3>
              <div className="space-y-3">
                {performance.byConfidence.map((conf: any) => (
                  <div key={conf.range} className="flex justify-between items-center">
                    <span className="text-gray-300">{conf.range}</span>
                    <div className="text-right">
                      <div className="text-white font-semibold">{conf.accuracy}%</div>
                      <div className="text-xs text-gray-400">{conf.totalPredictions} predictions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Bet Type */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">By Bet Type</h3>
              <div className="space-y-3">
                {performance.byBetType.map((type: any) => (
                  <div key={type.betType} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">{type.betType}</span>
                    <div className="text-right">
                      <div className="text-white font-semibold">{type.accuracy}%</div>
                      <div className="text-xs text-gray-400">{type.totalPredictions} predictions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {trends.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <div className="text-gray-400 mb-2">No prediction data available yet</div>
            <div className="text-gray-500 text-sm">Start making predictions to see your analytics</div>
          </div>
        )}
      </div>
    </div>
  );
}
