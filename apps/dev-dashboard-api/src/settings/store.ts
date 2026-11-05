import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DATA_DIR } from "../config.js";

const credentialSchema = z.object({
  baseUrl: z.string().url(),
  email: z.string().email(),
  apiToken: z.string().min(1),
});
export type Credential = z.infer<typeof credentialSchema>;

const storeSchema = z.object({
  jira: credentialSchema.optional(),
  confluence: credentialSchema.optional(),
});
type Store = z.infer<typeof storeSchema>;

const FILE = path.join(DATA_DIR, "integrations.json");

function readStore(): Store {
  if (!existsSync(FILE)) return {};
  try {
    return storeSchema.parse(JSON.parse(readFileSync(FILE, "utf8")));
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, null, 2), "utf8");
}

function envFallback(kind: "jira" | "confluence"): Credential | undefined {
  const prefix = kind.toUpperCase();
  const baseUrl = process.env[`${prefix}_BASE_URL`];
  const email = process.env[`${prefix}_EMAIL`];
  const apiToken = process.env[`${prefix}_API_TOKEN`];
  if (!baseUrl || !email || !apiToken) return undefined;
  const parsed = credentialSchema.safeParse({ baseUrl, email, apiToken });
  return parsed.success ? parsed.data : undefined;
}

export function getCredential(kind: "jira" | "confluence"): Credential | undefined {
  return readStore()[kind] ?? envFallback(kind);
}

export function setCredential(kind: "jira" | "confluence", credential: Credential): void {
  const store = readStore();
  store[kind] = credential;
  writeStore(store);
}

export function clearCredential(kind: "jira" | "confluence"): void {
  const store = readStore();
  delete store[kind];
  writeStore(store);
}
