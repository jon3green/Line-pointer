import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  hasFeatureAccess,
  isSubscriptionActive,
  TierFeatures,
} from '../subscription';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  features: TierFeatures['limits'];
  canAccess: (feature: keyof TierFeatures['limits']) => boolean;
}

export function useSubscription(): SubscriptionStatus | null {
  const { data: session } = useSession();

  return useMemo(() => {
    if (!session?.user) return null;

    const user = session.user as any;
    const tier: SubscriptionTier = user.subscriptionTier || 'FREE';
    const status = user.subscriptionStatus;
    const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;

    const active = isSubscriptionActive(status, endDate);
    const features = SUBSCRIPTION_TIERS[tier].limits;

    return {
      tier,
      isActive: active,
      isPro: tier === 'PRO',
      isPremium: tier === 'PREMIUM',
      isFree: tier === 'FREE',
      features,
      canAccess: (feature: keyof TierFeatures['limits']) => {
        return hasFeatureAccess(tier, feature);
      },
    };
  }, [session]);
}
