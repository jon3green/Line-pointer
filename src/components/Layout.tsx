import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Games' },
    { path: '/parlay-builder', label: 'Parlay Builder' },
    { path: '/history', label: 'Performance' },
    { path: '/line-movement', label: 'Line Movement' },
    { path: '/bet-tracker', label: 'Bet Tracker' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-lg border-b border-dark-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-accent-blue-light to-accent-blue p-2 rounded-xl group-hover:scale-105 transition-transform">
                <span className="text-2xl">🏈</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-text-primary">AI Sports Analyst</h1>
                <p className="text-xs text-text-muted">Smart Betting Insights</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-accent-blue-light to-accent-blue text-white shadow-lg shadow-accent-blue/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-surface'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Button */}
            <Link
              to="/subscription"
              className="hidden md:block px-6 py-2.5 bg-gradient-to-r from-accent-blue-light to-accent-blue text-white font-semibold rounded-3xl hover:shadow-lg hover:shadow-accent-blue/30 transition-all hover:scale-105"
            >
              Go Pro
            </Link>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-text-secondary hover:text-text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="lg:hidden flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-accent-blue-light to-accent-blue text-white shadow-lg shadow-accent-blue/20'
                    : 'text-text-secondary hover:text-text-primary bg-dark-surface'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-surface border-t border-dark-border mt-auto">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-yellow-500 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Important Disclaimers
            </h3>
            <ul className="text-text-muted text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>For entertainment and informational purposes only - not gambling advice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Always gamble responsibly. Never bet more than you can afford to lose.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>AI predictions may not be accurate. Past performance doesn't guarantee future results.</span>
              </li>
            </ul>
          </div>

          {/* Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-text-primary font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link to="/" className="hover:text-text-primary transition-colors">Games</Link></li>
                <li><Link to="/parlay-builder" className="hover:text-text-primary transition-colors">Parlay Builder</Link></li>
                <li><Link to="/line-movement" className="hover:text-text-primary transition-colors">Line Movement</Link></li>
                <li><Link to="/pro-edge" className="hover:text-text-primary transition-colors">Pro Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-primary font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link to="/bet-tracker" className="hover:text-text-primary transition-colors">Bet Tracker</Link></li>
                <li><Link to="/sentiment" className="hover:text-text-primary transition-colors">Sentiment</Link></li>
                <li><Link to="/community" className="hover:text-text-primary transition-colors">Community</Link></li>
                <li><Link to="/live-betting" className="hover:text-text-primary transition-colors">Live Betting</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-primary font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link to="/api" className="hover:text-text-primary transition-colors">API</Link></li>
                <li><Link to="/arbitrage" className="hover:text-text-primary transition-colors">Arbitrage</Link></li>
                <li><Link to="/history" className="hover:text-text-primary transition-colors">Performance</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-primary font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link to="/subscription" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/ios-waitlist" className="hover:text-text-primary transition-colors">iOS App</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-border pt-8 text-center">
            <p className="text-text-muted text-sm">
              &copy; 2025 AI Sports Analyst. All rights reserved. This is a sports analysis tool, not a betting platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
