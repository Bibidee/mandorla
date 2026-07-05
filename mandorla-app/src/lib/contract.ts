/**
 * Mandorla contract integration via genlayer-js.
 *
 * Install: npm install genlayer-js
 * Set CONTRACT_ADDRESS in your .env.local:
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0xfB8cecc8B11f7Fc8CE899B0bcAA183dEaC9390FB
 *   NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — genlayer-js is an optional peer dep; install before connecting to a live network.

import type { FinalResult, Case, Evidence } from "./types";

// ─── Config ───────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";

// ─── Lazy client singleton (browser-only) ────────────────────────────────────

let _client: any = null;
let _account: any = null;

async function getClient() {
  if (_client) return { client: _client, account: _account };

  const { createClient, createAccount } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");

  _account = createAccount();
  _client = createClient({
    chain: studionet,
    account: _account,
  });

  await _client.initializeConsensusSmartContract();
  return { client: _client, account: _account };
}

// ─── Read views ───────────────────────────────────────────────────────────────

export async function getCase(caseId: number): Promise<Case> {
  const { client } = await getClient();
  const raw: string = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_case",
    args: [caseId],
  });
  const c = JSON.parse(raw);
  if (c.final_result_json) {
    c.final_result = JSON.parse(c.final_result_json);
  }
  return c as Case;
}

export async function getCaseEvidence(caseId: number): Promise<Evidence[]> {
  const { client } = await getClient();
  const raw: string = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_case_evidence",
    args: [caseId],
  });
  return JSON.parse(raw) as Evidence[];
}

export async function getFinalResult(caseId: number): Promise<FinalResult> {
  const { client } = await getClient();
  const raw: string = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_final_result",
    args: [caseId],
  });
  return JSON.parse(raw) as FinalResult;
}

export async function getCaseStatus(caseId: number): Promise<string> {
  const { client } = await getClient();
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_case_status",
    args: [caseId],
  });
}

export async function getCaseCount(): Promise<number> {
  const { client } = await getClient();
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_case_count",
    args: [],
  });
}

// ─── Write transactions ───────────────────────────────────────────────────────

export interface CreateCaseParams {
  case_title: string;
  case_type: string;
  respondent: string;
  agreement_summary: string;
  claimant_position: string;
  requested_outcome: string;
  amount_at_stake: number;
  asset_symbol: string;
  evidence_deadline: number; // unix timestamp
  resolution_deadline: number; // unix timestamp
}

export async function createCase(params: CreateCaseParams): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_case",
    args: [
      params.case_title,
      params.case_type,
      params.respondent,
      params.agreement_summary,
      params.claimant_position,
      params.requested_outcome,
      params.amount_at_stake,
      params.asset_symbol,
      params.evidence_deadline,
      params.resolution_deadline,
    ],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 50,
    interval: 3000,
  });

  return hash;
}

export interface RespondParams {
  case_id: number;
  respondent_position: string;
  counter_outcome: string;
}

export async function respondToCase(params: RespondParams): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "respond_to_case",
    args: [params.case_id, params.respondent_position, params.counter_outcome],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 50,
    interval: 3000,
  });

  return hash;
}

export interface SubmitEvidenceParams {
  case_id: number;
  side: "claimant" | "respondent" | "neutral";
  evidence_type: string;
  title: string;
  summary: string;
  url?: string;
  content_hash?: string;
  weight_hint: string;
}

export async function submitEvidence(params: SubmitEvidenceParams): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_evidence",
    args: [
      params.case_id,
      params.side,
      params.evidence_type,
      params.title,
      params.summary,
      params.url ?? "",
      params.content_hash ?? "",
      params.weight_hint,
    ],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 50,
    interval: 3000,
  });

  return hash;
}

export async function advanceToReady(caseId: number): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "advance_to_ready",
    args: [caseId],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 50,
    interval: 3000,
  });

  return hash;
}

export async function requestResolution(caseId: number): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  // Resolution runs a non-deterministic LLM prompt through validator consensus.
  // FINALIZED status means all validators have agreed on the canonical result.
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "request_resolution",
    args: [caseId],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 100,
    interval: 5000,
  });

  return hash;
}

export async function settleCase(caseId: number): Promise<string> {
  const { client } = await getClient();
  const { TransactionStatus } = await import("genlayer-js/types");

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "settle_case",
    args: [caseId],
  });

  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 50,
    interval: 3000,
  });

  return hash;
}
