import { OUTCOME_LABELS, CASE_TYPE_LABELS } from "@/lib/mockData";
import { getAllCases } from "@/lib/contractData";
import { SplitPayoutBar } from "@/components/SplitPayoutBar";
import Link from "next/link";

export const revalidate = 30;

const FILTERS = ["All","Split Payout","Partial Credit","Shared Fault","Conditional Approval","Staged Release","Insufficient Evidence"];

export default async function SettlementsPage() {
  const all = await getAllCases();
  const settled = all.filter(c => (c.status === "resolved" || c.status === "settled") && c.final_result);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Settlement Ledger</p>
        <h1 className="font-display text-4xl text-parchment">Resolved Cases</h1>
        <p className="text-parchment/50 text-sm mt-2">
          {settled.length} cases with final middle outcomes on record.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f, i) => (
          <button key={f} className={`text-xs px-3 py-1.5 rounded-full font-mono transition-colors border ${i === 0 ? "bg-gold/20 text-gold border-gold/30" : "border-lavender/15 text-parchment/40 hover:border-lavender/30 hover:text-parchment/70"}`}>
            {f}
          </button>
        ))}
      </div>

      {settled.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-parchment/40 mb-2">No settlements yet.</p>
          <p className="text-parchment/30 text-sm">Resolved cases appear here after validators find the fair middle.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {settled.map((c) => {
            const r = c.final_result!;
            return (
              <Link key={c.case_id} href={`/cases/${c.case_id}`}>
                <div className="panel p-5 hover:border-lavender/25 transition-all flex flex-col md:flex-row gap-5 cursor-pointer group">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-parchment/30">CASE-{String(c.case_id).padStart(4, "0")}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-plum text-parchment/50 font-mono border border-lavender/10">
                        {CASE_TYPE_LABELS[c.case_type] ?? c.case_type}
                      </span>
                      <OutcomeBadge type={r.outcome_type} />
                    </div>
                    <h3 className="font-display text-lg text-parchment group-hover:text-gold transition-colors">{c.case_title}</h3>
                    <p className="text-xs text-parchment/50 italic leading-relaxed">"{r.middle_reason}"</p>
                  </div>
                  <div className="md:w-72 flex flex-col gap-3 justify-center">
                    <SplitPayoutBar claimantBps={r.claimant_share_bps} respondentBps={r.respondent_share_bps} showLabels={false} />
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-clay">{(r.claimant_share_bps / 100).toFixed(0)}% claimant</span>
                      <span className="font-mono text-gold">{(r.confidence_bps / 100).toFixed(0)}% confidence</span>
                      <span className="font-mono text-lavender">{(r.respondent_share_bps / 100).toFixed(0)}% respondent</span>
                    </div>
                    {c.amount_at_stake > 0 && (
                      <p className="font-mono text-xs text-gold/60 text-right">{c.amount_at_stake.toLocaleString()} {c.asset_symbol}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OutcomeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    split_payout: "bg-gold/15 text-gold",
    partial_credit: "bg-apricot/15 text-apricot",
    shared_fault: "bg-faultrose/15 text-faultrose",
    conditional_approval: "bg-lavender/15 text-lavender",
    staged_release: "bg-gold/15 text-gold",
    full_claimant_win: "bg-clay/15 text-clay",
    full_respondent_win: "bg-lavender/15 text-lavender",
    insufficient_evidence: "bg-bluegrey/15 text-bluegrey",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${colors[type] ?? "bg-plum text-parchment/40"}`}>
      {OUTCOME_LABELS[type] ?? type}
    </span>
  );
}
