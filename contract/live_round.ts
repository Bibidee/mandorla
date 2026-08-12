/** Execute the complete authenticated-evidence and GEN-escrow lifecycle on Studionet. */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT = process.env.GENLAYER_CONTRACT_ADDRESS ?? "0xD7CAFCbb6e0C4944b95BEf1ee6f0AA0f2abeBF99";
const claimant = createAccount(process.env.GENLAYER_PRIVATE_KEY as `0x${string}`);
const respondent = createAccount(process.env.GENLAYER_RESPONDENT_KEY as `0x${string}`);
const clientA = createClient({ chain: studionet, account: claimant });
const clientB = createClient({ chain: studionet, account: respondent });
const CLAIMANT_SOURCE = "https://raw.githubusercontent.com/Bibidee/mandorla/main/contract/evidence/demo_claimant_delivery.txt";
const RESPONDENT_SOURCE = "https://raw.githubusercontent.com/Bibidee/mandorla/main/contract/evidence/demo_respondent_confirmation.txt";
const CLAIMANT_HASH = "762285188867a828368965080971285312c13dfb65f64a2baf424a4b90d6cdcc";
const RESPONDENT_HASH = "caa958ee7c8ca80f1f799d01fc4f1ec23807ad58fc53314e8e94642a3fdef693";

async function write(client: typeof clientA, functionName: string, args: unknown[], value?: bigint) {
  const hash: any = await client.writeContract({ address: CONTRACT, functionName, args, value });
  const receipt: any = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, retries: 90, interval: 4000 });
  const result = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
  if (result !== "SUCCESS") throw new Error(`${functionName} failed: ${result}\n${receipt.consensus_data?.leader_receipt?.[0]?.genvm_result?.stderr ?? ""}`);
  console.log(`${functionName}: ${hash}`);
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  await write(clientA, "create_case", [
    "Live authenticated evidence and escrow round", "freelance_delivery", respondent.address,
    "One GEN redesign agreement for four pages. Three completed pages merit 75% payment.",
    "Three of four agreed pages were delivered and are usable; proportional payment is fair.",
    "Release 75% of the one GEN escrow.", 1, "GEN", now + 7 * 86400, now + 14 * 86400,
  ]);
  const caseId = Number(await clientA.readContract({ address: CONTRACT, functionName: "get_case_count", args: [] }));
  await write(clientB, "respond_to_case", [caseId, "I confirm three pages are usable and the dashboard is outstanding.", "Pay 75% and retain 25% for the dashboard."]);
  await write(clientA, "submit_evidence", [caseId, "claimant", "work_output", "Claimant delivery record", "Source-backed record of three delivered pages and one missing page.", CLAIMANT_SOURCE, CLAIMANT_HASH, "Authenticated delivery source"]);
  await write(clientB, "submit_evidence", [caseId, "respondent", "admission", "Respondent confirmation", "Source-backed confirmation of the three completed pages and one outstanding page.", RESPONDENT_SOURCE, RESPONDENT_HASH, "Authenticated confirmation source"]);
  await write(clientA, "fund_case", [caseId], BigInt(10) ** BigInt(18));
  await write(clientA, "advance_to_ready", [caseId]);
  await write(clientA, "request_resolution", [caseId]);
  const verdict = await clientA.readContract({ address: CONTRACT, functionName: "get_final_result", args: [caseId] });
  console.log(`verdict=${verdict}`);
  await write(clientA, "execute_settlement", [caseId]);
  const status = await clientA.readContract({ address: CONTRACT, functionName: "get_case_status", args: [caseId] });
  if (status !== "settled") throw new Error(`Expected settled status, received ${status}`);
  console.log(`COMPLETE case=${caseId} status=${status}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
