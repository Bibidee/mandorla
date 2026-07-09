"use client";
import { useState } from "react";
import Link from "next/link";
import { OUTCOME_LABELS, CASE_TYPE_LABELS } from "@/lib/mockData";
import { SplitPayoutBar } from "@/components/SplitPayoutBar";
import type { Case } from "@/lib/types";

const FILTERS = [
  { label: "All", key: null },
  { label: "Split Payout", key: "split_payout" },
  { label: "Partial Credit", key: "partial_credit" },
  { label: "Shared Fault", key: "shared_fault" },
  { label: "Conditional Approval", key: "conditional_approval" },
  { label: "Staged Release", key: "staged_release" },
  { label: "Insufficient Evidence", key: "insufficient_evidence" },
];

export function SettlementsClient({ settled }: { settled: Case[] }) {
  const [active, setActive] = useState<string | null>(null);

  const visible = active ? settled.filter(c => c.final_result?.outcome_type === active) : settled;

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
        {FILTERS.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.label}
              onClick={() => setActive(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full font-mono transition-colors border ${
                isActive
                  ? "bg-gold/20 text-gold border-gold/30"
                  : "border-lavender/15 text-parchment/40 hover:border-lavender/30 hover:text-parchment/70"
              }`}
            >
              {f.label}
              {f.key && (
                <span className="ml-1.5 opacity-50">
                  {settled.filter(c => c.final_result?.outcome_type === f.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-parchment/40 mb-2">
            {settled.length === 0 ? "No settlements yet." : "No cases match this filter."}
          </p>
          <p className="text-parchment/30 text-sm">
            {settled.length === 0
              ? "Resolved cases appear here after validators find the fair middle."
              : "Try a different outcome type."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((c) => {
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
