import type { Turn as PrismaTurn, Capture as PrismaCapture } from "@prisma/client";
import { turnSchema, captureSchema, type Turn, type Capture } from "@parishodh/shared";

export function toSharedTurn(row: PrismaTurn): Turn {
  return turnSchema.parse({
    id: row.id,
    sessionId: row.sessionId,
    index: row.index,
    speaker: row.speaker,
    text: row.text,
    stage: row.stage,
    suggestedText: row.suggestedText,
    adherence: row.adherence,
    satisfactionAfter: row.satisfactionAfter,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
  });
}

export function toSharedCapture(row: PrismaCapture): Capture {
  return captureSchema.parse({
    id: row.id,
    sessionId: row.sessionId,
    key: row.key,
    label: row.label,
    value: row.value,
    turnId: row.turnId,
    capturedAt: row.capturedAt.toISOString(),
  });
}
