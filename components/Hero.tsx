'use client';

import { Brain, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            AI-Powered Sports{' '}
            <span className="gradient-green bg-clip-text text-transparent">
              Predictions
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Advanced machine learning algorithms analyze NFL and NCAAF games to provide
            accurate predictions, betting insights, and parlay recommendations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-morphism p-6 rounded-xl"
            >
              <Brain className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                ML Predictions
              </h3>
              <p className="text-gray-400 text-sm">
                Neural networks trained on historical data
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-morphism p-6 rounded-xl"
            >
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Real-Time Odds
              </h3>
              <p className="text-gray-400 text-sm">
                Live betting lines from multiple sources
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-morphism p-6 rounded-xl"
            >
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Smart Parlays
              </h3>
              <p className="text-gray-400 text-sm">
                Optimized multi-leg betting strategies
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

