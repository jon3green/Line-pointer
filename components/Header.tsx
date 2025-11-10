'use client';

import { useState } from 'react';
import { TrendingUp, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const LEAGUE_OPTIONS: { label: string; value: 'ALL' | 'NFL' | 'NCAAF' | 'TABLE_TENNIS' }[] = [
  { label: 'All Games', value: 'ALL' },
  { label: 'NFL', value: 'NFL' },
  { label: 'NCAAF', value: 'NCAAF' },
  { label: 'Ping Pong', value: 'TABLE_TENNIS' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedLeague, setSelectedLeague } = useStore();

  const renderLeagueButtons = (isMobile = false) => (
    <nav
      aria-label="Select league"
      role="tablist"
      className={cn(
        'flex items-center gap-2',
        isMobile ? 'flex-col space-y-2' : 'md:flex overflow-x-auto scrollbar-thin'
      )}
    >
      {LEAGUE_OPTIONS.map(({ label, value }) => (
        <Button
          key={value}
          role="tab"
          aria-selected={selectedLeague === value}
          variant={selectedLeague === value ? 'default' : 'ghost'}
          onClick={() => {
            setSelectedLeague(value);
            if (isMobile) {
              setMobileMenuOpen(false);
            }
          }}
          className={cn(
            'min-w-max',
            selectedLeague === value && 'gradient-green'
          )}
        >
          {label}
        </Button>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 glass-morphism border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="gradient-green p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Line Pointer</h1>
              <p className="text-xs text-gray-400">AI Sports Predictions</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block max-w-full">
            {renderLeagueButtons(false)}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-2">
              {renderLeagueButtons(true)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

