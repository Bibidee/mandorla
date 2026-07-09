"use client";
import { useState } from "react";

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x7e01d89d0DE540bf3742af8Fc2Fe538fb8661C19";

const inputCls =
  "bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20 w-full";

export function EvidenceForm({ caseId }: { caseId: number }) {
  const [form, setForm] = useState({
    title: "",
    evidence_type: "agreement",
    side: "claimant",
    url: "",
    summary: "",
    weight_hint: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    const eth = (window as any).ethereum;
    if (!eth) { setError("No wallet found. Install MetaMask or Rabby."); return; }
    const accounts: string[] = await eth.request({ method: "eth_accounts" });
    if (!accounts[0]) { setError("Wallet not connected. Click 'Connect Wallet' first."); return; }
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.summary.trim()) { setError("Summary is required."); return; }

    setSubmitting(true);
    try {
      const walletAddress = accounts[0] as `0x${string}`;
      const { abi: glAbi, createClient, createAccount } = await import("genlayer-js");
      const { studionet } = await import("genlayer-js/chains");
      const { TransactionStatus } = await import("genlayer-js/types");
      const { encodeFunctionData } = await import("viem");

      const calldata = glAbi.calldata.encode(
        glAbi.calldata.makeCalldataObject("submit_evidence", [
          caseId,
          form.side,
          form.evidence_type,
          form.title.trim(),
          form.summary.trim(),
          form.url.trim(),
          "",
          form.weight_hint.trim(),
        ], undefined)
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

      setSuccess(true);
      setForm({ title: "", evidence_type: "agreement", side: "claimant", url: "", summary: "", weight_hint: "" });
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-faultrose/10 border border-faultrose/30 text-faultrose text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm">
          Evidence submitted. It will appear after the next page refresh.
        </div>
      )}
      {submitting && (
        <div className="px-4 py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm">
          Waiting for wallet confirmation and on-chain finalization…
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment/50 font-mono">Title</label>
          <input className={inputCls} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Evidence title" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment/50 font-mono">Type</label>
          <select className={inputCls} value={form.evidence_type} onChange={(e) => update("evidence_type", e.target.value)}>
            <option value="agreement">Agreement</option>
            <option value="message_thread">Message Thread</option>
            <option value="work_output">Work Output</option>
            <option value="payment_record">Payment Record</option>
            <option value="timeline">Timeline</option>
            <option value="screenshot">Screenshot</option>
            <option value="public_url">Public URL</option>
            <option value="expert_note">Expert Note</option>
            <option value="admission">Admission</option>
            <option value="counter_evidence">Counter Evidence</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment/50 font-mono">Side</label>
          <select className={inputCls} value={form.side} onChange={(e) => update("side", e.target.value)}>
            <option value="claimant">Claimant</option>
            <option value="respondent">Respondent</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment/50 font-mono">URL (optional)</label>
          <input className={inputCls} value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-parchment/50 font-mono">Summary</label>
          <textarea className={inputCls + " resize-none h-20"} value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="What does this evidence show?" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-parchment/50 font-mono">Why it matters</label>
          <input className={inputCls} value={form.weight_hint} onChange={(e) => update("weight_hint", e.target.value)} placeholder="Why should validators weight this evidence?" />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit Evidence"}
          </button>
        </div>
      </div>
    </div>
  );
}
