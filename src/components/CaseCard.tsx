"use client";
import Link from "next/link";
import { clsx } from "clsx";
import type { Case } from "@/lib/types";
import { CASE_TYPE_LABELS, STATUS_LABELS, OUTCOME_LABELS } from "@/lib/mockData";

interface CaseCardProps {
  c: Case;
}

export function CaseCard({ c }: CaseCardProps) {
  const isReady = c.status === "ready_for_resolution";
  const isResolved = c.status === "resolved" || c.status === "settled";

  return (
    <Link href={`/cases/${c.case_id}`}>
      <div
        className={clsx(
          "panel p-5 flex flex-col gap-3 hover:border-lavender/30 transition-all duration-200 cursor-pointer group h-full",
          isReady && "ready-glow",
          isResolved && "border-parchment/10"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-parchment/40 mb-1">
              CASE-{String(c.case_id).padStart(4, "0")}
            </p>
            <h3 className="font-display text-base font-semibold text-parchment group-hover:text-gold transition-colors leading-snug">
              {c.case_title}
            </h3>
          </div>
          <StatusBadge status={c.status} />
        </div>

        {/* Type + amount */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded bg-plum text-parchment/60 border border-lavender/10">
            {CASE_TYPE_LABELS[c.case_type]}
          </span>
          {c.amount_at_stake > 0 && (
            <span className="font-mono text-xs text-gold">
              {c.amount_at_stake.toLocaleString()} {c.asset_symbol}
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-sm text-parchment/50 leading-relaxed line-clamp-2">
          {c.agreement_summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-parchment/30 mt-auto pt-2 border-t border-lavender/10">
          <span>{c.evidence?.length ?? 0} evidence items</span>
          {isResolved && c.final_result && (
            <SplitPreview
              claimantBps={c.final_result.claimant_share_bps}
              respondentBps={c.final_result.respondent_share_bps}
            />
          )}
          {isReady && (
            <span className="text-gold font-medium animate-pulse">Ready for resolution</span>
          )}
          {!isReady && !isResolved && (
            <span>{new Date(c.resolution_deadline).toLocaleDateString()}</span>
          )}
        </div>

        {/* Resolved outcome badge */}
        {isResolved && c.final_result && (
          <div className="text-xs font-mono text-gold/70 border-t border-gold/10 pt-2">
            {OUTCOME_LABELS[c.final_result.outcome_type]}
          </div>
        )}
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-bluegrey/20 text-bluegrey",
    open: "bg-clay/20 text-clay",
    responded: "bg-lavender/20 text-lavender",
    evidence_open: "bg-apricot/20 text-apricot",
    ready_for_resolution: "bg-gold/20 text-gold",
    resolving: "bg-gold/30 text-gold animate-pulse",
    resolved: "bg-parchment/10 text-parchment/60",
    settled: "bg-parchment/10 text-parchment/50",
    cancelled: "bg-faultrose/20 text-faultrose/60",
  };
  return (
    <span
      className={clsx(
        "text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-mono",
        colors[status] ?? "bg-plum text-parchment/40"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SplitPreview({ claimantBps, respondentBps }: { claimantBps: number; respondentBps: number }) {
  const c = claimantBps / 100;
  const r = respondentBps / 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-20 h-1.5 rounded-full overflow-hidden flex bg-aubergine">
        <div className="h-full bg-clay" style={{ width: `${c}%` }} />
        <div className="h-full bg-lavender" style={{ width: `${r}%` }} />
      </div>
      <span className="text-clay">{c.toFixed(0)}%</span>
    </div>
  );
}
