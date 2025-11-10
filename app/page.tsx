import { Suspense } from 'react';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import HeroNew from '@/components/HeroNew';
import GamesList from '@/components/GamesList';
import ParlayBuilderEnhanced from '@/components/ParlayBuilderEnhanced';
import FeaturedProps from '@/components/FeaturedProps';
import StatsOverview from '@/components/StatsOverview';
import BettingCalculator from '@/components/BettingCalculator';
import PredictionAlerts from '@/components/PredictionAlerts';
import OptimalParlays from '@/components/OptimalParlays';
import MLInsights from '@/components/MLInsights';
import LineMovementAlerts from '@/components/LineMovementAlerts';
import Footer from '@/components/Footer';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <HeaderWithAuth />
      <HeroNew />
      
      <div className="container mx-auto px-4 py-12 space-y-12 relative">
        {/* Stats Overview */}
        <Suspense fallback={<LoadingSkeleton />}>
          <StatsOverview />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Games & Featured Props */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Parlay Generator - Featured */}
            <Suspense fallback={<LoadingSkeleton />}>
              <OptimalParlays />
            </Suspense>

            {/* Featured Props */}
            <Suspense fallback={<LoadingSkeleton />}>
              <FeaturedProps />
            </Suspense>

            {/* Games List */}
            <Suspense fallback={<LoadingSkeleton />}>
              <GamesList />
            </Suspense>
          </div>

          {/* Right Column - Alerts, ML Insights, Manual Parlay & Calculator */}
          <div className="lg:col-span-1 space-y-8">
            <Suspense fallback={<LoadingSkeleton />}>
              <PredictionAlerts />
            </Suspense>

            <Suspense fallback={<LoadingSkeleton />}>
              <LineMovementAlerts />
            </Suspense>

            <Suspense fallback={<LoadingSkeleton />}>
              <MLInsights />
            </Suspense>

            <Suspense fallback={<LoadingSkeleton />}>
              <ParlayBuilderEnhanced />
            </Suspense>

            <Suspense fallback={<LoadingSkeleton />}>
              <BettingCalculator />
            </Suspense>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
