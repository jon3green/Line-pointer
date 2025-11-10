import { Suspense } from 'react';
import LineMovementChart from '@/components/LineMovementChart';
import BetTimingRecommendation from '@/components/BetTimingRecommendation';
import CLVMetrics from '@/components/CLVMetrics';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import Footer from '@/components/Footer';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GameDetailPage({ params }: GamePageProps) {
  const { gameId } = params;

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
          <h1 className="text-3xl font-bold text-white mb-2">Game Analysis</h1>
          <p className="text-slate-400">
            Comprehensive breakdown with line movements, timing, and CLV metrics
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bet Timing Recommendation */}
            <Suspense fallback={<LoadingSkeleton />}>
              <BetTimingRecommendation gameId={gameId} />
            </Suspense>

            {/* Line Movement Charts */}
            <div className="space-y-6">
              {/* Spread Movement */}
              <Suspense fallback={<LoadingSkeleton />}>
                <LineMovementChart gameId={gameId} type="spread" />
              </Suspense>

              {/* Total Movement */}
              <Suspense fallback={<LoadingSkeleton />}>
                <LineMovementChart gameId={gameId} type="total" />
              </Suspense>

              {/* Moneyline Movement */}
              <Suspense fallback={<LoadingSkeleton />}>
                <LineMovementChart gameId={gameId} type="moneyline" />
              </Suspense>
            </div>

            {/* Multi-Bookmaker Comparison */}
            <Suspense fallback={<LoadingSkeleton />}>
              <LineMovementChart gameId={gameId} type="spread" showBookmakers={true} />
            </Suspense>
          </div>

          {/* Right Column - Metrics and Insights */}
          <div className="lg:col-span-1 space-y-8">
            {/* CLV Metrics */}
            <Suspense fallback={<LoadingSkeleton />}>
              <CLVMetrics />
            </Suspense>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Line Movement</span>
                  <span className="text-sm font-bold text-white">-2.5 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Steam Moves</span>
                  <span className="text-sm font-bold text-red-400">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Sharp %</span>
                  <span className="text-sm font-bold text-emerald-400">65%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Public %</span>
                  <span className="text-sm font-bold text-slate-300">35%</span>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-br from-blue-900/20 to-slate-800 rounded-xl border border-blue-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Action Items</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Monitor line at 7pm ET</p>
                    <p className="text-xs text-slate-400">Sharp money window</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Check injury reports</p>
                    <p className="text-xs text-slate-400">Updates at 90 minutes before kickoff</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Compare sportsbooks</p>
                    <p className="text-xs text-slate-400">Line shopping for best value</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Context */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Historical Context</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">H2H Last 5</span>
                    <span className="text-xs font-bold text-white">3-2</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">ATS vs Spread</span>
                    <span className="text-xs font-bold text-white">4-1</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">O/U Trend</span>
                    <span className="text-xs font-bold text-white">3-2 Over</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
