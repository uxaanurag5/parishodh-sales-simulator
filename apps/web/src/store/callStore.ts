import { create } from "zustand";
import type { Capture, CoachStatus, SimSessionStatus, Turn } from "@parishodh/shared";

export interface DisplayTurn {
  kind: "turn";
  speaker: "LEARNER" | "CUSTOMER";
  text: string;
  key: string;
}

export interface DisplayDivider {
  kind: "divider";
  label: string;
  key: string;
}

export type DisplayItem = DisplayTurn | DisplayDivider;

export interface CustomerSummary {
  name: string;
  initials: string;
  requirement: string;
  intent: string;
  preferredColour: string;
}

interface CallState {
  status: SimSessionStatus;
  stage: string | null;
  stageLabel: string | null;
  satisfaction: number;
  customer: CustomerSummary | null;
  customerSpeaking: boolean;
  customerLevel: number;
  items: DisplayItem[];
  streamingText: string;
  coachStatus: CoachStatus | null;
  coachSuggestion: string | null;
  suggestionDelivered: boolean;
  learnerSpeaking: boolean;
  learnerPartial: string;
  captures: Capture[];
  judgmentEvaluating: boolean;
  satisfactionDelta: number | null;
  satisfactionReason: string | null;
  acceptedAt: number | null;
  error: string | null;

  reset: () => void;
  applySnapshot: (snapshot: {
    status: SimSessionStatus;
    stage: string | null;
    satisfaction: number;
    turns: Turn[];
    customer: CustomerSummary | null;
  }) => void;
  setRinging: (customer: CustomerSummary) => void;
  startCustomerSpeaking: () => void;
  appendCustomerDelta: (delta: string) => void;
  setStreamingText: (text: string) => void;
  setCustomerLevel: (level: number) => void;
  finalizeCustomerTurn: (turn: Turn) => void;
  addLearnerTurn: (text: string) => void;
  setStage: (stage: string, label: string) => void;
  setSatisfaction: (value: number, delta?: number, reason?: string) => void;
  addCapture: (capture: Capture) => void;
  setCoachStatus: (status: CoachStatus) => void;
  setCoachSuggestion: (text: string) => void;
  markSuggestionDelivered: () => void;
  setLearnerSpeaking: (speaking: boolean) => void;
  setLearnerPartial: (text: string) => void;
  markAccepted: () => void;
  markEnded: () => void;
  setError: (message: string | null) => void;
}

function turnToItem(turn: Turn): DisplayTurn {
  return { kind: "turn", speaker: turn.speaker, text: turn.text, key: turn.id };
}

const initialState = {
  status: "WAITING" as SimSessionStatus,
  stage: null as string | null,
  stageLabel: null as string | null,
  satisfaction: 30,
  customer: null as CustomerSummary | null,
  customerSpeaking: false,
  customerLevel: 0,
  items: [] as DisplayItem[],
  streamingText: "",
  coachStatus: null as CoachStatus | null,
  coachSuggestion: null as string | null,
  suggestionDelivered: false,
  learnerSpeaking: false,
  learnerPartial: "",
  captures: [] as Capture[],
  judgmentEvaluating: false,
  satisfactionDelta: null as number | null,
  satisfactionReason: null as string | null,
  acceptedAt: null as number | null,
  error: null as string | null,
};

export const useCallStore = create<CallState>((set) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  applySnapshot: (snapshot) =>
    set((state) => ({
      status: snapshot.status,
      stage: snapshot.stage,
      satisfaction: snapshot.satisfaction,
      items: snapshot.turns.length > 0 ? snapshot.turns.map(turnToItem) : state.items,
      customer: snapshot.customer ?? state.customer,
      // A client that (re)joins an already-ACTIVE session never gets a local
      // markAccepted() call, so approximate the timer start as now. True
      // elapsed-time resume needs the server to report startedAt (Prompt 10).
      acceptedAt: snapshot.status === "ACTIVE" ? (state.acceptedAt ?? Date.now()) : state.acceptedAt,
    })),

  setRinging: (customer) => set({ status: "RINGING", customer }),

  startCustomerSpeaking: () => set({ customerSpeaking: true, streamingText: "", judgmentEvaluating: false }),

  appendCustomerDelta: (delta) => set((state) => ({ streamingText: state.streamingText + delta })),

  setStreamingText: (text) => set({ streamingText: text }),

  setCustomerLevel: (level) => set({ customerLevel: level }),

  finalizeCustomerTurn: (turn) =>
    set((state) => ({
      customerSpeaking: false,
      streamingText: "",
      customerLevel: 0,
      items: [...state.items, turnToItem(turn)],
    })),

  addLearnerTurn: (text) =>
    set((state) => ({
      items: [
        ...state.items,
        { kind: "turn", speaker: "LEARNER", text, key: `learner-${state.items.length}-${Date.now()}` },
      ],
      learnerSpeaking: false,
      learnerPartial: "",
      suggestionDelivered: true,
      judgmentEvaluating: true,
    })),

  setStage: (stage, label) =>
    set((state) => ({
      stage,
      stageLabel: label,
      items: [...state.items, { kind: "divider", label, key: `divider-${stage}-${state.items.length}` }],
    })),

  setSatisfaction: (value, delta, reason) =>
    set({
      satisfaction: value,
      satisfactionDelta: delta ?? null,
      satisfactionReason: reason ?? null,
    }),

  addCapture: (capture) => set((state) => ({ captures: [...state.captures, capture] })),

  setCoachStatus: (status) => set({ coachStatus: status }),
  setCoachSuggestion: (text) => set({ coachSuggestion: text, suggestionDelivered: false }),
  markSuggestionDelivered: () => set({ suggestionDelivered: true }),
  setLearnerSpeaking: (speaking) => set({ learnerSpeaking: speaking }),
  setLearnerPartial: (text) => set({ learnerPartial: text }),

  markAccepted: () => set({ status: "ACTIVE", acceptedAt: Date.now() }),
  markEnded: () => set({ status: "ENDED" }),
  setError: (message) => set({ error: message }),
}));
