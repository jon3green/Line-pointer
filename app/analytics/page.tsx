import { Suspense } from 'react';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import HistoricalTrendsDashboard from '@/components/HistoricalTrendsDashboard';
import CLVMetrics from '@/components/CLVMetrics';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Footer from '@/components/Footer';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <HeaderWithAuth />

      <div className="container mx-auto px-4 py-12 relative">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Performance Analytics</h1>
          </div>
          <p className="text-lg text-slate-400">
            Track your prediction accuracy, CLV performance, and historical trends
          </p>
        </div>

        {/* CLV Metrics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Closing Line Value (CLV)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <CLVMetrics sport="NFL" />
            </Suspense>
            <Suspense fallback={<LoadingSkeleton />}>
              <CLVMetrics sport="NCAAF" />
            </Suspense>
          </div>
        </div>

        {/* Historical Trends Dashboard */}
        <Suspense fallback={<LoadingSkeleton />}>
          <HistoricalTrendsDashboard />
        </Suspense>

        {/* Insights Card */}
        <div className="mt-8 bg-gradient-to-br from-emerald-900/20 to-slate-800 rounded-xl border border-emerald-700/50 p-8">
          <h3 className="text-xl font-bold text-white mb-4">Understanding Your Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">
                Closing Line Value (CLV)
              </h4>
              <p className="text-sm text-slate-300 mb-3">
                CLV measures whether you consistently get better odds than the closing line.
                This is the #1 predictor of long-term profitability in sports betting.
              </p>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Positive CLV = Consistently beating the market</li>
                <li>Beat close rate &gt; 52% = Professional level</li>
                <li>Avg CLV &gt; 0.5 = Excellent performance</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">
                Accuracy Metrics
              </h4>
              <p className="text-sm text-slate-300 mb-3">
                Track your prediction accuracy across different bet types and time periods
                to identify strengths and areas for improvement.
              </p>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Overall accuracy &gt; 55% = Profitable betting</li>
                <li>High conf accuracy &gt; 60% = Strong model</li>
                <li>Spread accuracy most important for profitability</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-purple-400 mb-2">
                Line Movement Analysis
              </h4>
              <p className="text-sm text-slate-300 mb-3">
                Understanding line movements helps you identify sharp money,
                steam moves, and optimal betting timing.
              </p>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Steam moves = Sharp money acting quickly</li>
                <li>RLM = Line moves opposite of public betting</li>
                <li>Volatility &gt; 1.5 = Wait for stability</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-yellow-400 mb-2">
                Bet Timing Strategy
              </h4>
              <p className="text-sm text-slate-300 mb-3">
                Timing your bets correctly can add 2-3% to your overall win rate.
                Follow sharp money and avoid public betting windows.
              </p>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>12-48 hours before game = optimal window</li>
                <li>&lt; 3 hours = avoid, high sharp action</li>
                <li>Follow the smart money, fade the public</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
