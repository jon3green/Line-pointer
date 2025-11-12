export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';

export interface TierFeatures {
  name: string;
  price: number; // Monthly price in dollars
  priceId: string; // Stripe Price ID (will be set from env)
  features: string[];
  limits: {
    parlaysPerDay: number;
    advancedAnalytics: boolean;
    exclusivePicks: boolean;
    aiPredictions: boolean;
    prioritySupport: boolean;
    customAlerts: boolean;
    historicalData: number; // days
    api Access: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierFeatures> = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: '', // No price ID for free tier
    features: [
      'Basic game predictions',
      'Standard odds display',
      'Community access',
      'Up to 5 parlays per day',
      '30 days historical data',
    ],
    limits: {
      parlaysPerDay: 5,
      advancedAnalytics: false,
      exclusivePicks: false,
      aiPredictions: false,
      prioritySupport: false,
      customAlerts: false,
      historicalData: 30,
      apiAccess: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 19.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
    features: [
      'Everything in Free',
      'Advanced AI predictions',
      'Detailed analytics dashboard',
      'Unlimited parlays',
      'Custom bet alerts',
      '1 year historical data',
      'Priority email support',
    ],
    limits: {
      parlaysPerDay: -1, // Unlimited
      advancedAnalytics: true,
      exclusivePicks: false,
      aiPredictions: true,
      prioritySupport: true,
      customAlerts: true,
      historicalData: 365,
      apiAccess: false,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 49.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || '',
    features: [
      'Everything in Pro',
      'Exclusive expert picks',
      'Real-time line movement alerts',
      'Advanced correlation analysis',
      'API access for integrations',
      'Unlimited historical data',
      '24/7 priority support',
      'Early access to new features',
    ],
    limits: {
      parlaysPerDay: -1, // Unlimited
      advancedAnalytics: true,
      exclusivePicks: true,
      aiPredictions: true,
      prioritySupport: true,
      customAlerts: true,
      historicalData: -1, // Unlimited
      apiAccess: true,
    },
  },
};

// Helper function to check if user has access to a feature
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof TierFeatures['limits']
): boolean {
  return SUBSCRIPTION_TIERS[userTier].limits[feature] as boolean;
}

// Helper function to check parlays per day limit
export function canCreateParlay(
  userTier: SubscriptionTier,
  currentCount: number
): boolean {
  const limit = SUBSCRIPTION_TIERS[userTier].limits.parlaysPerDay;
  if (limit === -1) return true; // Unlimited
  return currentCount < limit;
}

// Helper function to get tier from price ID
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.priceId === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}

// Helper to check if user's subscription is active
export function isSubscriptionActive(
  status: string | null,
  endDate: Date | null
): boolean {
  if (!status) return false;
  if (status === 'active' || status === 'trialing') return true;
  if (status === 'canceled' && endDate && new Date() < endDate) return true;
  return false;
}
