import type {
  CaptureDefinition,
  CapabilityDimensionDef,
  RubricCriterion,
  Stage,
} from "@parishodh/shared";

/**
 * Fixed, product-agnostic structure shared by every trainer-created
 * scenario. Keeping stages/captures/rubric/dimensions deterministic (rather
 * than asking the AI to invent a whole new rubric per scenario) means every
 * generated scenario stays compatible with the existing live-call pipeline,
 * the Judgment Engine, and the capability report -- only the per-scenario
 * content (persona, hidden facts, objections) is generated.
 */

export const STAGES: Stage[] = [
  { key: "CALL_OPENING", label: "Call Opening" },
  { key: "CUSTOMER_DISCOVERY", label: "Customer Discovery" },
  { key: "HANDLING_DELIVERY_QUESTION", label: "Handling the Delivery Question" },
  { key: "CUSTOMER_OBJECTION", label: "Customer Objection" },
  { key: "CLOSING_SIMULATION", label: "Closing the Simulation" },
];

export const CAPTURE_DEFINITIONS: CaptureDefinition[] = [
  {
    key: "product_identified",
    label: "Product identified",
    description: "The specific product/model the customer wants was identified.",
  },
  {
    key: "preference_timeline",
    label: "Preference & timeline",
    description: "The customer's key preference and delivery timeline were captured.",
  },
  {
    key: "variant_discovered",
    label: "Variant discovered",
    description: "The preferred configuration/trim level was discovered.",
  },
  {
    key: "timeline_probed",
    label: "Timeline probed",
    description: "Learner checked whether the timeline had any flexibility.",
  },
  {
    key: "need_identified",
    label: "Need identified",
    description: "The underlying reason for the purchase was identified.",
  },
  {
    key: "qualification",
    label: "Qualification",
    description: "Financing vs. outright purchase intent was captured.",
  },
  {
    key: "no_unsupported_promise",
    label: "No unsupported promise",
    description: "Learner avoided promising an unconfirmed delivery/availability date.",
  },
  {
    key: "objection_handled",
    label: "Objection handled",
    description: "The customer's main objection was handled without over-promising.",
  },
  {
    key: "next_step_agreed",
    label: "Next step agreed",
    description: "A clear follow-up/next step was agreed with the customer.",
  },
];

export const RUBRIC: RubricCriterion[] = [
  {
    criterionKey: "product_understanding",
    title: "Product Understanding",
    question: "Did the learner understand the customer's product requirement?",
    weight: 10,
  },
  {
    criterionKey: "requirement_discovery",
    title: "Requirement Discovery",
    question: "Did he identify the key configuration, preference, and timeline?",
    weight: 15,
  },
  {
    criterionKey: "customer_need_identification",
    title: "Customer Need Identification",
    question: "Did he understand why the customer needs this product?",
    weight: 10,
  },
  {
    criterionKey: "delivery_handling",
    title: "Delivery Handling",
    question: "Did he avoid making an unsupported delivery/availability promise?",
    weight: 15,
  },
  {
    criterionKey: "objection_handling",
    title: "Objection Handling",
    question: "Did he respond appropriately to the customer's main concern?",
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

export const CAPABILITY_DIMENSIONS: CapabilityDimensionDef[] = [
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
  { key: "closing_next_step", label: "Closing / Next Step", criteriaKeys: ["next_step_management"] },
];

export const DEFAULT_SATISFACTION_START = 30;
