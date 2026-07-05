import { clsx } from "clsx";
import type { FinalResult } from "@/lib/types";
import { SplitPayoutBar, ResponsibilityBar } from "./SplitPayoutBar";
import { OUTCOME_LABELS } from "@/lib/mockData";

interface MiddleOutcomeCardProps {
  result: FinalResult;
  amountAtStake?: number;
  assetSymbol?: string;
}

const STRENGTH_COLOR: Record<string, string> = {
  strong: "text-gold",
  moderate: "text-apricot",
  weak: "text-bluegrey",
  conflicting: "text-faultrose",
  insufficient: "text-bluegrey",
};

const OUTCOME_COLOR: Record<string, string> = {
  full_claimant_win: "text-clay",
  full_respondent_win: "text-lavender",
  split_payout: "text-gold",
  partial_credit: "text-apricot",
  shared_fault: "text-faultrose",
  conditional_approval: "text-apricot",
  staged_release: "text-gold",
  revision_required: "text-bluegrey",
  mutual_concession: "text-lavender",
  insufficient_evidence: "text-bluegrey",
  bad_faith_claim: "text-faultrose",
  manual_review: "text-bluegrey",
};

export function MiddleOutcomeCard({ result: r, amountAtStake, assetSymbol = "GEN" }: MiddleOutcomeCardProps) {
  const claimantAmount = amountAtStake ? ((r.claimant_share_bps / 10000) * amountAtStake).toFixed(0) : null;
  const respondentAmount = amountAtStake ? ((r.respondent_share_bps / 10000) * amountAtStake).toFixed(0) : null;

  return (
    <div className="panel p-6 flex flex-col gap-5">
      {/* Outcome type header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-parchment/40 font-mono uppercase tracking-wider mb-1">Middle Outcome</p>
          <h3 className={clsx("font-display text-2xl font-semibold", OUTCOME_COLOR[r.outcome_type])}>
            {OUTCOME_LABELS[r.outcome_type]}
          </h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-gold text-lg">{(r.confidence_bps / 100).toFixed(0)}%</p>
          <p className="text-xs text-parchment/40">confidence</p>
        </div>
      </div>

      {/* Payout amounts */}
      {claimantAmount && (
        <div className="flex gap-4">
          <div className="flex-1 bg-clay/10 rounded-lg p-3 text-center border border-clay/20">
            <p className="font-mono text-clay text-lg font-medium">{Number(claimantAmount).toLocaleString()} {assetSymbol}</p>
            <p className="text-xs text-parchment/40 mt-0.5">claimant receives</p>
          </div>
          <div className="flex-1 bg-lavender/10 rounded-lg p-3 text-center border border-lavender/20">
            <p className="font-mono text-lavender text-lg font-medium">{Number(respondentAmount).toLocaleString()} {assetSymbol}</p>
            <p className="text-xs text-parchment/40 mt-0.5">respondent receives</p>
          </div>
        </div>
      )}

      {/* Split bars */}
      <div className="flex flex-col gap-3">
        <SplitPayoutBar
          claimantBps={r.claimant_share_bps}
          respondentBps={r.respondent_share_bps}
          label="Payout split"
        />
        <ResponsibilityBar
          claimantBps={r.claimant_responsibility_bps}
          respondentBps={r.respondent_responsibility_bps}
        />
      </div>

      {/* Evidence strength */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-parchment/40">Evidence strength:</span>
        <span className={clsx("text-sm font-medium capitalize", STRENGTH_COLOR[r.evidence_strength])}>
          {r.evidence_strength}
        </span>
      </div>

      {/* Reason */}
      <div className="bg-aubergine/50 rounded-lg p-4 border border-lavender/10">
        <p className="text-xs text-parchment/40 font-mono uppercase tracking-wider mb-2">Middle Reason</p>
        <p className="text-sm text-parchment/80 leading-relaxed italic">{r.middle_reason}</p>
      </div>

      {/* Conditions */}
      {r.conditions.length > 0 && (
        <div>
          <p className="text-xs text-parchment/40 font-mono uppercase tracking-wider mb-2">Conditions</p>
          <ul className="flex flex-col gap-1.5">
            {r.conditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-apricot">
                <span className="text-gold mt-0.5">◆</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uncertainties */}
      {r.uncertainties.length > 0 && (
        <div>
          <p className="text-xs text-parchment/40 font-mono uppercase tracking-wider mb-2">Uncertainties</p>
          <ul className="flex flex-col gap-1.5">
            {r.uncertainties.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm text-bluegrey">
                <span className="text-bluegrey/60 mt-0.5">~</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Settlement instruction */}
      <div className="rounded-lg p-4 border border-gold/30 bg-gold/5">
        <p className="text-xs text-gold/60 font-mono uppercase tracking-wider mb-1">Settlement Instruction</p>
        <p className="text-sm text-gold/90 font-medium">{r.settlement_instruction}</p>
      </div>
    </div>
  );
}
