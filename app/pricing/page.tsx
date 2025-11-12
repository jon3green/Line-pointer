'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/subscription';
import { useSubscription } from '@/lib/hooks/useSubscription';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const subscription = useSubscription();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (tier === 'FREE') return;

    setLoading(tier);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return <Star className="w-6 h-6" />;
      case 'PRO':
        return <Zap className="w-6 h-6" />;
      case 'PREMIUM':
        return <Crown className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return 'from-gray-500 to-gray-600';
      case 'PRO':
        return 'from-blue-500 to-purple-500';
      case 'PREMIUM':
        return 'from-yellow-500 to-orange-500';
    }
  };

  const isCurrentTier = (tier: SubscriptionTier) => {
    return subscription?.tier === tier;
  };

  return (
    <main className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Upgrade to unlock advanced features and premium analytics
          </p>
          {subscription && (
            <Badge className="mt-4 px-4 py-2 text-sm">
              Current Plan: {subscription.tier}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][]).map(
            ([tier, config]) => (
              <Card
                key={tier}
                className={`glass-premium border-white/20 relative overflow-hidden ${
                  tier === 'PRO' ? 'md:scale-105 md:shadow-2xl' : ''
                }`}
              >
                {tier === 'PRO' && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2 text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                <CardHeader className={tier === 'PRO' ? 'pt-12' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(
                        tier
                      )} flex items-center justify-center text-white`}
                    >
                      {getTierIcon(tier)}
                    </div>
                    {isCurrentTier(tier) && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Current
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {config.name}
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-white">
                      ${config.price}
                    </span>
                    {config.price > 0 && (
                      <span className="text-gray-400 ml-2">/month</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {config.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3 text-gray-300"
                      >
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={
                      isCurrentTier(tier) ||
                      loading === tier ||
                      status === 'loading'
                    }
                    className={`w-full mt-6 font-semibold ${
                      tier === 'PRO'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                        : tier === 'PREMIUM'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                        : 'bg-white/10 hover:bg-white/20'
                    } ${isCurrentTier(tier) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === tier ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : isCurrentTier(tier) ? (
                      'Current Plan'
                    ) : tier === 'FREE' ? (
                      'Get Started'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <div className="mt-16 text-center text-gray-400">
          <p className="mb-4">All plans include a 14-day money-back guarantee</p>
          <p className="text-sm">
            Need help choosing? <a href="/contact" className="text-blue-400 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </main>
  );
}
