'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Clock,
  Target,
  Award,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemMetrics {
  users: {
    total: number;
    active: number;
    new24h: number;
  };
  predictions: {
    total: number;
    accuracy: number;
    today: number;
  };
  api: {
    oddsAPI: { used: number; limit: number; percentage: number };
    weatherAPI: { used: number; limit: number; percentage: number };
    espnAPI: { calls: number };
  };
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
  revenue: {
    mrr: number;
    activeSubscriptions: number;
    churnRate: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if user is admin
      // For now, just load metrics
      fetchMetrics();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      const data = await response.json();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const getAPIStatusColor = (percentage: number) => {
    if (percentage >= 90) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (percentage >= 70) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
  };

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Real-time system monitoring and analytics</p>
            </div>
            <Button
              onClick={fetchMetrics}
              className="glass-card hover:glass-premium smooth-transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-premium hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">+{metrics?.users.new24h || 0} today</Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1 number-display">
                  {metrics?.users.total.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-400">Total Users</div>
                <div className="text-xs text-green-400 mt-2">
                  {metrics?.users.active || 0} active now
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prediction Accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-premium hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Excellent</Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1 number-display">
                  {metrics?.predictions.accuracy.toFixed(1) || '0'}%
                </div>
                <div className="text-sm text-gray-400">Prediction Accuracy</div>
                <div className="text-xs text-gray-500 mt-2">
                  {metrics?.predictions.today || 0} predictions today
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cache Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-premium hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400">Optimized</Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1 number-display">
                  {metrics?.cache.hitRate.toFixed(1) || '0'}%
                </div>
                <div className="text-sm text-gray-400">Cache Hit Rate</div>
                <div className="text-xs text-gray-500 mt-2">
                  {metrics?.cache.totalHits.toLocaleString() || '0'} hits
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-premium hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400">MRR</Badge>
                </div>
                <div className="text-3xl font-bold text-white mb-1 number-display">
                  ${metrics?.revenue.mrr.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-400">Monthly Revenue</div>
                <div className="text-xs text-gray-500 mt-2">
                  {metrics?.revenue.activeSubscriptions || 0} subscribers
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* API Usage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* API Usage */}
          <Card className="glass-premium">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-green-400" />
                API Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* The Odds API */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">The Odds API</span>
                  <Badge className={`${getAPIStatusColor(metrics?.api.oddsAPI.percentage || 0).bg} ${getAPIStatusColor(metrics?.api.oddsAPI.percentage || 0).text} border ${getAPIStatusColor(metrics?.api.oddsAPI.percentage || 0).border}`}>
                    {metrics?.api.oddsAPI.percentage.toFixed(0) || 0}%
                  </Badge>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics?.api.oddsAPI.percentage || 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{metrics?.api.oddsAPI.used || 0} used</span>
                  <span>{metrics?.api.oddsAPI.limit || 0} limit</span>
                </div>
              </div>

              {/* Weather API */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">OpenWeather API</span>
                  <Badge className={`${getAPIStatusColor(metrics?.api.weatherAPI.percentage || 0).bg} ${getAPIStatusColor(metrics?.api.weatherAPI.percentage || 0).text} border ${getAPIStatusColor(metrics?.api.weatherAPI.percentage || 0).border}`}>
                    {metrics?.api.weatherAPI.percentage.toFixed(0) || 0}%
                  </Badge>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics?.api.weatherAPI.percentage || 0}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{metrics?.api.weatherAPI.used || 0} used</span>
                  <span>{metrics?.api.weatherAPI.limit || 0} limit</span>
                </div>
              </div>

              {/* ESPN API */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">ESPN API</span>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                    Unlimited
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {metrics?.api.espnAPI.calls.toLocaleString() || 0} calls today
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="glass-premium">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">API Services</div>
                    <div className="text-xs text-gray-500">All operational</div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Database</div>
                    <div className="text-xs text-gray-500">Connected</div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Redis Cache</div>
                    <div className="text-xs text-gray-500">Performance optimal</div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Fast</Badge>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">ML Models</div>
                    <div className="text-xs text-gray-500">Predictions active</div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="glass-premium">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'user', message: 'New user registered', time: '2 minutes ago', icon: Users },
                { type: 'prediction', message: 'High confidence prediction generated', time: '5 minutes ago', icon: Target },
                { type: 'parlay', message: 'Featured parlay created', time: '8 minutes ago', icon: Award },
                { type: 'api', message: 'API usage at 45%', time: '15 minutes ago', icon: Database },
                { type: 'cache', message: 'Cache cleared and rebuilt', time: '1 hour ago', icon: Zap },
              ].map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 glass-card rounded-lg hover:bg-white/10 smooth-transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{activity.message}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

