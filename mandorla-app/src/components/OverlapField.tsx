"use client";
import { clsx } from "clsx";

interface OverlapFieldProps {
  claimantShareBps?: number;
  respondentShareBps?: number;
  claimantResponsibilityBps?: number;
  respondentResponsibilityBps?: number;
  confidenceBps?: number;
  evidenceStrength?: "strong" | "moderate" | "weak" | "conflicting" | "insufficient";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function OverlapField({
  claimantShareBps = 5000,
  respondentShareBps = 5000,
  claimantResponsibilityBps = 5000,
  respondentResponsibilityBps = 5000,
  confidenceBps = 7000,
  evidenceStrength = "moderate",
  size = "md",
  animated = true,
}: OverlapFieldProps) {
  const claimantPct = (claimantShareBps / 100).toFixed(0);
  const respondentPct = (respondentShareBps / 100).toFixed(0);
  const confidencePct = (confidenceBps / 100).toFixed(0);

  const dims = { sm: 180, md: 260, lg: 340 }[size];
  const r = dims * 0.35;
  const cx1 = dims * 0.35;
  const cx2 = dims * 0.65;
  const cy = dims * 0.5;

  // Intersection overlap offset
  const overlapRatio = 0.42;
  const d = r * (1 - overlapRatio) * 2;

  const strengthColor = {
    strong: "#D8A84F",
    moderate: "#C07A5A",
    weak: "#8395A7",
    conflicting: "#B96071",
    insufficient: "#8395A7",
  }[evidenceStrength];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
          <defs>
            <radialGradient id="clayGrad" cx="40%" cy="50%">
              <stop offset="0%" stopColor="#C07A5A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#C07A5A" stopOpacity="0.15" />
            </radialGradient>
            <radialGradient id="lavGrad" cx="60%" cy="50%">
              <stop offset="0%" stopColor="#C9B8D8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#C9B8D8" stopOpacity="0.15" />
            </radialGradient>
            <radialGradient id="goldGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#D8A84F" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D8A84F" stopOpacity="0.3" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left circle — claimant */}
          <circle
            cx={cx1}
            cy={cy}
            r={r}
            fill="url(#clayGrad)"
            stroke="#C07A5A"
            strokeWidth="1"
            strokeOpacity="0.4"
            className={animated ? "animate-pulse-slow" : ""}
          />

          {/* Right circle — respondent */}
          <circle
            cx={cx2}
            cy={cy}
            r={r}
            fill="url(#lavGrad)"
            stroke="#C9B8D8"
            strokeWidth="1"
            strokeOpacity="0.4"
            className={animated ? "animate-pulse-slow" : ""}
          />

          {/* Mandorla overlap — vesica piscis shape */}
          <MandorlaOverlapPath cx1={cx1} cx2={cx2} cy={cy} r={r} />

          {/* Confidence marker */}
          <circle
            cx={dims / 2}
            cy={cy}
            r={5}
            fill="#D8A84F"
            filter="url(#glow)"
          />
          <line
            x1={dims / 2}
            y1={cy - r * 0.7}
            x2={dims / 2}
            y2={cy + r * 0.7}
            stroke="#D8A84F"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Labels */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-1 text-center"
          style={{ width: dims * 0.28 }}
        >
          <span className="font-mono text-clay text-xs font-medium">{claimantPct}%</span>
          <p className="text-parchment/40 text-xs mt-0.5 leading-tight">claimant</p>
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 right-1 text-center"
          style={{ width: dims * 0.28 }}
        >
          <span className="font-mono text-lavender text-xs font-medium">{respondentPct}%</span>
          <p className="text-parchment/40 text-xs mt-0.5 leading-tight">respondent</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="font-mono text-gold text-sm">{confidencePct}%</p>
          <p className="text-parchment/40 text-xs">confidence</p>
        </div>
        <div className="w-px bg-lavender/20" />
        <div>
          <p
            className="text-sm font-medium capitalize"
            style={{ color: strengthColor }}
          >
            {evidenceStrength}
          </p>
          <p className="text-parchment/40 text-xs">evidence</p>
        </div>
      </div>
    </div>
  );
}

function MandorlaOverlapPath({
  cx1, cx2, cy, r,
}: { cx1: number; cx2: number; cy: number; r: number }) {
  const d = cx2 - cx1;
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const midX = (cx1 + cx2) / 2;

  const topX = midX;
  const topY = cy - h;
  const botX = midX;
  const botY = cy + h;

  const path = `M ${topX} ${topY} A ${r} ${r} 0 0 1 ${botX} ${botY} A ${r} ${r} 0 0 1 ${topX} ${topY} Z`;

  return (
    <>
      <path d={path} fill="url(#goldGrad)" opacity="0.85" />
      <path d={path} fill="none" stroke="#D8A84F" strokeWidth="1" strokeOpacity="0.6" />
      <text x={midX} y={cy + 4} textAnchor="middle" fill="#D8A84F" fontSize="8" fontFamily="IBM Plex Mono" opacity="0.9">
        fair middle
      </text>
    </>
  );
}
