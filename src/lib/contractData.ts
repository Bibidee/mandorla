/**
 * Server-side contract reads for Next.js server components.
 * Calls the deployed MandorlaSharedDecision contract on Studionet.
 * This file must only run on the server.
 */
import "server-only";

import type { Case, Evidence, FinalResult } from "./types";

const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";
const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x7e01d89d0DE540bf3742af8Fc2Fe538fb8661C19";
// Read-only caller — any address works for view calls
const READER = "0x0C9479670628D38E72754C3cc5aB8C56C8EbB0E9";

async function genCall(functionName: string, args: unknown[] = [], retries = 3): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createClient, createAccount } = await import("genlayer-js") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { studionet } = await import("genlayer-js/chains") as any;
  const account = createAccount();
  const client = createClient({ chain: studionet, account });
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result: string = await client.readContract({
        address: CONTRACT,
        functionName,
        args,
        account: READER,
      });
      return result;
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function batchedMap<T>(ids: number[], fn: (id: number) => Promise<T>, concurrency = 5): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const batch = await Promise.all(chunk.map(fn));
    results.push(...batch);
  }
  return results;
}

export async function getCaseCount(): Promise<number> {
  try {
    const result = await genCall("get_case_count");
    return Number(result);
  } catch {
    return 0;
  }
}

function fixCaseDates(c: any) {
  // Contract stores unix seconds; JS Date expects milliseconds
  if (typeof c.created_at === "number") c.created_at = new Date(c.created_at * 1000).toISOString();
  if (typeof c.evidence_deadline === "number") c.evidence_deadline = new Date(c.evidence_deadline * 1000).toISOString();
  if (typeof c.resolution_deadline === "number") c.resolution_deadline = new Date(c.resolution_deadline * 1000).toISOString();
  return c;
}

export async function getCaseById(caseId: number): Promise<Case | null> {
  try {
    const raw = await genCall("get_case", [caseId]);
    const c = fixCaseDates(JSON.parse(raw));
    if (c.final_result_json) {
      c.final_result = JSON.parse(c.final_result_json);
      delete c.final_result_json;
    }
    return c as Case;
  } catch {
    return null;
  }
}

export async function getCaseEvidenceById(caseId: number): Promise<Evidence[]> {
  try {
    const raw = await genCall("get_case_evidence", [caseId]);
    return JSON.parse(raw) as Evidence[];
  } catch {
    return [];
  }
}

export async function getFinalResultById(caseId: number): Promise<FinalResult | null> {
  try {
    const raw = await genCall("get_final_result", [caseId]);
    return JSON.parse(raw) as FinalResult;
  } catch {
    return null;
  }
}

export async function getAllCases(): Promise<Case[]> {
  const count = await getCaseCount();
  if (count === 0) return [];
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const cases = await batchedMap(ids, getCaseById, 5);
  return cases.filter(Boolean) as Case[];
}

export async function getCaseWithEvidence(caseId: number): Promise<{ c: Case; evidence: Evidence[] } | null> {
  const [c, evidence] = await Promise.all([
    getCaseById(caseId),
    getCaseEvidenceById(caseId),
  ]);
  if (!c) return null;
  return { c: { ...c, evidence }, evidence };
}
