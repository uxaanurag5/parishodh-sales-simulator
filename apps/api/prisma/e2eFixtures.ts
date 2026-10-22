import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { STAGES, CAPTURE_DEFINITIONS, RUBRIC, CAPABILITY_DIMENSIONS, DEFAULT_SATISFACTION_START } from "../src/trainer/scenarioTemplate.js";

// Run once, against a throwaway e2e database, right after prisma/seed.ts.
// Prints {"scriptedSessionId": "...", "assessmentSessionId": "..."} as a
// single JSON line so e2e/global-setup.ts can hand the ids to the specs.

const prisma = new PrismaClient();

async function main() {
  const learner = await prisma.user.findUniqueOrThrow({ where: { email: "aarav@demo.in" } });

  // seed.ts creates the LiveTask but not a session — a session is only
  // created on demand when the learner starts it from the dashboard
  // (POST /api/live-tasks/:id/sessions), so mirror that here.
  const scriptedLiveTask = await prisma.liveTask.findFirstOrThrow({
    where: { assigneeId: learner.id, scenario: { mode: "SCRIPTED" } },
  });
  const scriptedSession = await prisma.simSession.create({
    data: { liveTaskId: scriptedLiveTask.id, status: "WAITING" },
  });

  const assessmentScenario = await prisma.scenario.create({
    data: {
      title: "Kia Seltos Inquiry (e2e fixture)",
      product: "Kia Seltos",
      customerName: "Neha Kapoor",
      customerInitials: "NK",
      customerPersona:
        "An Indian customer calling about the Kia Seltos. Decisive and time-pressed, open to discussing options once their core requirement is respected.",
      requirement: "Kia Seltos",
      intent: "Purchase within 2-3 weeks",
      preferredColour: "Not specified",
      objective: "Understand the customer's requirements for the Kia Seltos and guide them toward a purchase decision.",
      openingLine: "Hi, I'm interested in the Kia Seltos and wanted to understand my options.",
      hiddenFacts: JSON.stringify({
        budget: "Has a flexible but limited budget in mind",
        decisionTimeline: "Would like to decide within the next couple of weeks",
      }),
      objections: JSON.stringify([
        {
          key: "availability_guarantee",
          stage: "HANDLING_DELIVERY_QUESTION",
          prompt: "Can you guarantee this will be available on my timeline?",
        },
      ]),
      stages: JSON.stringify(STAGES),
      captureDefinitions: JSON.stringify(CAPTURE_DEFINITIONS),
      rubric: JSON.stringify(RUBRIC),
      capabilityDimensions: JSON.stringify(CAPABILITY_DIMENSIONS),
      mode: "ASSESSMENT",
      goldenTranscript: JSON.stringify([]),
      satisfactionStart: DEFAULT_SATISFACTION_START,
    },
  });

  const assessmentLiveTask = await prisma.liveTask.create({
    data: {
      scenarioId: assessmentScenario.id,
      assigneeId: learner.id,
      assignedById: learner.id,
      status: "ASSIGNED",
    },
  });
  const assessmentSession = await prisma.simSession.create({
    data: { liveTaskId: assessmentLiveTask.id, status: "WAITING" },
  });

  console.log(
    JSON.stringify({ scriptedSessionId: scriptedSession.id, assessmentSessionId: assessmentSession.id }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
