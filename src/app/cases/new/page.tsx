"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x7e01d89d0DE540bf3742af8Fc2Fe538fb8661C19";

async function submitCreateCase(form: Record<string, any>): Promise<number> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or Rabby.");

  const accounts: string[] = await eth.request({ method: "eth_accounts" });
  if (!accounts[0]) throw new Error("Wallet not connected. Click 'Connect Wallet' first.");

  if (!form.case_title.trim()) throw new Error("Case title is required.");
  if (form.claimant_position.trim().length < 10) throw new Error("Claimant position must be at least 10 characters.");
  if (!form.agreement_summary.trim()) throw new Error("Agreement summary is required.");
  if (!form.evidence_deadline || !form.resolution_deadline) throw new Error("Both deadlines are required.");

  const evidenceDeadline = Math.floor(new Date(form.evidence_deadline).getTime() / 1000);
  const resolutionDeadline = Math.floor(new Date(form.resolution_deadline).getTime() / 1000);
  if (evidenceDeadline >= resolutionDeadline) throw new Error("Resolution deadline must be after evidence deadline.");

  const walletAddress = accounts[0] as `0x${string}`;

  const { abi: glAbi, createClient, createAccount } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");
  const { TransactionStatus } = await import("genlayer-js/types");
  const { encodeFunctionData } = await import("viem");

  // 1. Encode GenLayer calldata using the SDK's exported functions
  const calldata = glAbi.calldata.encode(
    glAbi.calldata.makeCalldataObject("create_case", [
      form.case_title.trim(),
      form.case_type,
      form.respondent.trim(),
      form.agreement_summary.trim(),
      form.claimant_position.trim(),
      form.requested_outcome.trim(),
      Number(form.amount_at_stake) || 0,
      form.asset_symbol,
      evidenceDeadline,
      resolutionDeadline,
    ], undefined)
  );
  const txData = glAbi.transactions.serialize([calldata, false]);

  // 2. Wrap in addTransaction ABI call to the consensus contract
  const consensusAddr = studionet.consensusMainContract!.address as `0x${string}`;
  const consensusAbi = studionet.consensusMainContract!.abi;
  const encodedData = encodeFunctionData({
    abi: consensusAbi,
    functionName: "addTransaction",
    args: [
      walletAddress,
      CONTRACT as `0x${string}`,
      BigInt(studionet.defaultNumberOfInitialValidators),
      BigInt(studionet.defaultConsensusMaxRotations),
      txData as `0x${string}`,
    ],
  });

  // 3. Send via injected wallet — MetaMask/Rabby pops up for signing
  const evmTxHash: `0x${string}` = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from: walletAddress, to: consensusAddr, data: encodedData }],
  });

  // 4. Wait for GenLayer finalization using a read-only client
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

  const count: any = await readClient.readContract({
    address: CONTRACT,
    functionName: "get_case_count",
    args: [],
  });
  return Number(count);
}

const STEPS = [
  { num: 1, label: "Case Frame" },
  { num: 2, label: "The Agreement" },
  { num: 3, label: "Your Truth" },
  { num: 4, label: "Possible Middle" },
  { num: 5, label: "Deadlines" },
  { num: 6, label: "Review" },
];

export default function NewCasePage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    case_title: "",
    case_type: "freelance_delivery",
    respondent: "",
    amount_at_stake: "",
    asset_symbol: "GEN",
    agreement_summary: "",
    expected_outcome: "",
    ambiguity: "",
    claimant_position: "",
    evidence_notes: "",
    requested_outcome: "",
    partial_payout: false,
    revision_acceptable: false,
    conditional_approval: false,
    should_not_happen: "",
    evidence_deadline: "",
    resolution_deadline: "",
  });

  const update = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-parchment/40 mb-1 uppercase tracking-wider">New Case</p>
        <h1 className="font-display text-3xl text-parchment">Open a Shared Case</h1>
        <p className="text-parchment/50 text-sm mt-2">Build a balanced brief. Both truths deserve space.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => step > s.num && setStep(s.num)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all",
                step === s.num
                  ? "bg-gold text-inkbrown font-medium"
                  : step > s.num
                  ? "bg-gold/20 text-gold cursor-pointer hover:bg-gold/30"
                  : "bg-plum text-parchment/30"
              )}
            >
              <span>{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={clsx("w-4 h-px", step > s.num ? "bg-gold/40" : "bg-lavender/10")} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-faultrose/10 border border-faultrose/30 text-faultrose text-sm">
          {error}
        </div>
      )}

      {submitting && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm">
          Waiting for wallet confirmation and on-chain finalization. This can take 30–60 seconds…
        </div>
      )}

      {/* Step content */}
      <div className="panel p-6 md:p-8">
        {step === 1 && <StepCaseFrame form={form} update={update} />}
        {step === 2 && <StepAgreement form={form} update={update} />}
        {step === 3 && <StepYourTruth form={form} update={update} />}
        {step === 4 && <StepPossibleMiddle form={form} update={update} />}
        {step === 5 && <StepDeadlines form={form} update={update} />}
        {step === 6 && <StepReview form={form} />}

        <div className="flex justify-between mt-8 pt-6 border-t border-lavender/10">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2 rounded-lg border border-lavender/20 text-parchment/60 text-sm hover:border-lavender/40 hover:text-parchment transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 6 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={async () => {
                setError(null);
                setSubmitting(true);
                try {
                  const caseId = await submitCreateCase(form);
                  router.push(`/cases/${caseId}`);
                } catch (e: any) {
                  setError(e.message ?? "Something went wrong.");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="px-6 py-2 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors gold-glow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create Case"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-parchment/50 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-parchment/30 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "bg-aubergine border border-lavender/20 rounded-lg px-3 py-2.5 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20 w-full";
const textareaCls = inputCls + " resize-none";

function StepCaseFrame({ form, update }: any) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-parchment">Case Frame</h2>
      <Field label="Case Title">
        <input className={inputCls} value={form.case_title} onChange={(e) => update("case_title", e.target.value)} placeholder="Brief description of the case" />
      </Field>
      <Field label="Case Type">
        <select className={inputCls} value={form.case_type} onChange={(e) => update("case_type", e.target.value)}>
          <option value="freelance_delivery">Freelance Delivery</option>
          <option value="dao_compensation">DAO Compensation</option>
          <option value="grant_milestone">Grant Milestone</option>
          <option value="community_conflict">Community Conflict</option>
          <option value="shared_fault_claim">Shared Fault Claim</option>
          <option value="conditional_approval">Conditional Approval</option>
          <option value="custom">Custom</option>
        </select>
      </Field>
      <Field label="Respondent Address">
        <input className={inputCls} value={form.respondent} onChange={(e) => update("respondent", e.target.value)} placeholder="0x..." />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount at Stake">
          <input className={inputCls} type="number" value={form.amount_at_stake} onChange={(e) => update("amount_at_stake", e.target.value)} placeholder="0" />
        </Field>
        <Field label="Asset">
          <select className={inputCls} value={form.asset_symbol} onChange={(e) => update("asset_symbol", e.target.value)}>
            <option value="GEN">GEN</option>
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function StepAgreement({ form, update }: any) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-parchment">The Agreement</h2>
      <p className="text-parchment/50 text-sm">Describe the shared context that both sides would agree on.</p>
      <Field label="What was agreed?" hint="The original arrangement or expectation.">
        <textarea className={textareaCls} rows={3} value={form.agreement_summary} onChange={(e) => update("agreement_summary", e.target.value)} placeholder="Describe the agreement both parties entered into..." />
      </Field>
      <Field label="What was expected?">
        <textarea className={textareaCls} rows={2} value={form.expected_outcome} onChange={(e) => update("expected_outcome", e.target.value)} placeholder="What outcomes were expected from this agreement?" />
      </Field>
      <Field label="What was left ambiguous?" hint="Honest about uncertainty earns credibility.">
        <textarea className={textareaCls} rows={2} value={form.ambiguity} onChange={(e) => update("ambiguity", e.target.value)} placeholder="What wasn't clearly defined or written down?" />
      </Field>
    </div>
  );
}

function StepYourTruth({ form, update }: any) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-parchment">Your Truth</h2>
      <p className="text-parchment/50 text-sm">State your position clearly. The respondent will add theirs.</p>
      <Field label="Claimant Position">
        <textarea className={textareaCls} rows={4} value={form.claimant_position} onChange={(e) => update("claimant_position", e.target.value)} placeholder="What is your account of what happened?" />
      </Field>
      <Field label="What evidence supports this?">
        <textarea className={textareaCls} rows={2} value={form.evidence_notes} onChange={(e) => update("evidence_notes", e.target.value)} placeholder="Describe the evidence you'll submit (files, messages, contracts...)" />
      </Field>
      <Field label="Requested Outcome">
        <textarea className={textareaCls} rows={2} value={form.requested_outcome} onChange={(e) => update("requested_outcome", e.target.value)} placeholder="What outcome would you consider fair?" />
      </Field>
    </div>
  );
}

function StepPossibleMiddle({ form, update }: any) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-parchment">Possible Middle</h2>
      <p className="text-parchment/50 text-sm leading-relaxed">
        Mandorla does not train users to always demand 100%. What middle outcomes would you accept?
      </p>
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={form.partial_payout} onChange={(e) => update("partial_payout", e.target.checked)} className="mt-0.5 accent-gold" />
          <div>
            <p className="text-sm text-parchment/80">Partial payout would be acceptable</p>
            <p className="text-xs text-parchment/40">A proportional release based on what was delivered</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={form.revision_acceptable} onChange={(e) => update("revision_acceptable", e.target.checked)} className="mt-0.5 accent-gold" />
          <div>
            <p className="text-sm text-parchment/80">Revision would solve the issue</p>
            <p className="text-xs text-parchment/40">The other party could correct the problem instead of paying</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={form.conditional_approval} onChange={(e) => update("conditional_approval", e.target.checked)} className="mt-0.5 accent-gold" />
          <div>
            <p className="text-sm text-parchment/80">Conditional approval would be fair</p>
            <p className="text-xs text-parchment/40">Accept with specific conditions attached</p>
          </div>
        </label>
      </div>
      <Field label="What should not happen?" hint="Hard limits — not preferences.">
        <textarea className={textareaCls} rows={2} value={form.should_not_happen} onChange={(e) => update("should_not_happen", e.target.value)} placeholder="What outcome would be clearly unjust in this case?" />
      </Field>
    </div>
  );
}

function StepDeadlines({ form, update }: any) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-parchment">Deadlines</h2>
      <p className="text-parchment/50 text-sm">Set windows for evidence and resolution.</p>
      <Field label="Evidence Deadline" hint="Both parties can submit evidence until this date.">
        <input className={inputCls} type="date" value={form.evidence_deadline} onChange={(e) => update("evidence_deadline", e.target.value)} />
      </Field>
      <Field label="Resolution Deadline" hint="Must be after the evidence deadline.">
        <input className={inputCls} type="date" value={form.resolution_deadline} onChange={(e) => update("resolution_deadline", e.target.value)} />
      </Field>
    </div>
  );
}

function StepReview({ form }: any) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl text-parchment">Review and Create</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-clay/10 rounded-xl p-5 border border-clay/20">
          <p className="text-xs font-mono text-clay mb-3 uppercase tracking-wider">Claimant Position</p>
          <p className="text-sm text-parchment/80 leading-relaxed mb-3">{form.claimant_position || "—"}</p>
          <div className="border-t border-clay/20 pt-3">
            <p className="text-xs text-parchment/40">Requested</p>
            <p className="text-sm text-parchment/70 mt-0.5">{form.requested_outcome || "—"}</p>
          </div>
        </div>
        <div className="bg-lavender/10 rounded-xl p-5 border border-lavender/20">
          <p className="text-xs font-mono text-lavender mb-3 uppercase tracking-wider">Respondent Reply</p>
          <p className="text-sm text-parchment/30 italic">Waiting for respondent to add their truth...</p>
        </div>
      </div>
      <div className="bg-gold/5 rounded-xl p-5 border border-gold/20">
        <p className="text-xs font-mono text-gold mb-3 uppercase tracking-wider">Potential Middle Outcomes</p>
        <div className="flex flex-wrap gap-2">
          {form.partial_payout && <span className="text-xs px-2 py-1 rounded bg-gold/20 text-gold/80">Partial Payout</span>}
          {form.revision_acceptable && <span className="text-xs px-2 py-1 rounded bg-apricot/20 text-apricot">Revision Acceptable</span>}
          {form.conditional_approval && <span className="text-xs px-2 py-1 rounded bg-lavender/20 text-lavender">Conditional Approval</span>}
          {!form.partial_payout && !form.revision_acceptable && !form.conditional_approval && (
            <span className="text-xs text-parchment/30 italic">No middle outcomes selected</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-parchment/40 font-mono">CASE</p>
          <p className="text-parchment/80">{form.case_title || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-parchment/40 font-mono">AMOUNT</p>
          <p className="text-parchment/80">{form.amount_at_stake || "0"} {form.asset_symbol}</p>
        </div>
        <div>
          <p className="text-xs text-parchment/40 font-mono">EVIDENCE DEADLINE</p>
          <p className="text-parchment/80">{form.evidence_deadline || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-parchment/40 font-mono">RESOLUTION DEADLINE</p>
          <p className="text-parchment/80">{form.resolution_deadline || "—"}</p>
        </div>
      </div>
    </div>
  );
}
