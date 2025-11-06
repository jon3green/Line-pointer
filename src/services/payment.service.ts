/**
 * Payment Service - Stripe Integration
 * Handles subscriptions, payments, and billing management
 */

import { authService } from './auth.service';
import type { User } from './auth.service';

export type SubscriptionPlan = {
  id: 'free' | 'pro' | 'elite';
  name: string;
  price: number; // monthly price in USD
  yearlyPrice: number;
  features: string[];
  limits: {
    betsTracked: number | 'unlimited';
    arbitrageScans: number | 'unlimited';
    apiCalls: number | 'unlimited';
    cloudSync: boolean;
    alerts: boolean;
    advancedAnalytics: boolean;
    aiPredictions: boolean;
    prioritySupport: boolean;
  };
  stripePriceId?: string; // Stripe Price ID for production
  stripeYearlyPriceId?: string;
};

export type PaymentMethod = {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: 'free' | 'pro' | 'elite';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  billingInterval: 'monthly' | 'yearly';
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
};

export type PaymentHistory = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  description: string;
  createdAt: string;
  receiptUrl?: string;
  stripeInvoiceId?: string;
};

class PaymentService {
  private readonly SUBSCRIPTION_KEY = 'user_subscription';
  private readonly PAYMENT_METHODS_KEY = 'payment_methods';
  private readonly PAYMENT_HISTORY_KEY = 'payment_history';

  // Subscription Plans Configuration
  readonly plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      features: [
        'Basic game analysis',
        '10 bets tracked per month',
        '5 arbitrage scans per day',
        'Limited API access',
        'Community support'
      ],
      limits: {
        betsTracked: 10,
        arbitrageScans: 5,
        apiCalls: 50,
        cloudSync: false,
        alerts: false,
        advancedAnalytics: false,
        aiPredictions: false,
        prioritySupport: false
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      yearlyPrice: 99.99, // Save $20/year
      features: [
        'Everything in Free',
        'Unlimited bet tracking',
        'Unlimited arbitrage scans',
        'Real-time line movement alerts',
        'Cloud sync across devices',
        'Advanced analytics dashboard',
        'Push notifications',
        'Email support (24h response)',
        'Export to CSV/Excel'
      ],
      limits: {
        betsTracked: 'unlimited',
        arbitrageScans: 'unlimited',
        apiCalls: 5000,
        cloudSync: true,
        alerts: true,
        advancedAnalytics: true,
        aiPredictions: false,
        prioritySupport: false
      },
      stripePriceId: 'price_pro_monthly', // Replace with real Stripe Price ID
      stripeYearlyPriceId: 'price_pro_yearly'
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 29.99,
      yearlyPrice: 299.99, // Save $60/year
      features: [
        'Everything in Pro',
        'AI-powered prediction models',
        'Live betting assistant',
        'Sportsbook API integration',
        'API access for automation',
        'Expert picks & analysis',
        'Private community access',
        'Priority support (1h response)',
        'Custom alerts & automation',
        'Advanced kelly criterion calculator'
      ],
      limits: {
        betsTracked: 'unlimited',
        arbitrageScans: 'unlimited',
        apiCalls: 'unlimited',
        cloudSync: true,
        alerts: true,
        advancedAnalytics: true,
        aiPredictions: true,
        prioritySupport: true
      },
      stripePriceId: 'price_elite_monthly', // Replace with real Stripe Price ID
      stripeYearlyPriceId: 'price_elite_yearly'
    }
  ];

  /**
   * Get all subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  /**
   * Get specific plan by ID
   */
  getPlan(planId: 'free' | 'pro' | 'elite'): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === planId);
  }

  /**
   * Get current user's subscription
   */
  getCurrentSubscription(): Subscription | null {
    const user = authService.getCurrentUser();
    if (!user) return null;

    try {
      const stored = localStorage.getItem(this.SUBSCRIPTION_KEY);
      if (!stored) {
        // Create default free subscription
        return this.createDefaultSubscription(user.id);
      }
      return JSON.parse(stored);
    } catch {
      return this.createDefaultSubscription(user.id);
    }
  }

  /**
   * Create Stripe checkout session
   * In production, this would call your backend endpoint
   */
  async createCheckoutSession(
    planId: 'pro' | 'elite',
    billingInterval: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; sessionUrl?: string; error?: string }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Invalid plan' };
    }

    try {
      // In production, call your backend:
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   body: JSON.stringify({ planId, billingInterval, userId: user.id })
      // });
      // const { sessionUrl } = await response.json();
      // window.location.href = sessionUrl;

      // For development/demo: simulate successful checkout
      const mockSessionUrl = `https://checkout.stripe.com/demo?plan=${planId}&interval=${billingInterval}`;

      console.log('🔷 Stripe Checkout Session Created (Demo Mode)');
      console.log(`Plan: ${plan.name}`);
      console.log(`Billing: ${billingInterval}`);
      console.log(`Amount: $${billingInterval === 'monthly' ? plan.price : plan.yearlyPrice}`);

      return { success: true, sessionUrl: mockSessionUrl };
    } catch (error) {
      return { success: false, error: 'Failed to create checkout session' };
    }
  }

  /**
   * Upgrade subscription (demo mode)
   * In production, this would trigger Stripe subscription update
   */
  async upgradeSubscription(
    planId: 'pro' | 'elite',
    billingInterval: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    const plan = this.getPlan(planId);
    if (!plan) {
      return { success: false, error: 'Invalid plan' };
    }

    // Check if trying to downgrade
    const currentSub = this.getCurrentSubscription();
    if (currentSub) {
      const currentPlanIndex = this.plans.findIndex(p => p.id === currentSub.planId);
      const newPlanIndex = this.plans.findIndex(p => p.id === planId);
      if (newPlanIndex < currentPlanIndex) {
        return { success: false, error: 'Please use downgrade function' };
      }
    }

    try {
      // Create new subscription
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId: user.id,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + (billingInterval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
        ).toISOString(),
        cancelAtPeriodEnd: false,
        billingInterval,
        stripeSubscriptionId: `stripe_sub_demo_${Date.now()}`
      };

      // Save subscription
      localStorage.setItem(this.SUBSCRIPTION_KEY, JSON.stringify(subscription));

      // Update user tier
      authService.upgradeTier(planId);

      // Record payment
      this.recordPayment(
        user.id,
        billingInterval === 'monthly' ? plan.price : plan.yearlyPrice,
        'succeeded',
        `${plan.name} - ${billingInterval} subscription`
      );

      console.log('✅ Subscription upgraded successfully!');
      console.log(`Plan: ${plan.name} (${billingInterval})`);

      return { success: true, subscription };
    } catch (error) {
      return { success: false, error: 'Failed to upgrade subscription' };
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    const subscription = this.getCurrentSubscription();
    if (!subscription) {
      return { success: false, error: 'No active subscription' };
    }

    if (subscription.planId === 'free') {
      return { success: false, error: 'Cannot cancel free plan' };
    }

    try {
      // In production, call Stripe API to cancel subscription
      subscription.cancelAtPeriodEnd = true;
      subscription.status = 'active'; // Still active until period end
      localStorage.setItem(this.SUBSCRIPTION_KEY, JSON.stringify(subscription));

      console.log('✅ Subscription will be canceled at period end');
      console.log(`End date: ${subscription.currentPeriodEnd}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(): Promise<{ success: boolean; error?: string }> {
    const subscription = this.getCurrentSubscription();
    if (!subscription) {
      return { success: false, error: 'No subscription found' };
    }

    if (!subscription.cancelAtPeriodEnd) {
      return { success: false, error: 'Subscription is not canceled' };
    }

    try {
      subscription.cancelAtPeriodEnd = false;
      localStorage.setItem(this.SUBSCRIPTION_KEY, JSON.stringify(subscription));

      console.log('✅ Subscription reactivated successfully');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to reactivate subscription' };
    }
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    try {
      const stored = localStorage.getItem(this.PAYMENT_METHODS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Add payment method (demo)
   */
  addPaymentMethod(method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const methods = this.getPaymentMethods();

    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      ...method
    };

    // If this is the first method or marked as default, make it default
    if (methods.length === 0 || method.isDefault) {
      methods.forEach(m => m.isDefault = false);
      newMethod.isDefault = true;
    }

    methods.push(newMethod);
    localStorage.setItem(this.PAYMENT_METHODS_KEY, JSON.stringify(methods));

    return newMethod;
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(methodId: string): boolean {
    const methods = this.getPaymentMethods();
    const filtered = methods.filter(m => m.id !== methodId);

    if (filtered.length === methods.length) {
      return false; // Method not found
    }

    localStorage.setItem(this.PAYMENT_METHODS_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(methodId: string): boolean {
    const methods = this.getPaymentMethods();
    const method = methods.find(m => m.id === methodId);

    if (!method) return false;

    methods.forEach(m => m.isDefault = m.id === methodId);
    localStorage.setItem(this.PAYMENT_METHODS_KEY, JSON.stringify(methods));

    return true;
  }

  /**
   * Get payment history
   */
  getPaymentHistory(): PaymentHistory[] {
    try {
      const stored = localStorage.getItem(this.PAYMENT_HISTORY_KEY);
      if (!stored) return [];
      const history: PaymentHistory[] = JSON.parse(stored);
      return history.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Record payment (internal use)
   */
  private recordPayment(
    userId: string,
    amount: number,
    status: PaymentHistory['status'],
    description: string
  ): void {
    const history = this.getPaymentHistory();

    const payment: PaymentHistory = {
      id: `pi_${Date.now()}`,
      userId,
      amount,
      currency: 'USD',
      status,
      description,
      createdAt: new Date().toISOString(),
      receiptUrl: `https://stripe.com/receipt/demo_${Date.now()}`,
      stripeInvoiceId: `in_demo_${Date.now()}`
    };

    history.push(payment);
    localStorage.setItem(this.PAYMENT_HISTORY_KEY, JSON.stringify(history));
  }

  /**
   * Check if user has access to feature
   */
  hasFeatureAccess(feature: keyof SubscriptionPlan['limits']): boolean {
    const subscription = this.getCurrentSubscription();
    if (!subscription) return false;

    const plan = this.getPlan(subscription.planId);
    if (!plan) return false;

    const limit = plan.limits[feature];
    if (typeof limit === 'boolean') return limit;
    return limit === 'unlimited' || limit > 0;
  }

  /**
   * Get usage limits for current plan
   */
  getCurrentLimits(): SubscriptionPlan['limits'] | null {
    const subscription = this.getCurrentSubscription();
    if (!subscription) return null;

    const plan = this.getPlan(subscription.planId);
    return plan ? plan.limits : null;
  }

  /**
   * Create default free subscription
   */
  private createDefaultSubscription(userId: string): Subscription {
    const subscription: Subscription = {
      id: `sub_free_${userId}`,
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      billingInterval: 'monthly'
    };

    localStorage.setItem(this.SUBSCRIPTION_KEY, JSON.stringify(subscription));
    return subscription;
  }

  /**
   * Clear all payment data (for testing)
   */
  clearAllData(): void {
    localStorage.removeItem(this.SUBSCRIPTION_KEY);
    localStorage.removeItem(this.PAYMENT_METHODS_KEY);
    localStorage.removeItem(this.PAYMENT_HISTORY_KEY);
  }
};

export const paymentService = new PaymentService();
