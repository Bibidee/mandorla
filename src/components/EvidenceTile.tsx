import { clsx } from "clsx";
import type { Evidence } from "@/lib/types";

const EVIDENCE_ICONS: Record<string, string> = {
  agreement: "📄",
  message_thread: "💬",
  work_output: "🔧",
  payment_record: "💳",
  timeline: "📅",
  screenshot: "🖼",
  public_url: "🔗",
  expert_note: "🧠",
  admission: "✍️",
  counter_evidence: "⚖️",
};

const EVIDENCE_LABELS: Record<string, string> = {
  agreement: "Agreement",
  message_thread: "Message Thread",
  work_output: "Work Output",
  payment_record: "Payment Record",
  timeline: "Timeline",
  screenshot: "Screenshot",
  public_url: "Public URL",
  expert_note: "Expert Note",
  admission: "Admission",
  counter_evidence: "Counter Evidence",
};

interface EvidenceTileProps {
  evidence: Evidence;
  compact?: boolean;
}

export function EvidenceTile({ evidence: e, compact = false }: EvidenceTileProps) {
  const borderColor =
    e.side === "claimant"
      ? "border-l-clay"
      : e.side === "respondent"
      ? "border-l-lavender"
      : "border-l-gold";

  return (
    <div
      className={clsx(
        "panel-dark p-4 border-l-2 rounded-lg",
        borderColor,
        compact ? "text-sm" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{EVIDENCE_ICONS[e.evidence_type] ?? "📎"}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-plum text-parchment/50 font-mono">
            {EVIDENCE_LABELS[e.evidence_type]}
          </span>
        </div>
        <SideBadge side={e.side} />
      </div>

      <h4 className="text-parchment font-medium text-sm leading-snug mb-1">{e.title}</h4>
      {!compact && (
        <p className="text-parchment/50 text-xs leading-relaxed mb-2">{e.summary}</p>
      )}

      {e.url && (
        <a
          href={e.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold/70 hover:text-gold font-mono underline truncate block"
        >
          {e.url}
        </a>
      )}
      {e.content_hash && (
        <p className="text-xs text-parchment/30 font-mono mt-1 truncate">
          {e.content_hash}
        </p>
      )}
      {e.weight_hint && !compact && (
        <p className="text-xs text-parchment/40 italic mt-2 border-t border-lavender/10 pt-2">
          "{e.weight_hint}"
        </p>
      )}
    </div>
  );
}

function SideBadge({ side }: { side: string }) {
  const styles =
    side === "claimant"
      ? "bg-clay/20 text-clay"
      : side === "respondent"
      ? "bg-lavender/20 text-lavender"
      : "bg-gold/20 text-gold";
  return (
    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-mono capitalize", styles)}>
      {side}
    </span>
  );
}
