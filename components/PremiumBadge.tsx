'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, Star, Lock, Sparkles } from 'lucide-react';
import { SubscriptionTier } from '@/lib/subscription';

interface PremiumBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export function PremiumBadge({
  tier,
  size = 'md',
  showText = true,
  animated = true,
  className = '',
}: PremiumBadgeProps) {
  if (tier === 'FREE') return null;

  const config = {
    PRO: {
      icon: Zap,
      gradient: 'from-blue-500 to-purple-500',
      text: 'Pro',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    },
    PREMIUM: {
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      text: 'Premium',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const tierConfig = config[tier];
  const Icon = tierConfig.icon;

  const badge = (
    <motion.div
      initial={animated ? { scale: 0, rotate: -180 } : undefined}
      animate={animated ? { scale: 1, rotate: 0 } : undefined}
      transition={
        animated
          ? {
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }
          : undefined
      }
      whileHover={animated ? { scale: 1.05 } : undefined}
      className={`inline-flex items-center space-x-1.5 bg-gradient-to-r ${tierConfig.gradient} ${sizeClasses[size]} rounded-full font-semibold text-white ${tierConfig.glow} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      {showText && <span>{tierConfig.text}</span>}
    </motion.div>
  );

  return badge;
}

interface FeatureLockBadgeProps {
  requiredTier: SubscriptionTier;
  feature: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FeatureLockBadge({
  requiredTier,
  feature,
  size = 'md',
}: FeatureLockBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const tierConfig = {
    PRO: {
      gradient: 'from-blue-500/20 to-purple-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
    PREMIUM: {
      gradient: 'from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
    FREE: {
      gradient: 'from-gray-500/20 to-gray-600/20',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
    },
  };

  const config = tierConfig[requiredTier];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`inline-flex items-center space-x-2 bg-gradient-to-r ${config.gradient} border ${config.border} ${sizeClasses[size]} rounded-lg backdrop-blur-sm`}
    >
      <Lock className={`${iconSizes[size]} ${config.text}`} />
      <div className="flex flex-col">
        <span className={`font-medium ${config.text}`}>{feature}</span>
        <span className="text-xs text-gray-400">
          Requires {requiredTier === 'PRO' ? 'Pro' : 'Premium'}
        </span>
      </div>
    </motion.div>
  );
}

interface UpgradeBannerProps {
  currentTier: SubscriptionTier;
  targetTier: 'PRO' | 'PREMIUM';
  onUpgrade?: () => void;
}

export function UpgradeBanner({
  currentTier,
  targetTier,
  onUpgrade,
}: UpgradeBannerProps) {
  const config = {
    PRO: {
      gradient: 'from-blue-500 to-purple-500',
      icon: Zap,
      features: ['AI Predictions', 'Advanced Analytics', 'Unlimited Parlays'],
      price: '$19.99/mo',
    },
    PREMIUM: {
      gradient: 'from-yellow-500 to-orange-500',
      icon: Crown,
      features: ['Everything in Pro', 'Exclusive Picks', 'API Access'],
      price: '$49.99/mo',
    },
  };

  const tierConfig = config[targetTier];
  const Icon = tierConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl"
    >
      {/* Animated background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${tierConfig.gradient} opacity-10`}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      <div className="relative z-10 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center`}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Upgrade to {targetTier === 'PRO' ? 'Pro' : 'Premium'}
              </h3>
              <p className="text-gray-400">
                Unlock powerful features and take your betting to the next level
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {tierConfig.price}
            </div>
            <div className="text-sm text-gray-400">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {tierConfig.features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 text-white"
            >
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">{feature}</span>
            </motion.div>
          ))}
        </div>

        {onUpgrade && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className={`w-full md:w-auto px-8 py-4 bg-gradient-to-r ${tierConfig.gradient} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            Upgrade Now
          </motion.button>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [
                Math.random() * 400,
                Math.random() * 400,
                Math.random() * 400,
              ],
              y: [
                Math.random() * 200,
                Math.random() * 200,
                Math.random() * 200,
              ],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface TierIndicatorProps {
  tier: SubscriptionTier;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function TierIndicator({
  tier,
  showUpgrade = true,
  onUpgrade,
}: TierIndicatorProps) {
  const config = {
    FREE: {
      icon: Star,
      gradient: 'from-gray-500 to-gray-600',
      text: 'Free',
      description: 'Basic features',
    },
    PRO: {
      icon: Zap,
      gradient: 'from-blue-500 to-purple-500',
      text: 'Pro',
      description: 'Advanced features',
    },
    PREMIUM: {
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      text: 'Premium',
      description: 'Everything unlocked',
    },
  };

  const tierConfig = config[tier];
  const Icon = tierConfig.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center space-x-3">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold">{tierConfig.text} Plan</div>
          <div className="text-sm text-gray-400">{tierConfig.description}</div>
        </div>
      </div>

      {showUpgrade && tier !== 'PREMIUM' && onUpgrade && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg text-sm hover:shadow-lg transition-all duration-300"
        >
          Upgrade
        </motion.button>
      )}
    </div>
  );
}
