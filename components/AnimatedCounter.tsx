'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState(0);

  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [springValue]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient?: string;
}

export function AnimatedStatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  trend,
  trendValue,
  gradient = 'from-blue-500 to-purple-500',
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 20, scale: 0.95 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-premium border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
    >
      {/* Gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {icon && (
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className="text-4xl font-bold text-white"
          />

          {trend && trendValue && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()} {trendValue}
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
      </div>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
        style={{ width: '50%' }}
      />
    </motion.div>
  );
}
