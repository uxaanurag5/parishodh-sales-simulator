import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type {
  CaptureDefinition,
  GoldenTranscriptTurn,
  HiddenFacts,
  Objection,
  RubricCriterion,
  CapabilityDimensionDef,
  Stage,
} from "@parishodh/shared";

const prisma = new PrismaClient();

const stages: Stage[] = [
  { key: "CALL_OPENING", label: "Call Opening" },
  { key: "CUSTOMER_DISCOVERY", label: "Customer Discovery" },
  { key: "HANDLING_DELIVERY_QUESTION", label: "Handling the Delivery Question" },
  { key: "CUSTOMER_OBJECTION", label: "Customer Objection" },
  { key: "CLOSING_SIMULATION", label: "Closing the Simulation" },
];

const captureDefinitions: CaptureDefinition[] = [
  {
    key: "vehicle_identified",
    label: "Vehicle identified",
    description: "The specific vehicle model the customer wants was identified.",
  },
  {
    key: "colour_timeline",
    label: "Colour & timeline",
    description: "Preferred colour and delivery timeline were captured.",
  },
  {
    key: "variant_discovered",
    label: "Variant discovered",
    description: "The preferred variant/trim level was discovered.",
  },
  {
    key: "timeline_probed",
    label: "Timeline probed",
    description: "Learner checked whether the timeline had any flexibility.",
  },
  {
    key: "need_identified",
    label: "Need identified",
    description:
      "The underlying reason for the purchase (replacement vs. additional vehicle) was identified.",
  },
  {
    key: "qualification",
    label: "Qualification",
    description: "Financing vs. outright purchase intent was captured.",
  },
  {
    key: "no_unsupported_promise",
    label: "No unsupported promise",
    description: "Learner avoided promising an unconfirmed delivery date.",
  },
  {
    key: "objection_handled",
    label: "Objection handled",
    description: "The colour objection was handled without suggesting another colour.",
  },
  {
    key: "next_step_agreed",
    label: "Next step agreed",
    description: "A clear follow-up/next step was agreed with the customer.",
  },
];

const rubric: RubricCriterion[] = [
  {
    criterionKey: "product_understanding",
    title: "Product Understanding",
    question: "Did the learner understand the customer's vehicle requirement?",
    weight: 10,
  },
  {
    criterionKey: "requirement_discovery",
    title: "Requirement Discovery",
    question: "Did he identify variant, colour and timeline?",
    weight: 15,
  },
  {
    criterionKey: "customer_need_identification",
    title: "Customer Need Identification",
    question: "Did he understand why the customer needs the vehicle?",
    weight: 10,
  },
  {
    criterionKey: "delivery_handling",
    title: "Delivery Handling",
    question: "Did he avoid making an unsupported delivery promise?",
    weight: 15,
  },
  {
    criterionKey: "objection_handling",
    title: "Objection Handling",
    question: "Did he respond appropriately to the colour/delivery concern?",
    weight: 15,
  },
  {
    criterionKey: "communication",
    title: "Communication",
    question: "Was the conversation clear and professional?",
    weight: 10,
  },
  {
    criterionKey: "sales_qualification",
    title: "Sales Qualification",
    question: "Did he identify financing and purchase intent?",
    weight: 10,
  },
  {
    criterionKey: "next_step_management",
    title: "Next-Step Management",
    question: "Did he establish a clear follow-up/action?",
    weight: 10,
  },
  {
    criterionKey: "customer_satisfaction",
    title: "Customer Satisfaction",
    question: "Did the simulated customer feel the requirement was understood?",
    weight: 5,
  },
];

const capabilityDimensions: CapabilityDimensionDef[] = [
  { key: "product_knowledge", label: "Product Knowledge", criteriaKeys: ["product_understanding"] },
  {
    key: "requirement_discovery",
    label: "Requirement Discovery",
    criteriaKeys: ["requirement_discovery"],
  },
  {
    key: "customer_handling",
    label: "Customer Handling",
    criteriaKeys: ["customer_need_identification", "customer_satisfaction"],
  },
  {
    key: "objection_handling",
    label: "Objection Handling",
    criteriaKeys: ["objection_handling", "delivery_handling"],
  },
  { key: "communication", label: "Communication", criteriaKeys: ["communication"] },
  { key: "sales_qualification", label: "Sales Qualification", criteriaKeys: ["sales_qualification"] },
  {
    key: "closing_next_step",
    label: "Closing / Next Step",
    criteriaKeys: ["next_step_management"],
  },
];

const hiddenFacts: HiddenFacts = {
  variantPreference: "Wants the higher/top variant with all available features",
  replacementReason: "Replacing an existing SUV",
  financing: "Will finance part of the purchase",
  timelineFlexibility: "Timeline is firm-ish — does not want to wait months",
  colourFlexibility: "Will NOT compromise on white under any circumstances",
};

const objections: Objection[] = [
  {
    key: "guaranteed_delivery",
    stage: "HANDLING_DELIVERY_QUESTION",
    prompt: "Can you guarantee delivery within three weeks?",
  },
  {
    key: "white_unavailable",
    stage: "HANDLING_DELIVERY_QUESTION",
    prompt: "What if the white one isn't available?",
  },
  {
    key: "refuses_other_colour",
    stage: "CUSTOMER_OBJECTION",
    prompt: "I don't want to compromise on the colour. I've already decided on white.",
  },
];

// Each turn optionally carries the SCRIPTED-mode replay data described in
// CLAUDE.md: which Judgment Engine captures it reveals, and the simulated
// customer satisfaction value after it. The 13 satisfaction checkpoints below
// reproduce the demo sequence from CLAUDE.md exactly: 30,40,48,56,62,66,55,
// 64,70,58,76,80,92. The 9 captures each appear on the turn that naturally
// reveals them.
const goldenTranscript: GoldenTranscriptTurn[] = [
  {
    stage: "CALL_OPENING",
    speaker: "LEARNER",
    text: "Hello, this is Aarav from Mahindra. How may I help you today?",
  },
  {
    stage: "CALL_OPENING",
    speaker: "CUSTOMER",
    text: "Hi Aarav. I'm planning to buy the Mahindra EV 9S. I would like to take delivery within the next three weeks, and I'm specifically looking for a white car.",
    captures: [
      { key: "vehicle_identified", value: "EV 9S" },
      { key: "colour_timeline", value: "White · 3 wks" },
    ],
    satisfactionAfter: 30,
  },
  {
    stage: "CALL_OPENING",
    speaker: "LEARNER",
    text: "Sure, Mr. Sharma. I can help you with that. Let me understand your requirements so I can check the most suitable option and delivery availability for you.",
    criteriaMet: [
      {
        key: "product_understanding",
        evidence: "Acknowledged the EV 9S requirement and moved to confirm the customer's needs.",
      },
    ],
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "CUSTOMER",
    text: "I'm looking for the higher variant, preferably with all the features. But my main concern is whether I can get a white car delivered within three weeks.",
    captures: [{ key: "variant_discovered", value: "Higher, loaded" }],
    satisfactionAfter: 40,
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "LEARNER",
    text: "Understood. Is the three-week timeline fixed, or would you have some flexibility if the preferred configuration isn't immediately available?",
    captures: [{ key: "timeline_probed", value: "Flexibility" }],
    criteriaMet: [
      {
        key: "requirement_discovery",
        evidence: "Probed the preferred variant, colour, and the firmness of the delivery timeline.",
      },
    ],
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "CUSTOMER",
    text: "Three weeks is what I'm targeting. I don't want to wait for months.",
    satisfactionAfter: 48,
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "LEARNER",
    text: "Got it. May I also understand whether you're replacing an existing vehicle or buying an additional car?",
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "CUSTOMER",
    text: "I'm replacing my existing SUV.",
    captures: [{ key: "need_identified", value: "Replacing SUV" }],
    criteriaMet: [
      {
        key: "customer_need_identification",
        evidence: "Learned the customer is replacing an existing SUV, not buying an additional car.",
      },
    ],
    satisfactionAfter: 56,
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "LEARNER",
    text: "And are you planning to finance the vehicle or make the purchase outright?",
  },
  {
    stage: "CUSTOMER_DISCOVERY",
    speaker: "CUSTOMER",
    text: "I'll probably finance part of it.",
    captures: [{ key: "qualification", value: "Part-finance" }],
    criteriaMet: [
      {
        key: "sales_qualification",
        evidence: "Confirmed the customer intends to finance part of the purchase.",
      },
    ],
    satisfactionAfter: 62,
  },
  {
    stage: "HANDLING_DELIVERY_QUESTION",
    speaker: "CUSTOMER",
    text: "The important thing for me is the white colour. Can you guarantee delivery within three weeks?",
    satisfactionAfter: 66,
  },
  {
    stage: "HANDLING_DELIVERY_QUESTION",
    speaker: "LEARNER",
    text: "I don't want to promise a delivery date before confirming the exact variant, colour availability and allocation. I can check the current availability and expected allocation for the white variant and give you a realistic delivery commitment.",
    captures: [{ key: "no_unsupported_promise", value: "Delivery" }],
    criteriaMet: [
      {
        key: "delivery_handling",
        evidence: "Declined to guarantee a delivery date before confirming availability.",
      },
    ],
    satisfactionAfter: 55,
  },
  {
    stage: "HANDLING_DELIVERY_QUESTION",
    speaker: "CUSTOMER",
    text: "Okay. What if the white one isn't available?",
    satisfactionAfter: 64,
  },
  {
    stage: "HANDLING_DELIVERY_QUESTION",
    speaker: "LEARNER",
    text: "If white isn't available within your timeline, I can check whether another white vehicle is already allocated or available from another nearby location. We can also discuss alternative configurations if you're open to them.",
    satisfactionAfter: 70,
  },
  {
    stage: "CUSTOMER_OBJECTION",
    speaker: "CUSTOMER",
    text: "I don't want to compromise on the colour. I've already decided on white.",
    satisfactionAfter: 58,
  },
  {
    stage: "CUSTOMER_OBJECTION",
    speaker: "LEARNER",
    text: "Understood. In that case, I'll keep white as the primary requirement and work around the availability of the exact configuration rather than suggesting a different colour.",
    captures: [{ key: "objection_handled", value: "White kept" }],
    criteriaMet: [
      {
        key: "objection_handling",
        evidence: "Kept white as the primary requirement instead of suggesting a different colour.",
      },
    ],
    satisfactionAfter: 76,
  },
  {
    stage: "CUSTOMER_OBJECTION",
    speaker: "CUSTOMER",
    text: "That's good. What do you need from me?",
    satisfactionAfter: 80,
  },
  {
    stage: "CUSTOMER_OBJECTION",
    speaker: "LEARNER",
    text: "I'll need to confirm the preferred variant, your location, and your expected purchase date. Once I check availability, I can explain the booking process, expected delivery timeline and financing options.",
  },
  {
    stage: "CLOSING_SIMULATION",
    speaker: "CUSTOMER",
    text: "Okay. I want to proceed if you can get me the white car within three weeks.",
  },
  {
    stage: "CLOSING_SIMULATION",
    speaker: "LEARNER",
    text: "Absolutely. I'll check the availability and allocation status for the white EV 9S and come back to you with the most accurate delivery timeline. If the configuration is available, we can proceed with the booking immediately.",
    captures: [{ key: "next_step_agreed", value: "Follow-up" }],
    criteriaMet: [
      {
        key: "next_step_management",
        evidence: "Committed to checking availability and following up with a concrete next step.",
      },
      {
        key: "customer_satisfaction",
        evidence: "Customer agreed to proceed, ending the call on a high note.",
      },
    ],
    satisfactionAfter: 92,
  },
  {
    stage: "CLOSING_SIMULATION",
    speaker: "CUSTOMER",
    text: "Perfect. Please get back to me as soon as possible.",
  },
  {
    stage: "CLOSING_SIMULATION",
    speaker: "LEARNER",
    text: "Certainly, Mr. Sharma. Thank you for your time. I'll follow up with you shortly.",
    criteriaMet: [
      {
        key: "communication",
        evidence: "Maintained a clear, professional tone throughout the call, including the close.",
      },
    ],
  },
];

const moduleTitles = [
  "Understanding the Automotive Buyer",
  "Product Walkaround Essentials",
  "Needs-Based Discovery Questions",
  "Handling Price & Delivery Objections",
  "Financing & Trade-In Basics",
  "Building Rapport on the Phone",
  "Closing Techniques",
  "Post-Sale Follow-Up",
];

async function main() {
  // Clear demo data (dev-only, idempotent reseed).
  await prisma.capabilityReport.deleteMany();
  await prisma.criterionResult.deleteMany();
  await prisma.capture.deleteMany();
  await prisma.turn.deleteMany();
  await prisma.simSession.deleteMany();
  await prisma.liveTask.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const learner = await prisma.user.create({
    data: {
      name: "Aarav Mehta",
      email: "aarav@demo.in",
      passwordHash,
      role: "LEARNER",
      team: "Sales User · Automotive Sales Team",
      avatarInitials: "AM",
      avatarColor: "#F59E0B",
    },
  });

  const trainer = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "trainer@demo.in",
      passwordHash,
      role: "TRAINER",
      team: "Learning & Development",
      avatarInitials: "PN",
      avatarColor: "#1450A3",
    },
  });

  const course = await prisma.course.create({
    data: {
      title: "Basic Training Package",
      subtitle: "Automotive Sales Fundamentals",
      moduleCount: moduleTitles.length,
      modules: {
        create: moduleTitles.map((title, index) => ({ order: index + 1, title })),
      },
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: course.id,
      completedModules: moduleTitles.length,
      status: "COMPLETED",
    },
  });

  const assessment = await prisma.assessment.create({
    data: {
      courseId: course.id,
      title: "Final Assessment",
      questionCount: 25,
      passMark: 70,
    },
  });

  await prisma.assessmentAttempt.create({
    data: {
      userId: learner.id,
      assessmentId: assessment.id,
      score: 80,
      passed: true,
    },
  });

  const scenario = await prisma.scenario.create({
    data: {
      title: "Mahindra EV 9S Purchase",
      product: "Mahindra EV 9S",
      customerName: "Rajesh Sharma",
      customerInitials: "RS",
      customerPersona:
        "An Indian car buyer calling about the Mahindra EV 9S. Decisive and time-pressed, firm on colour, open to discussing variant and financing once his core requirement is respected.",
      requirement: "Mahindra EV 9S",
      intent: "Purchase within 3 weeks",
      preferredColour: "White",
      objective: "Understand customer requirements and guide the customer toward purchase/delivery",
      openingLine:
        "Hi Aarav. I'm planning to buy the Mahindra EV 9S. I would like to take delivery within the next three weeks, and I'm specifically looking for a white car.",
      hiddenFacts: JSON.stringify(hiddenFacts),
      objections: JSON.stringify(objections),
      stages: JSON.stringify(stages),
      captureDefinitions: JSON.stringify(captureDefinitions),
      rubric: JSON.stringify(rubric),
      capabilityDimensions: JSON.stringify(capabilityDimensions),
      // SCRIPTED: this is the golden demo scenario (matches the video, used
      // for e2e tests and the ?autoplay=1 demo flow). Flip to "GUIDED" to
      // exercise the live AI persona/coach path with a real ANTHROPIC_API_KEY.
      mode: "SCRIPTED",
      goldenTranscript: JSON.stringify(goldenTranscript),
      satisfactionStart: 30,
    },
  });

  await prisma.liveTask.create({
    data: {
      scenarioId: scenario.id,
      assigneeId: learner.id,
      assignedById: trainer.id,
      status: "ASSIGNED",
    },
  });

  console.log("Seed complete:");
  console.log(`  Learner: ${learner.email} / demo1234`);
  console.log(`  Trainer: ${trainer.email} / demo1234`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
