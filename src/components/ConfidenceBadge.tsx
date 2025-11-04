import { Confidence } from '../types';

interface ConfidenceBadgeProps {
  confidence: Confidence;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfidenceBadge({ confidence, size = 'sm' }: ConfidenceBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const colorClasses = {
    High: 'bg-green-600 text-white',
    Medium: 'bg-yellow-600 text-white',
    Low: 'bg-red-600 text-white'
  };

  return (
    <span className={`${colorClasses[confidence]} ${sizeClasses[size]} rounded-full font-bold inline-block`}>
      {confidence} Confidence
    </span>
  );
}
