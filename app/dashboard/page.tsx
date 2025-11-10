'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Target, DollarSign, BarChart3, History } from 'lucide-react';
import HeaderWithAuth from '@/components/HeaderWithAuth';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderWithAuth />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {(session.user as any)?.username || session.user?.name}! 🏈
          </h1>
          <p className="text-gray-400">
            Here&apos;s your betting performance and analytics dashboard
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <Badge className="bg-green-600/20 text-green-400">+12.4%</Badge>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Profit/Loss</p>
                <p className="text-white text-2xl font-bold">+$1,247</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Win Rate</p>
                <p className="text-white text-2xl font-bold">64.3%</p>
                <p className="text-xs text-gray-500 mt-1">18-10-0 (W-L-P)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Award className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Best Streak</p>
                <p className="text-white text-2xl font-bold">8 Wins</p>
                <p className="text-xs text-gray-500 mt-1">Current: 3 wins</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Wagered</p>
                <p className="text-white text-2xl font-bold">$10,050</p>
                <p className="text-xs text-gray-500 mt-1">28 bets placed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bets */}
          <div className="lg:col-span-2">
            <Card className="glass-morphism border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Recent Bets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock betting history - will be populated from database */}
                <div className="p-4 bg-white/5 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">Chiefs -3.5</p>
                      <p className="text-sm text-gray-400">vs Broncos • Spread</p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400">Won</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Stake: $100</span>
                    <span className="text-green-400 font-semibold">+$90.91</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">3-Leg Parlay</p>
                      <p className="text-sm text-gray-400">Bills ML • Cowboys -7 • Over 48.5</p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400">Won</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Stake: $50</span>
                    <span className="text-green-400 font-semibold">+$287.50</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">Ravens ML</p>
                      <p className="text-sm text-gray-400">vs Steelers • Moneyline</p>
                    </div>
                    <Badge className="bg-red-600/20 text-red-400">Lost</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Stake: $150</span>
                    <span className="text-red-400 font-semibold">-$150</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">Mahomes Over 275.5 Yds</p>
                      <p className="text-sm text-gray-400">Player Prop • Passing Yards</p>
                    </div>
                    <Badge className="bg-yellow-600/20 text-yellow-400">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Stake: $75</span>
                    <span className="text-gray-400">To Win: +$68.18</span>
                  </div>
                </div>

                <div className="text-center py-4">
                  <button className="text-green-400 hover:text-green-300 text-sm font-semibold">
                    View All Bets →
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart & Favorites */}
          <div className="space-y-6">
            <Card className="glass-morphism border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">NFL</span>
                      <span className="text-white font-semibold">68.2%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="gradient-green h-2 rounded-full" style={{ width: '68.2%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">NCAAF</span>
                      <span className="text-white font-semibold">58.3%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="gradient-blue h-2 rounded-full" style={{ width: '58.3%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Spreads</span>
                      <span className="text-white font-semibold">61.5%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '61.5%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Player Props</span>
                      <span className="text-white font-semibold">72.7%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '72.7%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button 
                  onClick={() => router.push('/')}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-white transition-colors"
                >
                  Browse Games →
                </button>
                <button 
                  onClick={() => router.push('/players')}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-white transition-colors"
                >
                  Player Stats →
                </button>
                <button className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-white transition-colors">
                  My Favorites →
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

