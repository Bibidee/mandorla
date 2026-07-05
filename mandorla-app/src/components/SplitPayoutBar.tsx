import { clsx } from "clsx";

interface SplitPayoutBarProps {
  claimantBps: number;
  respondentBps: number;
  label?: string;
  showLabels?: boolean;
}

export function SplitPayoutBar({ claimantBps, respondentBps, label, showLabels = true }: SplitPayoutBarProps) {
  const c = claimantBps / 100;
  const r = respondentBps / 100;
  return (
    <div className="w-full">
      {label && <p className="text-xs text-parchment/50 mb-1.5 font-mono uppercase tracking-wider">{label}</p>}
      <div className="h-3 rounded-full overflow-hidden flex bg-aubergine">
        <div
          className="h-full bg-clay transition-all duration-700"
          style={{ width: `${c}%` }}
        />
        <div className="h-full w-px bg-aubergine/50" />
        <div
          className="h-full bg-lavender transition-all duration-700"
          style={{ width: `${r}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-clay">{c.toFixed(0)}% claimant</span>
          <span className="text-xs font-mono text-lavender">{r.toFixed(0)}% respondent</span>
        </div>
      )}
    </div>
  );
}

interface ResponsibilityBarProps {
  claimantBps: number;
  respondentBps: number;
}

export function ResponsibilityBar({ claimantBps, respondentBps }: ResponsibilityBarProps) {
  const c = claimantBps / 100;
  const r = respondentBps / 100;
  return (
    <div className="w-full">
      <p className="text-xs text-parchment/50 mb-1.5 font-mono uppercase tracking-wider">Responsibility</p>
      <div className="h-3 rounded-full overflow-hidden flex bg-aubergine">
        <div className="h-full bg-faultrose/70 transition-all duration-700" style={{ width: `${c}%` }} />
        <div className="h-full w-px bg-aubergine/50" />
        <div className="h-full bg-faultrose/40 transition-all duration-700" style={{ width: `${r}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs font-mono text-faultrose/80">{c.toFixed(0)}% claimant fault</span>
        <span className="text-xs font-mono text-faultrose/60">{r.toFixed(0)}% respondent fault</span>
      </div>
    </div>
  );
}
