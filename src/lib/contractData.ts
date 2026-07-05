/**
 * Server-side contract reads for Next.js server components.
 * Calls the deployed MandorlaSharedDecision contract on Studionet.
 */

import type { Case, Evidence, FinalResult } from "./types";

const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";
const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0xfB8cecc8B11f7Fc8CE899B0bcAA183dEaC9390FB";
// Read-only caller — any address works for view calls
const READER = "0x0C9479670628D38E72754C3cc5aB8C56C8EbB0E9";

async function genCall(functionName: string, args: unknown[] = []): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createClient, createAccount } = await import("genlayer-js") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { studionet } = await import("genlayer-js/chains") as any;
  const account = createAccount();
  const client = createClient({ chain: studionet, account });
  const result: string = await client.readContract({
    address: CONTRACT,
    functionName,
    args,
    account: READER,
  });
  return result;
}

export async function getCaseCount(): Promise<number> {
  try {
    const result = await genCall("get_case_count");
    return Number(result);
  } catch {
    return 0;
  }
}

export async function getCaseById(caseId: number): Promise<Case | null> {
  try {
    const raw = await genCall("get_case", [caseId]);
    const c = JSON.parse(raw);
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
  const cases = await Promise.all(ids.map(getCaseById));
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
