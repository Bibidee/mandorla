"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x7e01d89d0DE540bf3742af8Fc2Fe538fb8661C19";

async function sendTx(functionName: string, args: any[]) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or Rabby.");
  const accounts: string[] = await eth.request({ method: "eth_accounts" });
  if (!accounts[0]) throw new Error("Connect your wallet first.");

  const walletAddress = accounts[0] as `0x${string}`;
  const { abi: glAbi, createClient, createAccount } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");
  const { TransactionStatus } = await import("genlayer-js/types");
  const { encodeFunctionData } = await import("viem");

  const calldata = glAbi.calldata.encode(
    glAbi.calldata.makeCalldataObject(functionName, args, undefined)
  );
  const txData = glAbi.transactions.serialize([calldata, false]);
  const consensusAddr = studionet.consensusMainContract!.address as `0x${string}`;
  const encodedData = encodeFunctionData({
    abi: studionet.consensusMainContract!.abi,
    functionName: "addTransaction",
    args: [
      walletAddress,
      CONTRACT as `0x${string}`,
      BigInt(studionet.defaultNumberOfInitialValidators),
      BigInt(studionet.defaultConsensusMaxRotations),
      txData as `0x${string}`,
    ],
  });

  const evmTxHash: `0x${string}` = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from: walletAddress, to: consensusAddr, data: encodedData }],
  });

  const readClient: any = createClient({ chain: studionet, account: createAccount() });
  const receipt: any = await readClient.waitForTransactionReceipt({
    hash: evmTxHash,
    status: TransactionStatus.FINALIZED,
    retries: 60,
    interval: 4000,
  });

  const exec = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
  if (exec !== "SUCCESS") {
    const stderr = receipt.consensus_data?.leader_receipt?.[0]?.genvm_result?.stderr ?? "";
    throw new Error(`Transaction failed: ${exec}\n${stderr}`);
  }
}

// ── Respond to Case ────────────────────────────────────────────────────────────

export function RespondButton({ caseId }: { caseId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ respondent_position: "", counter_outcome: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const inputCls = "bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20 w-full resize-none";

  async function submit() {
    if (!form.respondent_position.trim()) { setError("Position is required."); return; }
    if (!form.counter_outcome.trim()) { setError("Counter outcome is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await sendTx("respond_to_case", [caseId, form.respondent_position.trim(), form.counter_outcome.trim()]);
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-lg border border-lavender/30 text-parchment/70 text-sm hover:border-gold/40 hover:text-parchment transition-colors"
      >
        Add Respondent Truth
      </button>
    );
  }

  return (
    <div className="panel p-6 flex flex-col gap-4 border border-lavender/20">
      <h3 className="font-display text-lg text-parchment">Add the Other Truth</h3>
      {error && <p className="text-faultrose text-sm">{error}</p>}
      {submitting && <p className="text-gold text-sm">Waiting for wallet confirmation and finalization…</p>}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">Respondent Position</label>
        <textarea className={inputCls} rows={4} value={form.respondent_position} onChange={e => setForm(f => ({ ...f, respondent_position: e.target.value }))} placeholder="Your account of what happened" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">Counter Outcome</label>
        <textarea className={inputCls} rows={2} value={form.counter_outcome} onChange={e => setForm(f => ({ ...f, counter_outcome: e.target.value }))} placeholder="What outcome would you consider fair?" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-lavender/20 text-parchment/60 text-sm hover:border-lavender/40 transition-colors">Cancel</button>
        <button onClick={submit} disabled={submitting} className="px-5 py-2 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit Response"}
        </button>
      </div>
    </div>
  );
}

// ── Advance to Ready ───────────────────────────────────────────────────────────

export function AdvanceToReadyButton({ caseId }: { caseId: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handle() {
    setError(null);
    setSubmitting(true);
    try {
      await sendTx("advance_to_ready", [caseId]);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-faultrose text-sm">{error}</p>}
      {submitting && <p className="text-gold text-sm">Waiting for wallet confirmation and finalization…</p>}
      <button
        onClick={handle}
        disabled={submitting}
        className="px-5 py-2.5 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors disabled:opacity-60"
      >
        {submitting ? "Advancing…" : "Mark Ready for Resolution"}
      </button>
    </div>
  );
}
