import { wordMatchProgress } from "@parishodh/shared";

/** How closely the learner's actual line matches the suggestion they were given, 0-1. */
export function computeAdherence(suggestion: string | null, actual: string): number | null {
  if (!suggestion) return null;
  return Math.round(wordMatchProgress(suggestion, actual).ratio * 100) / 100;
}
