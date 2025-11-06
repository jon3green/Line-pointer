import { useState } from 'react';
import { Link } from 'react-router-dom';

interface WaitlistEntry {
  email: string;
  name: string;
  phoneNumber?: string;
  features: string[];
  referralSource: string;
  betExperience: string;
  timestamp: string;
}

export function IOSWaitlist() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phoneNumber: '',
    features: [] as string[],
    referralSource: '',
    betExperience: 'casual',
  });
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [userPosition, setUserPosition] = useState<number | null>(null);

  useState(() => {
    const stored = localStorage.getItem('ios_waitlist');
    if (stored) {
      const entries: WaitlistEntry[] = JSON.parse(stored);
      setWaitlistCount(entries.length);
    }
  });

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entry: WaitlistEntry = {
      ...formData,
      timestamp: new Date().toISOString()
    };

    const stored = localStorage.getItem('ios_waitlist');
    const waitlist: WaitlistEntry[] = stored ? JSON.parse(stored) : [];
    waitlist.push(entry);
    localStorage.setItem('ios_waitlist', JSON.stringify(waitlist));

    setUserPosition(waitlist.length);
    setWaitlistCount(waitlist.length);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Success Animation */}
          <div className="text-center">
            <div className="inline-block animate-bounce mb-6">
              <div className="w-24 h-24 bg-gradient-success rounded-full flex items-center justify-center shadow-glow-green">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">You're on the list!</h1>
            <p className="text-xl text-text-secondary">
              Welcome to the future of sports betting analytics
            </p>
          </div>

          {/* Position Card */}
          <div className="card bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border-brand-blue/30">
            <div className="text-center mb-8">
              <div className="text-sm text-text-muted mb-3 font-semibold">YOUR POSITION</div>
              <div className="text-7xl font-bold gradient-text mb-2">
                #{userPosition}
              </div>
              <div className="text-sm text-text-muted">
                out of {waitlistCount} people waiting
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-dark-surface/50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-text-primary">Confirmation email sent</div>
                  <div className="text-sm text-text-muted">Check {formData.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-dark-surface/50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-text-primary">We'll notify you when ready</div>
                  <div className="text-sm text-text-muted">iOS app launching Q2 2025</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-dark-surface/50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-text-primary">Early access perks unlocked</div>
                  <div className="text-sm text-text-muted">3 months free premium + exclusive features</div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="card bg-gradient-to-br from-brand-purple/10 to-accent-green/10 border-brand-purple/30">
            <h3 className="text-2xl font-bold text-text-primary mb-3">Move up the list faster!</h3>
            <p className="text-text-secondary mb-6">
              For each friend who joins using your referral, you both move up 10 spots
            </p>
            <div className="stat-card mb-4">
              <div className="text-text-muted text-xs mb-2 font-semibold">YOUR REFERRAL LINK</div>
              <div className="font-mono text-sm text-text-primary break-all">
                https://linepointer.com/waitlist?ref={userPosition}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(`https://linepointer.com/waitlist?ref=${userPosition}`)}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Just joined the waitlist for Line Pointer iOS app! Get guaranteed profit opportunities, line movement tracking, and more. Join me: https://linepointer.com/waitlist?ref=${userPosition}`, '_blank')}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Share
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link to="/" className="btn-primary inline-block">
              Continue Using Web App →
            </Link>
            <p className="text-sm text-text-muted mt-3">
              All features are available now on web while you wait for iOS
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass glass-border sticky top-0 z-50 backdrop-blur-xl mb-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-brand-blue-light hover:text-brand-blue transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to App
          </Link>
          <div className="badge badge-info">
            {waitlistCount} people waiting
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue/20 border border-brand-blue/30 rounded-full">
            <svg className="w-5 h-5 text-brand-blue-light" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-brand-blue-light text-sm font-semibold">Coming Q2 2025</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-text-primary">
            Line Pointer
            <span className="block mt-2 gradient-text">iOS App</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            The most advanced sports betting analytics platform is coming to your iPhone. Be the first to know when we launch.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '💰', title: 'Arbitrage Finder', desc: 'Get instant alerts for guaranteed profit opportunities across 40+ bookmakers' },
            { icon: '📊', title: 'Line Movement', desc: 'Track sharp money with real-time line movement graphs and steam move alerts' },
            { icon: '🎯', title: 'Smart Bet Tracking', desc: 'AI-powered P&L analysis with personalized betting insights and recommendations' },
            { icon: '⚡', title: 'Push Notifications', desc: 'Never miss a sharp move, arbitrage opportunity, or line swing again' },
            { icon: '📱', title: 'iOS Widgets', desc: 'Live odds, today\'s best bets, and your P&L right on your home screen' },
            { icon: '🏆', title: 'Leaderboards', desc: 'Compete with other bettors and follow the sharpest players' }
          ].map((feature, idx) => (
            <div key={idx} className="card card-hover">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Waitlist Form */}
        <div className="card">
          <h2 className="text-3xl font-bold text-text-primary mb-6 text-center">Join the Waitlist</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Phone Number (Optional - for SMS alerts)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-3">
                Which features are you most excited about?
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Arbitrage Finder',
                  'Line Movement Tracking',
                  'Bet Tracker & P/L',
                  'Push Notifications',
                  'iOS Widgets',
                  'Social Features',
                  'Professional Tools',
                  'Live Betting'
                ].map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                      formData.features.includes(feature)
                        ? 'bg-gradient-brand text-white shadow-glow-blue'
                        : 'bg-dark-card text-text-secondary border-2 border-dark-border hover:border-brand-blue/50'
                    }`}
                  >
                    {formData.features.includes(feature) && (
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-3">
                How would you describe your betting experience?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'beginner', label: 'Beginner', icon: '🌱' },
                  { value: 'casual', label: 'Casual', icon: '🎯' },
                  { value: 'serious', label: 'Serious', icon: '📊' },
                  { value: 'professional', label: 'Professional', icon: '💎' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, betExperience: option.value })}
                    className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                      formData.betExperience === option.value
                        ? 'bg-gradient-purple text-white'
                        : 'bg-dark-card text-text-secondary border-2 border-dark-border hover:border-brand-purple/50'
                    }`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                How did you hear about us?
              </label>
              <select
                value={formData.referralSource}
                onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                className="input"
                required
              >
                <option value="">Select one...</option>
                <option value="twitter">Twitter</option>
                <option value="reddit">Reddit</option>
                <option value="friend">Friend Referral</option>
                <option value="google">Google Search</option>
                <option value="youtube">YouTube</option>
                <option value="podcast">Podcast</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="w-full btn-primary py-5 text-lg">
              Join Waitlist →
            </button>

            <p className="text-xs text-center text-text-muted">
              By joining, you'll get early access, exclusive launch perks, and priority support. No spam, unsubscribe anytime.
            </p>
          </form>
        </div>

        {/* Social Proof */}
        <div className="text-center space-y-4">
          <p className="text-text-muted">Trusted by serious bettors</p>
          <div className="flex justify-center gap-2 text-3xl">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-8 h-8 text-accent-orange" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
