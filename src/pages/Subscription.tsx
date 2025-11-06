/**
 * Subscription & Billing Management Page
 * Displays pricing plans, manages subscriptions, and handles payments
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import type { SubscriptionPlan, Subscription, PaymentMethod, PaymentHistory } from '../services/payment.service';
import { authService } from '../services/auth.service';

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'billing' | 'history'>('plans');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCurrentSubscription(paymentService.getCurrentSubscription());
    setPlans(paymentService.getPlans());
    setPaymentMethods(paymentService.getPaymentMethods());
    setPaymentHistory(paymentService.getPaymentHistory());
  };

  const handleUpgrade = async (planId: 'pro' | 'elite') => {
    if (!user) {
      alert('Please log in to upgrade');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // In production, create Stripe checkout session
      // const { success, sessionUrl, error } = await paymentService.createCheckoutSession(planId, billingInterval);
      // if (success && sessionUrl) {
      //   window.location.href = sessionUrl;
      // }

      // For demo: simulate successful upgrade
      const result = await paymentService.upgradeSubscription(planId, billingInterval);

      if (result.success) {
        alert(`🎉 Successfully upgraded to ${planId.toUpperCase()} plan!`);
        setUser(authService.getCurrentUser());
        loadData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to process upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll retain access until the end of your billing period.')) {
      return;
    }

    const result = await paymentService.cancelSubscription();
    if (result.success) {
      alert('Subscription canceled. You\'ll retain access until the end of your billing period.');
      loadData();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleReactivate = async () => {
    const result = await paymentService.reactivateSubscription();
    if (result.success) {
      alert('Subscription reactivated successfully!');
      loadData();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: Subscription['status']) => {
    const badges = {
      active: 'bg-green-600 text-white',
      canceled: 'bg-red-600 text-white',
      past_due: 'bg-orange-600 text-white',
      trialing: 'bg-blue-600 text-white',
      incomplete: 'bg-gray-600 text-white'
    };
    return badges[status] || 'bg-gray-600 text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Subscription & Billing</h1>
          <p className="text-gray-300">Manage your plan, payment methods, and billing history</p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {plans.find(p => p.id === currentSubscription.planId)?.name} Plan
                </h2>
                <p className="text-gray-400">
                  {currentSubscription.billingInterval === 'monthly' ? 'Monthly' : 'Yearly'} billing
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadge(currentSubscription.status)}`}>
                {currentSubscription.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Period Start</p>
                <p className="text-white font-semibold">{formatDate(currentSubscription.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Period End</p>
                <p className="text-white font-semibold">{formatDate(currentSubscription.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Next Billing</p>
                <p className="text-white font-semibold">
                  {currentSubscription.cancelAtPeriodEnd ? (
                    <span className="text-red-500">Canceled</span>
                  ) : (
                    formatDate(currentSubscription.currentPeriodEnd)
                  )}
                </p>
              </div>
            </div>

            {currentSubscription.cancelAtPeriodEnd ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-red-900/20 border border-red-600 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    Your subscription will be canceled on {formatDate(currentSubscription.currentPeriodEnd)}
                  </p>
                </div>
                <button
                  onClick={handleReactivate}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Reactivate
                </button>
              </div>
            ) : currentSubscription.planId !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Plans & Pricing
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'billing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Billing History
          </button>
        </div>

        {/* Plans & Pricing Tab */}
        {activeTab === 'plans' && (
          <div>
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-800 rounded-lg p-1 flex items-center gap-2">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-green-400 text-sm">Save 17%</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.planId === plan.id;
                const price = billingInterval === 'monthly' ? plan.price : plan.yearlyPrice;
                const pricePerMonth = billingInterval === 'yearly' ? (plan.yearlyPrice / 12).toFixed(2) : price;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-gray-900 rounded-lg p-6 border-2 transition-all ${
                      plan.id === 'pro'
                        ? 'border-blue-600 shadow-lg shadow-blue-600/20'
                        : isCurrentPlan
                        ? 'border-green-600'
                        : 'border-gray-800'
                    }`}
                  >
                    {plan.id === 'pro' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          CURRENT PLAN
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">${pricePerMonth}</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      {billingInterval === 'yearly' && price > 0 && (
                        <p className="text-sm text-gray-400 mt-1">
                          ${price}/year (save ${(plan.price * 12 - plan.yearlyPrice).toFixed(2)})
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.id === 'free' ? (
                      <button
                        disabled
                        className="w-full py-3 bg-gray-700 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
                      </button>
                    ) : isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold cursor-not-allowed"
                      >
                        ✓ Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id as 'pro' | 'elite')}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                          plan.id === 'pro'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Table */}
            <div className="mt-12 bg-gray-900 rounded-lg p-6 border border-gray-800 overflow-x-auto">
              <h3 className="text-xl font-bold text-white mb-6">Feature Comparison</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Free</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Pro</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Elite</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { name: 'Bets Tracked', free: '10/month', pro: 'Unlimited', elite: 'Unlimited' },
                    { name: 'Arbitrage Scans', free: '5/day', pro: 'Unlimited', elite: 'Unlimited' },
                    { name: 'API Calls', free: '50/month', pro: '5,000/month', elite: 'Unlimited' },
                    { name: 'Cloud Sync', free: '✗', pro: '✓', elite: '✓' },
                    { name: 'Real-time Alerts', free: '✗', pro: '✓', elite: '✓' },
                    { name: 'Advanced Analytics', free: '✗', pro: '✓', elite: '✓' },
                    { name: 'AI Predictions', free: '✗', pro: '✗', elite: '✓' },
                    { name: 'Live Betting', free: '✗', pro: '✗', elite: '✓' },
                    { name: 'API Access', free: '✗', pro: '✗', elite: '✓' },
                    { name: 'Support', free: 'Community', pro: '24h Email', elite: '1h Priority' }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">{row.name}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{row.free}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{row.pro}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{row.elite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Add Payment Method
              </button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
                <p className="text-gray-400 mb-4">No payment methods added yet</p>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Your First Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {method.type === 'card' ? '💳' : method.type === 'paypal' ? '🅿️' : '🍎'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {method.brand?.toUpperCase()} •••• {method.last4}
                        </p>
                        {method.expiryMonth && method.expiryYear && (
                          <p className="text-gray-400 text-sm">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        )}
                        {method.isDefault && (
                          <span className="text-green-500 text-sm font-semibold">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => {
                            paymentService.setDefaultPaymentMethod(method.id);
                            loadData();
                          }}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Remove this payment method?')) {
                            paymentService.removePaymentMethod(method.id);
                            loadData();
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Payment Method Form (Demo) */}
            {showPaymentForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">Add Payment Method</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Demo mode: This will create a mock payment method
                  </p>
                  <button
                    onClick={() => {
                      paymentService.addPaymentMethod({
                        type: 'card',
                        last4: String(Math.floor(1000 + Math.random() * 9000)),
                        brand: 'visa',
                        expiryMonth: 12,
                        expiryYear: 2026,
                        isDefault: paymentMethods.length === 0
                      });
                      setShowPaymentForm(false);
                      loadData();
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-2"
                  >
                    Add Demo Card
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Billing History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Billing History</h2>
            {paymentHistory.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
                <p className="text-gray-400">No billing history yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{payment.description}</p>
                      <p className="text-gray-400 text-sm">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${payment.amount.toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'succeeded'
                            ? 'bg-green-600 text-white'
                            : payment.status === 'failed'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                      >
                        View Receipt
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
