import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_CASES, STATUS_LABELS, CASE_TYPE_LABELS } from "@/lib/mockData";
import { OverlapField } from "@/components/OverlapField";
import { EvidenceTile } from "@/components/EvidenceTile";
import { MiddleOutcomeCard } from "@/components/MiddleOutcomeCard";

interface Props { params: Promise<{ id: string }> }

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const c = MOCK_CASES.find((x) => x.case_id === Number(id));
  if (!c) notFound();

  const claimantEvidence = c.evidence?.filter((e) => e.side === "claimant") ?? [];
  const respondentEvidence = c.evidence?.filter((e) => e.side === "respondent") ?? [];
  const neutralEvidence = c.evidence?.filter((e) => e.side === "neutral") ?? [];

  const isResolved = c.status === "resolved" || c.status === "settled";
  const isReady = c.status === "ready_for_resolution";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-parchment/40 mb-8 font-mono">
        <Link href="/cases" className="hover:text-parchment transition-colors">Observatory</Link>
        <span>/</span>
        <span className="text-parchment/60">CASE-{String(c.case_id).padStart(4, "0")}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-plum text-parchment/50 font-mono border border-lavender/10">
              {CASE_TYPE_LABELS[c.case_type]}
            </span>
            <StatusChip status={c.status} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-parchment">{c.case_title}</h1>
          <p className="text-parchment/50 text-sm mt-2 max-w-2xl leading-relaxed">{c.agreement_summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {c.amount_at_stake > 0 && (
            <div className="text-right">
              <p className="font-mono text-gold text-2xl">{c.amount_at_stake.toLocaleString()} {c.asset_symbol}</p>
              <p className="text-xs text-parchment/40">at stake</p>
            </div>
          )}
          <p className="font-mono text-xs text-parchment/30">
            Created {new Date(c.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Ready for resolution banner */}
      {isReady && (
        <div className="mb-8 p-4 rounded-xl border border-gold/30 bg-gold/5 flex items-center justify-between gap-4">
          <div>
            <p className="text-gold font-medium text-sm">Both sides have submitted their truth.</p>
            <p className="text-parchment/50 text-xs mt-0.5">This case is ready for proportional resolution.</p>
          </div>
          <Link href="/resolve" className="px-4 py-2 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors whitespace-nowrap">
            Ask GenLayer
          </Link>
        </div>
      )}

      {/* Main three-zone layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-6 mb-12">
        {/* Left — Claimant truth */}
        <TruthColumn
          side="claimant"
          position={c.claimant_position}
          requestedOutcome={c.requested_outcome}
          evidence={claimantEvidence}
          address={c.creator}
        />

        {/* Centre — Overlap Field */}
        <div className="flex flex-col items-center gap-6">
          <div className="panel p-6 flex flex-col items-center gap-4 w-full">
            <p className="font-mono text-xs text-parchment/40 uppercase tracking-wider">Overlap Field</p>
            {isResolved && c.final_result ? (
              <OverlapField
                claimantShareBps={c.final_result.claimant_share_bps}
                respondentShareBps={c.final_result.respondent_share_bps}
                claimantResponsibilityBps={c.final_result.claimant_responsibility_bps}
                respondentResponsibilityBps={c.final_result.respondent_responsibility_bps}
                confidenceBps={c.final_result.confidence_bps}
                evidenceStrength={c.final_result.evidence_strength}
                size="md"
              />
            ) : (
              <OverlapField size="md" animated />
            )}

            {/* Shared/neutral facts */}
            <div className="w-full border-t border-lavender/10 pt-4">
              <p className="text-xs text-parchment/40 font-mono mb-2">Evidence count</p>
              <div className="flex gap-3 text-center">
                <div className="flex-1">
                  <p className="font-mono text-clay text-lg">{claimantEvidence.length}</p>
                  <p className="text-xs text-parchment/30">claimant</p>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-gold text-lg">{neutralEvidence.length}</p>
                  <p className="text-xs text-parchment/30">neutral</p>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-lavender text-lg">{respondentEvidence.length}</p>
                  <p className="text-xs text-parchment/30">respondent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="panel-dark p-4 rounded-xl w-full">
            <p className="font-mono text-xs text-parchment/40 mb-3 uppercase tracking-wider">Deadlines</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-parchment/50">Evidence</span>
                <span className="font-mono text-parchment/70">{new Date(c.evidence_deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-parchment/50">Resolution</span>
                <span className="font-mono text-parchment/70">{new Date(c.resolution_deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Respondent truth */}
        <TruthColumn
          side="respondent"
          position={c.respondent_position}
          requestedOutcome={c.counter_outcome}
          evidence={respondentEvidence}
          address={c.respondent}
        />
      </div>

      {/* Middle outcome result */}
      {isResolved && c.final_result && (
        <div className="mb-12">
          <h2 className="font-display text-2xl text-parchment mb-4">Middle Outcome</h2>
          <MiddleOutcomeCard
            result={c.final_result}
            amountAtStake={c.amount_at_stake}
            assetSymbol={c.asset_symbol}
          />
        </div>
      )}

      {/* Add evidence */}
      {!isResolved && (
        <div className="mt-8 panel-dark rounded-xl p-6">
          <h3 className="font-display text-xl text-parchment mb-2">Submit Evidence</h3>
          <p className="text-parchment/50 text-sm mb-4">Add evidence tiles that attach to either side or the shared centre.</p>
          <EvidenceForm caseId={c.case_id} />
        </div>
      )}
    </div>
  );
}

function TruthColumn({
  side,
  position,
  requestedOutcome,
  evidence,
  address,
}: {
  side: "claimant" | "respondent";
  position?: string;
  requestedOutcome?: string;
  evidence: import("@/lib/types").Evidence[];
  address: string;
}) {
  const isClaimant = side === "claimant";
  const color = isClaimant ? "text-clay" : "text-lavender";
  const borderColor = isClaimant ? "border-clay/30" : "border-lavender/30";
  const label = isClaimant ? "Claimant Truth" : "Respondent Truth";

  return (
    <div className="flex flex-col gap-4">
      <div className={`panel p-5 border-t-2 ${borderColor}`}>
        <p className={`font-mono text-xs ${color} uppercase tracking-wider mb-3`}>{label}</p>
        <p className="font-mono text-xs text-parchment/30 mb-3 truncate">{address}</p>

        {position ? (
          <p className="text-sm text-parchment/80 leading-relaxed mb-4">{position}</p>
        ) : (
          <p className="text-sm text-parchment/30 italic mb-4">
            {isClaimant ? "No position submitted." : "Waiting for the respondent to add context."}
          </p>
        )}

        {requestedOutcome && (
          <div className="border-t border-lavender/10 pt-3">
            <p className="text-xs text-parchment/40 font-mono mb-1">
              {isClaimant ? "Requested outcome" : "Counter outcome"}
            </p>
            <p className="text-sm text-parchment/70">{requestedOutcome}</p>
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="flex flex-col gap-3">
        {(evidence ?? []).map((e) => (
          <EvidenceTile key={e.evidence_id} evidence={e} />
        ))}
        {(evidence ?? []).length === 0 && (
          <div className="panel-dark p-4 rounded-xl text-center">
            <p className="text-parchment/30 text-xs italic">
              {isClaimant ? "The middle is still invisible." : "No evidence from this side yet."}
            </p>
            {!isClaimant && (
              <p className="text-parchment/20 text-xs mt-1">Add evidence from at least one side.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-bluegrey/20 text-bluegrey",
    open: "bg-clay/20 text-clay",
    responded: "bg-lavender/20 text-lavender",
    evidence_open: "bg-apricot/20 text-apricot",
    ready_for_resolution: "bg-gold/20 text-gold",
    resolving: "bg-gold/30 text-gold",
    resolved: "bg-parchment/10 text-parchment/60",
    settled: "bg-parchment/10 text-parchment/50",
    cancelled: "bg-faultrose/20 text-faultrose/60",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${colors[status] ?? "bg-plum text-parchment/40"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function EvidenceForm({ caseId }: { caseId: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">Title</label>
        <input className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20" placeholder="Evidence title" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">Type</label>
        <select className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50">
          <option value="agreement">Agreement</option>
          <option value="message_thread">Message Thread</option>
          <option value="work_output">Work Output</option>
          <option value="payment_record">Payment Record</option>
          <option value="screenshot">Screenshot</option>
          <option value="public_url">Public URL</option>
          <option value="expert_note">Expert Note</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">Side</label>
        <select className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50">
          <option value="claimant">Claimant</option>
          <option value="respondent">Respondent</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment/50 font-mono">URL (optional)</label>
        <input className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20" placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-xs text-parchment/50 font-mono">Summary</label>
        <textarea className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20 resize-none h-20" placeholder="What does this evidence show?" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-xs text-parchment/50 font-mono">Why it matters</label>
        <input className="bg-aubergine border border-lavender/20 rounded-lg px-3 py-2 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20" placeholder="Why should validators weight this evidence?" />
      </div>
      <div className="md:col-span-2">
        <button className="px-6 py-2.5 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors">
          Submit Evidence
        </button>
      </div>
    </div>
  );
}
