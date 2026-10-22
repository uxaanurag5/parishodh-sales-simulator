import type { Namespace, Socket } from "socket.io";
import type {
  CallRinging,
  ClientToServerEvents,
  Scenario,
  ServerToClientEvents,
  SessionState,
  SimSessionStatus,
  Speaker,
} from "@parishodh/shared";
import { prisma } from "../db.js";
import { canTransition } from "./stateMachine.js";
import type { LlmProvider } from "./llm/types.js";
import { generateCustomerReply } from "./customerPersona.js";
import { generateCoachSuggestion } from "./coach.js";
import { detectStageAdvance } from "./stageDetector.js";
import { toSharedCapture, toSharedTurn } from "./serialize.js";
import { computeAdherence } from "./adherence.js";
import { detectUnsupportedPromise, evaluateTurn, ruleBasedCaptures } from "./judgment.js";
import { generateCapabilityReport } from "./report.js";
import type { TranscriptTurn } from "./types.js";
import {
  MAX_DURATION_MS,
  MAX_TURNS,
  RINGING_DELAY_MAX_MS,
  RINGING_DELAY_MIN_MS,
  SCRIPTED_CHARS_PER_SEC,
  SCRIPTED_THINK_MS,
} from "./config.js";

type Nsp = Namespace<ClientToServerEvents, ServerToClientEvents>;
type SimSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface ScriptedTurn {
  speaker: Speaker;
  text: string;
  stage: string;
  captures?: { key: string; value: string }[];
  criteriaMet?: { key: string; evidence: string }[];
  satisfactionAfter?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamScriptedText(text: string, onDelta: (delta: string) => void): Promise<void> {
  const chunkSize = 3;
  const delayMs = (chunkSize / SCRIPTED_CHARS_PER_SEC) * 1000;
  for (let i = 0; i < text.length; i += chunkSize) {
    onDelta(text.slice(i, i + chunkSize));
    if (delayMs > 0) await sleep(delayMs);
  }
}

function requireProvider(provider: LlmProvider | null): LlmProvider {
  if (!provider) {
    throw new Error("AI provider not configured (set ANTHROPIC_API_KEY and AI_MODEL)");
  }
  return provider;
}

export class SessionRuntime {
  readonly sessionId: string;
  private nsp: Nsp;
  private scenario: Scenario;
  private provider: LlmProvider | null;

  private status: SimSessionStatus = "WAITING";
  private stageIndex = 0;
  private satisfaction: number;
  private capturedKeys = new Set<string>();
  private metCriteriaKeys = new Set<string>();
  private criterionEvidence = new Map<string, string>();
  private adherenceScores: number[] = [];
  private transcript: TranscriptTurn[] = [];
  private lastSuggestion: string | null = null;

  private ended = false;
  private ringingTimer: ReturnType<typeof setTimeout> | null = null;
  private durationTimer: ReturnType<typeof setTimeout> | null = null;
  private resolveScriptedLearnerTurn: (() => void) | null = null;

  constructor(sessionId: string, scenario: Scenario, nsp: Nsp, provider: LlmProvider | null) {
    this.sessionId = sessionId;
    this.scenario = scenario;
    this.nsp = nsp;
    this.provider = provider;
    this.satisfaction = scenario.satisfactionStart;
  }

  private emit<E extends keyof ServerToClientEvents>(
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ) {
    this.nsp.to(this.sessionId).emit(event, ...args);
  }

  private get currentStage() {
    // stageIndex is only ever set to a valid index found within scenario.stages.
    return this.scenario.stages[this.stageIndex]!;
  }

  // ---- Lifecycle ----

  private get customerSummary(): CallRinging {
    return {
      customer: {
        name: this.scenario.customerName,
        initials: this.scenario.customerInitials,
        requirement: this.scenario.requirement,
        intent: this.scenario.intent,
        preferredColour: this.scenario.preferredColour,
      },
    };
  }

  async onJoin(socket?: SimSocket) {
    await this.emitSnapshot();
    if (this.status === "WAITING" && !this.ringingTimer) {
      const delay = RINGING_DELAY_MIN_MS + Math.random() * (RINGING_DELAY_MAX_MS - RINGING_DELAY_MIN_MS);
      this.ringingTimer = setTimeout(() => void this.beginRinging(), delay);
    } else if (this.status === "RINGING") {
      // A (re)joining client wouldn't otherwise see the one-time call:ringing
      // event, so resend the customer summary alongside the snapshot.
      this.emit("call:ringing", this.customerSummary);
    } else if (this.status === "ACTIVE" && socket) {
      // Session resume: a reconnecting client missed every granular event
      // (captures, criteria, the pending suggestion) emitted before it
      // joined. The snapshot above restores the transcript and status; this
      // restores everything else, targeted at just this socket.
      await this.resendStateTo(socket);
    }
  }

  private async resendStateTo(socket: SimSocket) {
    const captures = await prisma.capture.findMany({
      where: { sessionId: this.sessionId },
      orderBy: { capturedAt: "asc" },
    });
    for (const captureRow of captures) {
      socket.emit("capture:new", { capture: toSharedCapture(captureRow) });
    }
    if (this.lastSuggestion) {
      socket.emit("coach:suggestion", { text: this.lastSuggestion });
      socket.emit("coach:status", { status: "READY" });
    }
  }

  private async beginRinging() {
    if (this.status !== "WAITING") return;
    this.status = "RINGING";
    await prisma.simSession.update({ where: { id: this.sessionId }, data: { status: "RINGING" } });
    this.emit("call:ringing", this.customerSummary);
    await this.emitSnapshot();
  }

  async onAccept() {
    if (!canTransition(this.status, "ACTIVE")) return;
    this.status = "ACTIVE";
    await prisma.simSession.update({
      where: { id: this.sessionId },
      data: { status: "ACTIVE", startedAt: new Date(), currentStage: this.currentStage.key },
    });
    this.durationTimer = setTimeout(() => void this.endSession("timeout"), MAX_DURATION_MS);
    await this.emitSnapshot();

    if (this.scenario.mode === "SCRIPTED") {
      void this.runScripted();
    } else {
      await this.offerInitialCoachSuggestion();
    }
  }

  async onDecline() {
    if (!canTransition(this.status, "ENDED")) return;
    await this.endSession("declined");
  }

  async onCallEnd() {
    if (this.status !== "ACTIVE") return;
    await this.endSession("learner_ended");
  }

  async onLearnerFinal(text: string) {
    if (this.status !== "ACTIVE") return;
    if (this.scenario.mode === "SCRIPTED") {
      this.resolveScriptedLearnerTurn?.();
      return;
    }
    await this.handleLiveLearnerTurn(text);
  }

  onLearnerPartial(_text: string) {
    // Reserved for client-side karaoke highlighting; no server-side action needed.
  }

  private clearTimers() {
    if (this.ringingTimer) clearTimeout(this.ringingTimer);
    if (this.durationTimer) clearTimeout(this.durationTimer);
    this.ringingTimer = null;
    this.durationTimer = null;
  }

  private async endSession(_reason: string) {
    if (this.ended) return;
    this.ended = true;
    this.clearTimers();
    this.status = "ENDED";
    const session = await prisma.simSession.update({
      where: { id: this.sessionId },
      data: { status: "ENDED", endedAt: new Date() },
      select: { liveTaskId: true },
    });
    await prisma.liveTask.update({
      where: { id: session.liveTaskId },
      data: { status: "COMPLETED" },
    });
    await this.emitSnapshot();

    const reportId = await this.generateAndSaveReport();
    this.emit("session:ended", { reportId });
  }

  private async generateAndSaveReport(): Promise<string | null> {
    try {
      const averageAdherence =
        this.adherenceScores.length > 0
          ? this.adherenceScores.reduce((sum, a) => sum + a, 0) / this.adherenceScores.length
          : null;
      const computed = await generateCapabilityReport(
        this.provider,
        this.scenario,
        this.transcript,
        this.metCriteriaKeys,
        this.criterionEvidence,
        averageAdherence,
      );
      const row = await prisma.capabilityReport.create({
        data: {
          sessionId: this.sessionId,
          dimensions: JSON.stringify(computed.dimensions),
          overallScore: computed.overallScore,
          verdict: computed.verdict,
          strengths: JSON.stringify(computed.strengths),
          improvements: JSON.stringify(computed.improvements),
        },
      });
      return row.id;
    } catch (error) {
      // Report generation is best-effort: the call itself already completed
      // successfully and the client is waiting on session:ended regardless.
      this.nsp.to(this.sessionId).emit("session:error", {
        message: "Report generation failed; the transcript is still saved.",
      });
      console.error(`[sim] report generation failed for session ${this.sessionId}`, error);
      return null;
    }
  }

  // ---- Snapshots & stage ----

  private async buildSnapshot(): Promise<SessionState> {
    const turns = await prisma.turn.findMany({
      where: { sessionId: this.sessionId },
      orderBy: { index: "asc" },
    });
    return {
      status: this.status,
      stage: this.scenario.stages[this.stageIndex]?.key ?? null,
      satisfaction: this.satisfaction,
      turns: turns.map(toSharedTurn),
      customer: this.status === "WAITING" ? null : this.customerSummary.customer,
    };
  }

  private async emitSnapshot() {
    this.emit("session:state", await this.buildSnapshot());
  }

  private async applyStage(stage: string) {
    const idx = this.scenario.stages.findIndex((s) => s.key === stage);
    if (idx === -1 || idx === this.stageIndex) return;
    this.stageIndex = idx;
    await prisma.simSession.update({ where: { id: this.sessionId }, data: { currentStage: stage } });
    this.emit("stage:change", { stage: this.currentStage.key, label: this.currentStage.label });
  }

  // ---- Turn recording ----

  private async recordTurn(
    speaker: Speaker,
    turn: {
      text: string;
      stage: string;
      captures?: { key: string; value: string }[];
      criteriaMet?: { key: string; evidence: string }[];
      satisfactionAfter?: number;
      suggestedText?: string | null;
      adherence?: number | null;
    },
  ) {
    const index = this.transcript.length;
    const dbTurn = await prisma.turn.create({
      data: {
        sessionId: this.sessionId,
        index,
        speaker,
        text: turn.text,
        stage: turn.stage,
        suggestedText: turn.suggestedText ?? null,
        adherence: turn.adherence ?? null,
      },
    });
    this.transcript.push({ speaker, text: turn.text, stage: turn.stage });

    if (turn.captures?.length) await this.applyCaptures(turn.captures, dbTurn.id);
    if (turn.criteriaMet?.length) {
      await this.applyCriteria(turn.criteriaMet.map((c) => ({ ...c, met: true })));
    }

    if (typeof turn.satisfactionAfter === "number") {
      await this.applySatisfactionValue(turn.satisfactionAfter, "scripted", dbTurn.id);
    }

    return dbTurn;
  }

  // ---- Judgment: captures, criteria, satisfaction ----

  private async applyCaptures(captures: { key: string; value: string }[], turnId: string) {
    for (const captured of captures) {
      if (this.capturedKeys.has(captured.key)) continue;
      const def = this.scenario.captureDefinitions.find((c) => c.key === captured.key);
      if (!def) continue;
      this.capturedKeys.add(captured.key);
      const captureRow = await prisma.capture.create({
        data: {
          sessionId: this.sessionId,
          key: def.key,
          label: def.label,
          value: captured.value,
          turnId,
        },
      });
      this.emit("capture:new", { capture: toSharedCapture(captureRow) });
    }
  }

  private async applyCriteria(results: { key: string; met: boolean; evidence: string }[]) {
    for (const result of results) {
      if (!this.scenario.rubric.some((c) => c.criterionKey === result.key)) continue;
      if (result.met) this.metCriteriaKeys.add(result.key);
      if (result.evidence) this.criterionEvidence.set(result.key, result.evidence);
      await prisma.criterionResult.create({
        data: {
          sessionId: this.sessionId,
          criterionKey: result.key,
          met: result.met,
          evidence: result.evidence,
          score: result.met ? 100 : 0,
        },
      });
      this.emit("criteria:update", { criterionKey: result.key, met: result.met });
    }
  }

  private async applySatisfactionValue(value: number, reason: string, turnId?: string) {
    const clamped = Math.max(0, Math.min(100, value));
    if (turnId) {
      // Persisted even when unchanged, so the transcript replay can show the
      // satisfaction snapshot at every turn, not just the ones that moved it.
      await prisma.turn.update({ where: { id: turnId }, data: { satisfactionAfter: clamped } });
    }
    if (clamped === this.satisfaction) return;
    const delta = clamped - this.satisfaction;
    this.satisfaction = clamped;
    await prisma.simSession.update({ where: { id: this.sessionId }, data: { satisfaction: clamped } });
    this.emit("satisfaction:update", { value: clamped, delta, reason });
  }

  private async applySatisfactionDelta(delta: number, reason: string, turnId?: string) {
    if (delta === 0) return;
    await this.applySatisfactionValue(this.satisfaction + delta, reason, turnId);
  }

  // ---- SCRIPTED mode ----

  private waitForLearnerFinal(): Promise<void> {
    return new Promise((resolve) => {
      this.resolveScriptedLearnerTurn = () => {
        this.resolveScriptedLearnerTurn = null;
        resolve();
      };
    });
  }

  private async runScripted() {
    const turns = this.scenario.goldenTranscript as ScriptedTurn[];

    for (const turn of turns) {
      if (this.ended) return;
      await this.applyStage(turn.stage);

      if (turn.speaker === "CUSTOMER") {
        this.emit("coach:status", { status: "LISTENING" });
        this.emit("customer:speaking:start");
        await streamScriptedText(turn.text, (delta) => {
          if (!this.ended) this.emit("customer:text:delta", { delta });
        });
        if (this.ended) return;
        const dbTurn = await this.recordTurn("CUSTOMER", turn);
        if (this.ended) return;
        if (dbTurn) this.emit("customer:text:final", { turn: toSharedTurn(dbTurn) });
      } else {
        this.emit("coach:status", { status: "GENERATING" });
        if (SCRIPTED_THINK_MS > 0) await sleep(SCRIPTED_THINK_MS);
        this.emit("coach:suggestion", { text: turn.text });
        this.emit("coach:status", { status: "READY" });
        await this.waitForLearnerFinal();
        if (this.ended) return;
        await this.recordTurn("LEARNER", turn);
      }

      if (this.transcript.length >= MAX_TURNS) break;
    }

    if (!this.ended) await this.endSession("scripted_complete");
  }

  // ---- LIVE (GUIDED / ASSESSMENT) mode ----

  // ASSESSMENT mode speaks freely with no AI-suggested lines (CLAUDE.md "Modes").
  private get suggestionsEnabled() {
    return this.scenario.mode !== "ASSESSMENT";
  }

  private async offerInitialCoachSuggestion() {
    if (!this.suggestionsEnabled) return;
    this.emit("coach:status", { status: "GENERATING" });
    const suggestion = await generateCoachSuggestion(
      this.provider,
      this.scenario,
      [],
      this.currentStage.label,
      this.scenario.captureDefinitions.map((def) => def.label),
    );
    if (this.ended) return;
    this.lastSuggestion = suggestion;
    this.emit("coach:suggestion", { text: suggestion });
    this.emit("coach:status", { status: "READY" });
  }

  private async handleLiveLearnerTurn(text: string) {
    const adherence = computeAdherence(this.lastSuggestion, text);
    if (adherence !== null) this.adherenceScores.push(adherence);
    const learnerTurnRow = await this.recordTurn("LEARNER", {
      text,
      stage: this.currentStage.key,
      suggestedText: this.lastSuggestion,
      adherence,
    });
    this.lastSuggestion = null;

    if (this.transcript.length >= MAX_TURNS) {
      await this.endSession("max_turns");
      return;
    }
    if (this.ended) return;

    // Instant, deterministic captures so the UI reacts before the judgment
    // LLM call resolves; the call below confirms or adds to these.
    const instantHits = ruleBasedCaptures(this.scenario, text, "").filter(
      (hit) => !this.capturedKeys.has(hit.key),
    );
    if (instantHits.length > 0) await this.applyCaptures(instantHits, learnerTurnRow.id);
    if (this.ended) return;

    const judgment = await evaluateTurn(
      this.provider,
      this.scenario,
      this.transcript,
      this.capturedKeys,
      this.metCriteriaKeys,
    );
    if (this.ended) return;

    const newCaptures = judgment.newCaptures.filter((c) => !this.capturedKeys.has(c.key));
    if (newCaptures.length > 0) await this.applyCaptures(newCaptures, learnerTurnRow.id);

    const unsupportedPromise = judgment.flags.includes("unsupported_promise") || detectUnsupportedPromise(text);
    const criteriaResults = [...judgment.criteria];
    if (unsupportedPromise && !criteriaResults.some((c) => c.key === "delivery_handling")) {
      criteriaResults.push({
        key: "delivery_handling",
        met: false,
        evidence: "Promised a delivery date/timeline without first confirming availability.",
      });
    }
    if (criteriaResults.length > 0) await this.applyCriteria(criteriaResults);

    const satisfactionDelta = judgment.satisfactionDelta - (unsupportedPromise ? 10 : 0);
    if (satisfactionDelta !== 0) {
      await this.applySatisfactionDelta(
        satisfactionDelta,
        unsupportedPromise ? "Unsupported delivery promise" : judgment.reason || "Turn evaluated",
        learnerTurnRow.id,
      );
    }
    if (this.ended) return;

    const shouldAdvance = await detectStageAdvance(
      this.provider,
      this.scenario,
      this.transcript,
      this.stageIndex,
    );
    if (shouldAdvance && this.stageIndex < this.scenario.stages.length - 1) {
      await this.applyStage(this.scenario.stages[this.stageIndex + 1]!.key);
    }

    this.emit("coach:status", { status: "LISTENING" });
    this.emit("customer:speaking:start");
    let customerText: string;
    try {
      customerText = await generateCustomerReply(
        requireProvider(this.provider),
        this.scenario,
        this.transcript,
        this.currentStage,
        this.satisfaction,
        (delta) => {
          if (!this.ended) this.emit("customer:text:delta", { delta });
        },
      );
    } catch {
      customerText = "Sorry, could you repeat that?";
      if (!this.ended) this.emit("customer:text:delta", { delta: customerText });
    }
    if (this.ended) return;
    const dbTurn = await this.recordTurn("CUSTOMER", { text: customerText, stage: this.currentStage.key });
    if (this.ended) return;
    if (dbTurn) this.emit("customer:text:final", { turn: toSharedTurn(dbTurn) });

    if (!this.suggestionsEnabled || this.ended) return;

    this.emit("coach:status", { status: "GENERATING" });
    const missingLabels = this.scenario.captureDefinitions
      .filter((def) => !this.capturedKeys.has(def.key))
      .map((def) => def.label);
    const suggestion = await generateCoachSuggestion(
      this.provider,
      this.scenario,
      this.transcript,
      this.currentStage.label,
      missingLabels,
    );
    if (this.ended) return;
    this.lastSuggestion = suggestion;
    this.emit("coach:suggestion", { text: suggestion });
    this.emit("coach:status", { status: "READY" });
  }
}
