'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { TrendingUp, Menu, X, User, LogOut, LayoutDashboard, LogIn, UserPlus, Target, Users } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';

const LEAGUE_OPTIONS = [
  { label: 'All Games', value: 'ALL' as const },
  { label: 'NFL', value: 'NFL' as const },
  { label: 'NCAAF', value: 'NCAAF' as const },
  { label: 'Ping Pong', value: 'TABLE_TENNIS' as const },
];

export default function HeaderWithAuth() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { selectedLeague, setSelectedLeague } = useStore();
  const { data: session, status } = useSession();

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
          <Link href="/" className="flex items-center space-x-3">
            <div className="gradient-green p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LinePointer</h1>
              <p className="text-xs text-gray-400">Sharp Lines. Smart Bets.</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block max-w-full">
            {renderLeagueButtons(false)}
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/players">
              <Button variant="ghost">
                Players
              </Button>
            </Link>
            <Link href="/accuracy">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Accuracy</span>
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Community</span>
              </Button>
            </Link>
          </div>

          {/* Notification Bell & Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            <NotificationBell />
            
          <div className="hidden md:flex items-center space-x-2">
            {status === 'loading' ? (
              <div className="h-10 w-24 bg-white/5 rounded-md animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm">
                    {(session.user as any)?.username || session.user?.name}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-morphism border border-white/10 rounded-lg shadow-lg py-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-white/10 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="gradient-green flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
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
          <div className="md:hidden py-4 border-t border-white/10 space-y-4">
            {renderLeagueButtons(true)}

            <Link href="/players" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full">
                Players
              </Button>
            </Link>

            <Link href="/accuracy" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Accuracy</span>
              </Button>
            </Link>

            <Link href="/community" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Community</span>
              </Button>
            </Link>

            {/* Mobile Auth */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full flex items-center space-x-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center space-x-2 text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full flex items-center space-x-2">
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gradient-green flex items-center space-x-2">
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

