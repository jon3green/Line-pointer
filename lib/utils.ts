import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  } else {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  }
}

export function calculateParlayOdds(odds: number[]): number {
  const decimalOdds = odds.map(odd => {
    if (odd > 0) {
      return (odd / 100) + 1;
    } else {
      return (100 / Math.abs(odd)) + 1;
    }
  });
  
  const totalDecimal = decimalOdds.reduce((acc, odd) => acc * odd, 1);
  
  if (totalDecimal >= 2) {
    return Math.round((totalDecimal - 1) * 100);
  } else {
    return Math.round(-100 / (totalDecimal - 1));
  }
}

export function calculateParlayProbability(probabilities: number[]): number {
  return probabilities.reduce((acc, prob) => acc * (prob / 100), 1) * 100;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getConfidenceLevel(probability: number): {
  label: string;
  color: string;
} {
  if (probability >= 75) {
    return { label: 'Very High', color: 'text-green-500' };
  } else if (probability >= 65) {
    return { label: 'High', color: 'text-blue-500' };
  } else if (probability >= 55) {
    return { label: 'Moderate', color: 'text-yellow-500' };
  } else {
    return { label: 'Low', color: 'text-orange-500' };
  }
}

