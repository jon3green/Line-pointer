'use client';

import { Brain, TrendingUp, Target, Zap, Award, BarChart3, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from './ui/button';
import { AnimatedCounter } from './AnimatedCounter';
import { useRef } from 'react';

export default function HeroNew() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const stats = [
    { value: 72, label: 'NFL Accuracy', suffix: '%', change: '+12%' },
    { value: 7, label: 'Data Sources', suffix: '', change: 'Industry Leading' },
    { value: 0, label: 'Monthly Cost', prefix: '$', change: 'Free Tier' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'ML-Powered',
      description: 'Advanced algorithms analyzing 100+ factors',
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Data',
      description: 'Live odds from multiple sportsbooks',
      gradient: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Smart Parlays',
      description: 'AI-curated props with value indicators',
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Line Movement',
      description: 'Track sharp action and steam moves',
      gradient: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Award,
      title: 'Value Finder',
      description: 'Best ROI opportunities highlighted',
      gradient: 'from-rose-400 to-red-500',
    },
    {
      icon: BarChart3,
      title: 'Historical Data',
      description: '10+ years of comprehensive analytics',
      gradient: 'from-indigo-400 to-violet-500',
    },
  ];

  return (
    <motion.section
      ref={ref}
      style={{ opacity, scale }}
      className="relative overflow-hidden pt-20 pb-32"
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl floating" 
             style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating" 
             style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl floating" 
             style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="text-center max-w-5xl mx-auto mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8"
          >
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Industry-Leading Accuracy</span>
          </motion.div>

          <h1 className="heading-xl mb-6">
            <span className="text-white">LinePointer</span>
          </h1>

          <p className="text-3xl font-bold mb-8">
            <span className="text-gradient bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
              Sharp Lines. Smart Bets.
            </span>
          </p>

          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Powered by 7 data sources and advanced machine learning, LinePointer delivers 
            the most accurate predictions with real-time odds, value indicators, 
            and professional-grade analytics across NFL, NCAAF, NBA, and MLB.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="gradient-primary hover-lift px-8 py-6 text-lg font-semibold rounded-xl group"
            >
              <span>Get Started Free</span>
              <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-x-1 smooth-transition" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-white/10 hover:border-white/20 hover:bg-white/5 px-8 py-6 text-lg font-semibold rounded-xl smooth-transition"
            >
              View Live Demo
            </Button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              className="glass-premium rounded-2xl p-6 text-center hover-lift group relative overflow-hidden"
            >
              {/* Sparkle effect on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute top-2 right-2"
              >
                <Sparkles className="w-4 h-4 text-green-400" />
              </motion.div>

              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={0}
                className="text-4xl font-bold text-white mb-2 number-display"
              />
              <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-xs text-green-400 font-semibold"
              >
                {stat.change}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <h2 className="text-center text-3xl font-bold text-white mb-12">
            Everything You Need to Win
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="glass-card rounded-2xl p-6 hover-lift hover-glow group relative overflow-hidden"
                >
                  {/* Gradient Accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl group-hover:opacity-20 smooth-transition`} />
                  
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4`}>
                      <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                        <Icon className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Data Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Industry Leading</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Sub-30ms Response</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>7 Data Sources</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

