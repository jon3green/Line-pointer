'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import Image from 'next/image';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  image?: string;
  stats?: Array<{ label: string; value: string }>;
}

interface FeatureShowcaseProps {
  features: Feature[];
  title?: string;
  subtitle?: string;
}

export default function FeatureShowcase({
  features,
  title = 'Powerful Features',
  subtitle = 'Everything you need to make smarter bets',
}: FeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        {/* Feature Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Feature List */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <motion.button
                  key={feature.title}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full text-left p-6 rounded-2xl transition-all duration-300
                    ${
                      isActive
                        ? 'glass-premium border-2 border-green-500/30 bg-green-500/5'
                        : 'glass-card hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`
                        w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 flex-shrink-0
                      `}
                    >
                      <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                        <Icon
                          className={`w-7 h-7 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}
                        />
                      </div>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-semibold mb-2 transition-colors ${
                          isActive ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed transition-colors ${
                          isActive ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {feature.description}
                      </p>

                      {/* Stats (if active) */}
                      {isActive && feature.stats && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 grid grid-cols-2 gap-3"
                        >
                          {feature.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-white/5 rounded-lg p-3"
                            >
                              <div className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                              </div>
                              <div className="text-xs text-gray-400">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={`w-1 h-full rounded-full bg-gradient-to-b ${feature.gradient}`}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Right: Feature Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden glass-premium border border-white/10">
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-20`}
              />

              {/* Image placeholder or actual image */}
              {features[activeFeature].image ? (
                <Image
                  src={features[activeFeature].image!}
                  alt={features[activeFeature].title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={activeFeature}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {(() => {
                      const Icon = features[activeFeature].icon;
                      return (
                        <Icon
                          className={`w-32 h-32 bg-gradient-to-br ${features[activeFeature].gradient} bg-clip-text text-transparent`}
                        />
                      );
                    })()}
                  </motion.div>
                </div>
              )}

              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${features[activeFeature].gradient}`}
                    animate={{
                      x: [
                        Math.random() * 400,
                        Math.random() * 400,
                        Math.random() * 400,
                      ],
                      y: [
                        Math.random() * 400,
                        Math.random() * 400,
                        Math.random() * 400,
                      ],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Floating card effect */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-6 -right-6 glass-premium rounded-2xl p-4 border border-white/20 shadow-2xl"
            >
              <div className="text-xs text-gray-400 mb-1">Active Feature</div>
              <div className="text-lg font-bold text-white">
                {features[activeFeature].title}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="glass-premium rounded-2xl p-8 inline-block">
            <p className="text-gray-400 mb-4">
              Ready to experience these features?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started Free
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Compact grid version for quick feature overview
interface FeatureGridProps {
  features: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
  }>;
}

export function FeatureGrid({ features }: FeatureGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-card rounded-2xl p-6 hover-glow group"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4`}
            >
              <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                <Icon
                  className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
