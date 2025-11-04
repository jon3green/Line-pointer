import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Games' },
    { path: '/parlay-builder', label: 'Parlay Builder' },
    { path: '/history', label: 'Performance' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏈</span>
              <h1 className="text-xl font-bold text-white">AI Sports Analyst</h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1 mt-4 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer with Disclaimers */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
            <h3 className="text-yellow-500 font-semibold mb-2 text-sm">⚠️ Important Disclaimers</h3>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• For entertainment and informational purposes only</li>
              <li>• Not gambling advice. We are not a sportsbook.</li>
              <li>• Always gamble responsibly. Never bet more than you can afford to lose.</li>
              <li>• Predictions are AI-generated and may not be accurate.</li>
              <li>• Past performance does not guarantee future results.</li>
            </ul>
          </div>

          <div className="text-center text-gray-500 text-xs">
            <p>&copy; 2025 AI Sports Analyst. All rights reserved.</p>
            <p className="mt-1">This is a sports analysis tool, not a betting platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
