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
    // Load waitlist count from localStorage
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

    // Save to localStorage
    const stored = localStorage.getItem('ios_waitlist');
    const waitlist: WaitlistEntry[] = stored ? JSON.parse(stored) : [];
    waitlist.push(entry);
    localStorage.setItem('ios_waitlist', JSON.stringify(waitlist));

    setUserPosition(waitlist.length);
    setWaitlistCount(waitlist.length);
    setSubmitted(true);

    // In production, you would send this to your backend/email service
    console.log('Waitlist entry:', entry);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-block animate-bounce mb-4">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-4xl">
                ✓
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">You're on the list!</h1>
            <p className="text-xl text-gray-300">
              Welcome to the future of sports betting analytics
            </p>
          </div>

          {/* Position Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-400 mb-2">Your Position</div>
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                #{userPosition}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                out of {waitlistCount} people waiting
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xl">
                  ✓
                </div>
                <div>
                  <div className="font-semibold">Confirmation email sent</div>
                  <div className="text-xs text-gray-400">Check your inbox at {formData.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xl">
                  📱
                </div>
                <div>
                  <div className="font-semibold">We'll notify you when ready</div>
                  <div className="text-xs text-gray-400">iOS app launching Q2 2025</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xl">
                  🎁
                </div>
                <div>
                  <div className="font-semibold">Early access perks unlocked</div>
                  <div className="text-xs text-gray-400">3 months free premium + exclusive features</div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-3">Move up the list faster!</h3>
            <p className="text-sm text-gray-300 mb-4">
              For each friend who joins using your referral, you both move up 10 spots
            </p>
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-400 mb-1">Your Referral Link</div>
              <div className="font-mono text-sm break-all">
                https://app.aisportsanalyst.com/waitlist?ref={userPosition}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(`https://app.aisportsanalyst.com/waitlist?ref=${userPosition}`)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                📋 Copy Link
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Just joined the waitlist for AI Sports Analyst iOS app! Get guaranteed profit opportunities, line movement tracking, and more. Join me: https://app.aisportsanalyst.com/waitlist?ref=${userPosition}`, '_blank')}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                🐦 Share on Twitter
              </button>
            </div>
          </div>

          {/* Continue Using Web App */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-colors"
            >
              Continue Using Web App →
            </Link>
            <p className="text-xs text-gray-400 mt-3">
              All features are available now on web while you wait for iOS
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            ← Back to App
          </Link>
          <div className="text-sm text-gray-400">
            {waitlistCount} people waiting
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-6">
            📱 Coming Q2 2025
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            AI Sports Analyst
            <span className="block text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
              iOS App
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The most advanced sports betting analytics platform is coming to your iPhone.
            Be the first to know when we launch.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-bold mb-2">Arbitrage Finder</h3>
            <p className="text-sm text-gray-400">
              Get instant alerts for guaranteed profit opportunities across 40+ bookmakers
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">Line Movement</h3>
            <p className="text-sm text-gray-400">
              Track sharp money with real-time line movement graphs and steam move alerts
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">Smart Bet Tracking</h3>
            <p className="text-sm text-gray-400">
              AI-powered P&L analysis with personalized betting insights and recommendations
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-bold mb-2">Push Notifications</h3>
            <p className="text-sm text-gray-400">
              Never miss a sharp move, arbitrage opportunity, or line swing again
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-bold mb-2">iOS Widgets</h3>
            <p className="text-sm text-gray-400">
              Live odds, today's best bets, and your P&L right on your home screen
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-bold mb-2">Leaderboards</h3>
            <p className="text-sm text-gray-400">
              Compete with other bettors and follow the sharpest players
            </p>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Join the Waitlist</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name & Email */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number (Optional - for SMS alerts)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Most Interested Features */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Which features are you most excited about? (Select all that apply)
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
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      formData.features.includes(feature)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {formData.features.includes(feature) && '✓ '}
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Betting Experience */}
            <div>
              <label className="block text-sm font-medium mb-3">
                How would you describe your betting experience?
              </label>
              <div className="grid md:grid-cols-4 gap-3">
                {[
                  { value: 'beginner', label: '🌱 Beginner' },
                  { value: 'casual', label: '🎯 Casual' },
                  { value: 'serious', label: '📊 Serious' },
                  { value: 'professional', label: '💎 Professional' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, betExperience: option.value })}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      formData.betExperience === option.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* How did you hear about us */}
            <div>
              <label className="block text-sm font-medium mb-2">
                How did you hear about us?
              </label>
              <select
                value={formData.referralSource}
                onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium text-lg transition-colors"
            >
              Join Waitlist →
            </button>

            <p className="text-xs text-center text-gray-400">
              By joining, you'll get early access, exclusive launch perks, and priority support.
              No spam, unsubscribe anytime.
            </p>
          </form>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 mb-4">Trusted by serious bettors</p>
          <div className="flex justify-center gap-8 text-2xl opacity-50">
            ⭐⭐⭐⭐⭐
          </div>
        </div>
      </div>
    </div>
  );
}
