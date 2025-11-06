/**
 * Subscription & Billing Management Page - Line Pointer
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Subscription & Billing</h1>
        <p className="text-text-secondary text-lg">Manage your plan and payment methods</p>
      </div>

      {/* Current Subscription Card */}
      {currentSubscription && (
        <div className="card bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border-brand-purple/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {plans.find(p => p.id === currentSubscription.planId)?.name} Plan
              </h2>
              <p className="text-text-secondary">
                {currentSubscription.billingInterval === 'monthly' ? 'Monthly' : 'Yearly'} billing
              </p>
            </div>
            <span className={`badge text-sm px-4 py-2 ${
              currentSubscription.status === 'active' ? 'badge-success' :
              currentSubscription.status === 'canceled' ? 'badge-danger' :
              currentSubscription.status === 'trialing' ? 'badge-info' : 'badge-warning'
            }`}>
              {currentSubscription.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card py-3">
              <div className="text-text-muted text-xs mb-1">PERIOD START</div>
              <div className="text-text-primary font-semibold">{formatDate(currentSubscription.currentPeriodStart)}</div>
            </div>
            <div className="stat-card py-3">
              <div className="text-text-muted text-xs mb-1">PERIOD END</div>
              <div className="text-text-primary font-semibold">{formatDate(currentSubscription.currentPeriodEnd)}</div>
            </div>
            <div className="stat-card py-3">
              <div className="text-text-muted text-xs mb-1">NEXT BILLING</div>
              <div className="text-text-primary font-semibold">
                {currentSubscription.cancelAtPeriodEnd ? (
                  <span className="text-accent-red">Canceled</span>
                ) : (
                  formatDate(currentSubscription.currentPeriodEnd)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pill-container inline-flex">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pill-item ${activeTab === 'plans' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Plans & Pricing
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pill-item ${activeTab === 'billing' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Payment Methods
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pill-item ${activeTab === 'history' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Billing History
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="pill-container inline-flex">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`pill-item ${billingInterval === 'monthly' ? 'pill-item-active' : 'pill-item-inactive'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`pill-item ${billingInterval === 'yearly' ? 'pill-item-active' : 'pill-item-inactive'}`}
              >
                Yearly
                <span className="ml-2 text-accent-green-light text-xs font-bold">Save 17%</span>
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
                  className={`card relative ${
                    plan.id === 'pro'
                      ? 'border-brand-blue shadow-glow-blue'
                      : isCurrentPlan
                      ? 'border-accent-green'
                      : ''
                  }`}
                >
                  {plan.id === 'pro' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="badge badge-info px-4 py-1 shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="badge badge-success px-4 py-1 shadow-lg">
                        CURRENT
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-3">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold gradient-text">${pricePerMonth}</span>
                      <span className="text-text-muted">/month</span>
                    </div>
                    {billingInterval === 'yearly' && price > 0 && (
                      <p className="text-sm text-text-muted mt-2">
                        ${price}/year (save ${(plan.price * 12 - plan.yearlyPrice).toFixed(2)})
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <svg className="w-5 h-5 text-accent-green-light flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
                    <button
                      disabled
                      className="w-full btn-secondary opacity-50 cursor-not-allowed"
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
                    </button>
                  ) : isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full btn-success cursor-not-allowed"
                    >
                      ✓ Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id as 'pro' | 'elite')}
                      disabled={loading}
                      className={plan.id === 'pro' ? 'w-full btn-primary' : 'w-full bg-gradient-purple text-white font-semibold px-6 py-3 rounded-full hover:brightness-90 transition-all shadow-lg'}
                    >
                      {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text-primary">Payment Methods</h2>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="btn-primary"
            >
              + Add Payment Method
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="card text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-surface border border-dark-border rounded-full mb-6">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-text-secondary mb-6 text-lg">No payment methods added yet</p>
              <button onClick={() => setShowPaymentForm(true)} className="btn-primary">
                Add Your First Payment Method
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">💳</div>
                    <div>
                      <p className="text-text-primary font-bold">
                        {method.brand?.toUpperCase()} •••• {method.last4}
                      </p>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-text-muted text-sm">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                      {method.isDefault && (
                        <span className="badge badge-success text-xs mt-1">Default</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Remove this payment method?')) {
                        paymentService.removePaymentMethod(method.id);
                        loadData();
                      }
                    }}
                    className="text-accent-red hover:text-red-400 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPaymentForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="card max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold text-text-primary mb-4">Add Payment Method</h3>
                <p className="text-text-secondary text-sm mb-6">
                  Demo mode: This will create a mock payment method
                </p>
                <div className="space-y-3">
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
                    className="w-full btn-primary"
                  >
                    Add Demo Card
                  </button>
                  <button onClick={() => setShowPaymentForm(false)} className="w-full btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Billing History</h2>
          {paymentHistory.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-text-secondary text-lg">No billing history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="card flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-text-primary font-bold">{payment.description}</p>
                    <p className="text-text-muted text-sm">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-text-primary font-bold text-xl">${payment.amount.toFixed(2)}</p>
                      <span className={`badge text-xs ${
                        payment.status === 'succeeded' ? 'badge-success' :
                        payment.status === 'failed' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    {payment.receiptUrl && (
                      <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                        Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
