import type { SimSessionStatus } from "@parishodh/shared";

const TRANSITIONS: Record<SimSessionStatus, SimSessionStatus[]> = {
  WAITING: ["RINGING"],
  RINGING: ["ACTIVE", "ENDED"],
  ACTIVE: ["ENDED"],
  ENDED: [],
};

export function canTransition(from: SimSessionStatus, to: SimSessionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: SimSessionStatus, to: SimSessionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid session transition: ${from} -> ${to}`);
  }
}
