/**
 * Sharp Money Indicator Badges
 * Shows visual indicators for sharp money, steam moves, and RLM on game cards
 */

interface SharpMoneyBadgeProps {
  type: 'steam' | 'rlm' | 'sharp' | 'public-fade' | 'consensus';
  side?: 'home' | 'away';
  confidence?: 'high' | 'medium' | 'low';
  details?: string;
}

export function SharpMoneyBadge({ type, side, confidence = 'medium', details }: SharpMoneyBadgeProps) {
  const badges = {
    steam: {
      icon: '⚡',
      label: 'STEAM',
      bg: 'bg-red-600',
      border: 'border-red-500',
      tooltip: 'Rapid line movement detected - sharp action'
    },
    rlm: {
      icon: '🔄',
      label: 'RLM',
      bg: 'bg-yellow-600',
      border: 'border-yellow-500',
      tooltip: 'Reverse Line Movement - line moving against public'
    },
    sharp: {
      icon: '💎',
      label: 'SHARP',
      bg: 'bg-blue-600',
      border: 'border-blue-500',
      tooltip: 'Sharp money detected on this side'
    },
    'public-fade': {
      icon: '🚫',
      label: 'FADE',
      bg: 'bg-purple-600',
      border: 'border-purple-500',
      tooltip: 'Public heavily on one side - fade opportunity'
    },
    consensus: {
      icon: '✓',
      label: 'CONSENSUS',
      bg: 'bg-green-600',
      border: 'border-green-500',
      tooltip: 'Multiple sharp indicators agree'
    }
  };

  const badge = badges[type];
  const sideLabel = side ? ` (${side === 'home' ? 'Home' : 'Away'})` : '';

  return (
    <div className="group relative inline-block">
      <div
        className={`flex items-center gap-1 px-2 py-1 ${badge.bg} ${badge.border} border rounded-full text-white text-xs font-bold animate-pulse`}
      >
        <span>{badge.icon}</span>
        <span>{badge.label}{sideLabel}</span>
        {confidence && confidence === 'high' && (
          <span className="ml-1 text-[10px]">🔥</span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="font-semibold mb-1">{badge.tooltip}</div>
        {details && <div className="text-gray-300">{details}</div>}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-black"></div>
        </div>
      </div>
    </div>
  );
}

interface SharpMoneyIndicatorProps {
  gameId: string;
  lineMovement?: {
    spreadMove: number;
    totalMove: number;
    steamDetected: boolean;
    rlmDetected: boolean;
  };
  publicBetting?: {
    homePercentage: number;
    awayPercentage: number;
  };
  sharpConsensus?: {
    side: 'home' | 'away';
    confidence: 'high' | 'medium' | 'low';
  };
}

export function SharpMoneyIndicator({
  gameId,
  lineMovement,
  publicBetting,
  sharpConsensus
}: SharpMoneyIndicatorProps) {
  const badges = [];

  // Steam move detected
  if (lineMovement?.steamDetected) {
    badges.push(
      <SharpMoneyBadge
        key="steam"
        type="steam"
        confidence="high"
        details={`Line moved ${Math.abs(lineMovement.spreadMove)} points rapidly`}
      />
    );
  }

  // Reverse line movement
  if (lineMovement?.rlmDetected) {
    const sharpSide = lineMovement.spreadMove > 0 ? 'home' : 'away';
    badges.push(
      <SharpMoneyBadge
        key="rlm"
        type="rlm"
        side={sharpSide}
        confidence="medium"
        details="Line moving opposite to public betting"
      />
    );
  }

  // Sharp consensus
  if (sharpConsensus) {
    badges.push(
      <SharpMoneyBadge
        key="sharp"
        type="sharp"
        side={sharpConsensus.side}
        confidence={sharpConsensus.confidence}
        details="Multiple sharp indicators agree"
      />
    );
  }

  // Public fade opportunity
  if (publicBetting) {
    const { homePercentage, awayPercentage } = publicBetting;
    if (homePercentage > 75 || awayPercentage > 75) {
      const fadeSide = homePercentage > 75 ? 'away' : 'home';
      badges.push(
        <SharpMoneyBadge
          key="fade"
          type="public-fade"
          side={fadeSide}
          confidence="medium"
          details={`${Math.max(homePercentage, awayPercentage)}% public on ${
            homePercentage > 75 ? 'home' : 'away'
          }`}
        />
      );
    }
  }

  // Consensus badge if multiple indicators
  if (badges.length >= 2) {
    badges.unshift(
      <SharpMoneyBadge
        key="consensus"
        type="consensus"
        confidence="high"
        details={`${badges.length} sharp indicators detected`}
      />
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges}
    </div>
  );
}

// Mock data generator for demonstration
export function generateMockSharpData() {
  const random = Math.random();

  return {
    lineMovement: random > 0.7 ? {
      spreadMove: Math.random() > 0.5 ? 2.5 : -2.5,
      totalMove: Math.random() > 0.5 ? 1.5 : -1.5,
      steamDetected: random > 0.85,
      rlmDetected: random > 0.8
    } : undefined,
    publicBetting: random > 0.5 ? {
      homePercentage: Math.floor(Math.random() * 40) + 50,
      awayPercentage: Math.floor(Math.random() * 40) + 10
    } : undefined,
    sharpConsensus: random > 0.6 ? {
      side: Math.random() > 0.5 ? 'home' as const : 'away' as const,
      confidence: random > 0.8 ? 'high' as const : 'medium' as const
    } : undefined
  };
}
