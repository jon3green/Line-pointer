import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameCardEnhanced from '@/components/GameCardEnhanced';
import { Game } from '@/lib/types';

vi.mock('@/lib/store', () => ({
  useStore: vi.fn(() => ({
    addParlayLeg: vi.fn(),
    parlayLegs: [],
  })),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>((props, ref) => (
      <div ref={ref} {...props} />
    )),
  },
}));

describe('GameCardEnhanced', () => {
  const baseGame: Game = {
    id: 'game-1',
    league: 'NFL',
    date: new Date().toISOString(),
    status: 'scheduled',
    homeTeam: {
      id: 'home',
      name: 'Home Heroes',
      abbreviation: 'HOM',
    },
    awayTeam: {
      id: 'away',
      name: 'Away Warriors',
      abbreviation: 'AWY',
    },
    odds: {
      moneyline: {
        home: -125,
        away: 115,
      },
      spread: {
        home: -3.5,
        away: 3.5,
        homeOdds: -110,
        awayOdds: -110,
      },
      total: {
        line: 45.5,
        over: -110,
        under: -110,
      },
    },
    prediction: {
      winner: 'home',
      confidence: 72,
      predictedScore: {
        home: 28,
        away: 21,
      },
      factors: [
        { name: 'Market Momentum', impact: 20 },
      ],
      edge: 12,
      hasStrongEdge: true,
    },
    featuredParlays: [
      {
        id: 'parlay-1',
        title: 'Prime Time Boost',
        type: 'PARLAY',
        odds: 350,
        sourceUrl: 'https://example.com',
        legs: [
          {
            selection: 'Home Heroes -3.5',
            market: 'Spread',
            description: 'Home Heroes -3.5',
            odds: 125,
          },
          {
            selection: 'Over 45.5',
            market: 'Total',
            description: 'Over 45.5',
            odds: -110,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reveals featured parlays when expanded', async () => {
    render(<GameCardEnhanced game={baseGame} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /more details/i }));

    expect(await screen.findByText('Featured Parlays')).toBeInTheDocument();
    expect(screen.getByText('Prime Time Boost')).toBeInTheDocument();
    expect(screen.getByText('+350')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('Home Heroes -3.5'))
    ).toBeInTheDocument();
  });
});
