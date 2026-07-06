/**
 * Seed script — populates MandorlaSharedDecision with 3 real cases on Studionet.
 *
 * Prerequisites:
 *   1. Fund CLAIMANT address via https://studio.genlayer.com 💧 faucet
 *   2. npm install (in this dir)
 *   3. npx ts-node --project tsconfig.json seed.ts
 *
 * Set env vars before running:
 *   GENLAYER_PRIVATE_KEY    — claimant private key (deployer wallet, already funded)
 *   GENLAYER_RESPONDENT_KEY — respondent private key (generate a fresh one, fund via faucet)
 *
 * Both keys are stored in contract/.env (gitignored).
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = process.env.GENLAYER_CONTRACT_ADDRESS ?? "0x7e01d89d0DE540bf3742af8Fc2Fe538fb8661C19";

const CLAIMANT_KEY = (process.env.GENLAYER_PRIVATE_KEY ?? "") as `0x${string}`;
const RESPONDENT_KEY = (process.env.GENLAYER_RESPONDENT_KEY ?? "") as `0x${string}`;

if (!CLAIMANT_KEY || !RESPONDENT_KEY) {
  console.error("Set GENLAYER_PRIVATE_KEY and GENLAYER_RESPONDENT_KEY before running.");
  process.exit(1);
}

const claimant = createAccount(CLAIMANT_KEY);
const respondent = createAccount(RESPONDENT_KEY);

const clientA = createClient({ chain: studionet, account: claimant });
const clientB = createClient({ chain: studionet, account: respondent });

const NOW_SECS = Math.floor(Date.now() / 1000);
const IN_7_DAYS = NOW_SECS + 7 * 86400;
const IN_14_DAYS = NOW_SECS + 14 * 86400;

async function write(client: typeof clientA, fn: string, args: unknown[]) {
  const hash: any = await client.writeContract({
    address: CONTRACT,
    functionName: fn,
    args,
  });
  const receipt: any = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 60,
    interval: 4000,
  });
  const execResult = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
  if (execResult !== "SUCCESS") {
    const stderr = receipt.consensus_data?.leader_receipt?.[0]?.genvm_result?.stderr ?? "";
    throw new Error(`${fn} failed on-chain (execution_result: ${execResult})\n${stderr}`);
  }
  return hash;
}

async function createCase(client: typeof clientA, args: unknown[]): Promise<number> {
  await write(client, "create_case", args);
  const count = await read("get_case_count");
  return Number(count);
}

async function read(fn: string, args: unknown[] = []) {
  const result: string = await clientA.readContract({
    address: CONTRACT,
    functionName: fn,
    args,
  });
  return result;
}

async function main() {
  console.log("\n⚖  Mandorla Seed — Studionet\n");
  console.log("Claimant: ", claimant.address);
  console.log("Respondent:", respondent.address);
  console.log("Contract:  ", CONTRACT);
  console.log();

  await clientA.initializeConsensusSmartContract();

  // ── Case 1: Freelance web redesign (will go to ready_for_resolution) ─────────
  console.log("Creating Case 1: Website Redesign Dispute…");
  const case1Id = await createCase(clientA, [
    "Website Redesign — Partial Delivery",
    "freelance_delivery",
    respondent.address,
    "Full website redesign for 3,200 GEN. Scope: 7 pages, responsive design, CMS handoff.",
    "I delivered the complete design system and 4 of the 7 agreed pages before the client began changing the scope mid-project. The responsive build for those 4 pages is fully functional.",
    "Full payment of 3,200 GEN for substantial completion per original scope",
    3200,
    "GEN",
    IN_7_DAYS,
    IN_14_DAYS,
  ]);
  console.log("  Case 1 created:", case1Id);

  console.log("  Respondent responding to Case 1…");
  await write(clientB, "respond_to_case", [
    case1Id,
    "Only 4 of 7 pages were delivered and the responsive build is missing entirely from all pages. The CMS was never handed off. The original scope was clear and payment is conditional on full delivery.",
    "Refund of 2,000 GEN — 1,200 GEN for partial work completed",
  ]);

  console.log("  Submitting evidence for Case 1…");
  await write(clientA, "submit_evidence", [
    case1Id, "claimant", "work_output",
    "Figma Design File — Complete System",
    "Full design system including typography, colour tokens, component library, and 4 completed page designs with all states documented.",
    "https://figma.com/file/mandorla-redesign",
    "",
    "Proves substantial design delivery was completed",
  ]);
  await write(clientB, "submit_evidence", [
    case1Id, "respondent", "agreement",
    "Original Project Contract",
    "Signed contract specifying 7 pages, fully responsive, with CMS Webflow handoff as explicit deliverables. No partial delivery clause.",
    "",
    "",
    "Defines the full agreed scope and deliverables",
  ]);
  await write(clientA, "submit_evidence", [
    case1Id, "neutral", "message_thread",
    "Slack Thread — Scope Change Request",
    "Client requested addition of e-commerce functionality 3 weeks into the project. Designer declined without a change order. Shows the scope was contested mid-project.",
    "",
    "",
    "Relevant to whether scope change contributed to partial delivery",
  ]);

  console.log("  Advancing Case 1 to ready_for_resolution…");
  await write(clientA, "advance_to_ready", [case1Id]);
  console.log("  Case 1 ready for resolution ✓\n");

  // ── Case 2: DAO grant milestone dispute (evidence open) ────────────────────
  console.log("Creating Case 2: DAO Grant Milestone Dispute…");
  const case2Id = await createCase(clientA, [
    "DAO Grant — Milestone 2 Payment",
    "grant_milestone",
    respondent.address,
    "10,000 GEN grant for building a public goods tool. Milestone 2: functional prototype with at least 100 test users.",
    "The prototype was shipped on time. We had 147 test users over 3 weeks as documented in our public analytics dashboard. The milestone criteria are objectively met.",
    "Release of Milestone 2 payment: 4,000 GEN",
    4000,
    "GEN",
    IN_7_DAYS,
    IN_14_DAYS,
  ]);
  console.log("  Case 2 created:", case2Id);

  console.log("  Respondent responding to Case 2…");
  await write(clientB, "respond_to_case", [
    case2Id,
    "The 147 test users include 89 internal team members and automated bot accounts. Real external users number only 58, below the 100 threshold. The milestone was not met in spirit.",
    "Conditional approval — pay 2,000 GEN now, remaining 2,000 GEN after 30 more verified external users",
  ]);

  console.log("  Submitting evidence for Case 2…");
  await write(clientA, "submit_evidence", [
    case2Id, "claimant", "public_url",
    "Analytics Dashboard — Public Link",
    "PostHog analytics showing 147 unique users, session recordings, and geographic distribution across 12 countries. User signup required email verification.",
    "https://app.posthog.com/shared/mandorla-grant-analytics",
    "",
    "Verifiable public proof of 147 registered users",
  ]);
  await write(clientB, "submit_evidence", [
    case2Id, "respondent", "message_thread",
    "Discord Thread — Test Users Recruitment",
    "Grant team posted test user requests in their own Discord (340 members, mostly team affiliates). Raises question of independent external user composition.",
    "",
    "",
    "Context for how test users were recruited",
  ]);
  console.log("  Case 2 in evidence_open ✓\n");

  // ── Case 3: Token vesting dispute (resolved) ────────────────────────────────
  console.log("Creating Case 3: Token Vesting — Early Termination…");
  const case3Id = await createCase(clientA, [
    "Token Vesting — Early Termination Dispute",
    "dao_compensation",
    respondent.address,
    "2-year token vesting for lead developer. 4,500 GEN total, monthly cliff unlocks. Developer left after 14 months citing hostile work environment.",
    "I completed 14 of 24 months and left due to documented harassment from the co-founder. My departure was for cause on the company's side, not voluntary. I am owed 14/24ths of the total plus a hostile termination premium.",
    "Payment of 3,500 GEN (14/24 × 6,000 GEN adjusted for hostile termination)",
    4500,
    "GEN",
    IN_7_DAYS,
    IN_14_DAYS,
  ]);
  console.log("  Case 3 created:", case3Id);

  console.log("  Respondent responding to Case 3…");
  await write(clientB, "respond_to_case", [
    case3Id,
    "Developer voluntarily resigned. The alleged harassment was a single critical performance review. No formal HR complaint was ever filed. Per the vesting agreement, voluntary departure forfeits unvested tokens.",
    "Payment of 2,625 GEN (14/24 pro-rata only, no premium, per contract terms)",
  ]);

  console.log("  Submitting evidence for Case 3…");
  await write(clientA, "submit_evidence", [
    case3Id, "claimant", "message_thread",
    "Telegram Messages — Co-founder Conduct",
    "13 months of Telegram messages showing escalating personal attacks, threats, and exclusion from key decisions by the co-founder toward the developer.",
    "",
    "",
    "Documents the hostile environment that made the role untenable",
  ]);
  await write(clientB, "submit_evidence", [
    case3Id, "respondent", "agreement",
    "Vesting Agreement — Clause 7.2",
    "Signed vesting agreement clause 7.2: voluntary resignation forfeits all unvested tokens. No hostile termination clause exists in the contract.",
    "",
    "",
    "Defines the contractual basis for forfeiture",
  ]);
  await write(clientA, "submit_evidence", [
    case3Id, "claimant", "expert_note",
    "Legal Opinion — Constructive Dismissal",
    "Independent legal note stating that documented sustained personal attacks by a founder can constitute constructive dismissal even without a formal HR complaint in many jurisdictions.",
    "",
    "",
    "Legal framing that supports the hostile termination claim",
  ]);

  console.log("  Advancing Case 3 to ready and requesting resolution…");
  await write(clientA, "advance_to_ready", [case3Id]);
  console.log("  Requesting GenLayer resolution for Case 3 (this may take 30-90s)…");
  await write(clientA, "request_resolution", [case3Id]);
  console.log("  Case 3 resolved ✓\n");

  // ── Summary ─────────────────────────────────────────────────────────────────
  const count = await read("get_case_count");
  console.log("═══════════════════════════════════════");
  console.log(`Total cases on chain: ${count}`);
  console.log(`Case 1 (CASE-${String(case1Id).padStart(4,"0")}): ready_for_resolution — Website Redesign`);
  console.log(`Case 2 (CASE-${String(case2Id).padStart(4,"0")}): evidence_open        — DAO Grant Milestone`);
  console.log(`Case 3 (CASE-${String(case3Id).padStart(4,"0")}): resolved             — Token Vesting`);
  console.log("\nApp is now live with real on-chain data:");
  console.log("  https://mandorla.vercel.app");
  console.log("═══════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
