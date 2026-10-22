import type { Speaker } from "@parishodh/shared";

export interface TranscriptTurn {
  speaker: Speaker;
  text: string;
  stage: string;
}
