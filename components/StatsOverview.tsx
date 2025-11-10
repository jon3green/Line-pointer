'use client';

import { Card, CardContent } from './ui/card';
import { TrendingUp, Target, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsOverview() {
  const stats = [
    {
      icon: Target,
      label: 'Model Accuracy',
      value: '67.8%',
      change: '+2.3%',
      trend: 'up' as const,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: TrendingUp,
      label: 'ROI This Season',
      value: '+12.4%',
      change: '+1.8%',
      trend: 'up' as const,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Award,
      label: 'Best Streak',
      value: '8 Wins',
      change: 'Active',
      trend: 'neutral' as const,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Activity,
      label: 'Games Analyzed',
      value: '1,247',
      change: '+89 today',
      trend: 'up' as const,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="glass-morphism border-white/10 card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.trend === 'up' && (
                  <div className="flex items-center space-x-1 text-green-400 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

