"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CASE_TYPE_LABELS } from "@/lib/mockData";
import { OverlapField } from "@/components/OverlapField";
import type { Case } from "@/lib/types";

export default function ResolvePage() {
  const [ready, setReady] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolved, setResolved] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { getAllCases } = await import("@/lib/contractData");
        const all = await getAllCases();
        setReady(all.filter(c => c.status === "ready_for_resolution"));
      } catch {
        setReady([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleResolve(caseId: number) {
    setResolving(caseId);
    setTimeout(() => {
      setResolving(null);
      setResolved((r) => [...r, caseId]);
    }, 4000);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Resolution Console</p>
        <h1 className="font-display text-4xl text-parchment">Cases Ready for Resolution</h1>
        <p className="text-parchment/50 text-sm mt-2">
          {loading ? "Loading…" : `${ready.length} ${ready.length === 1 ? "case" : "cases"} waiting for GenLayer validators to map the fair middle.`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-parchment/40">Loading cases from chain…</p>
        </div>
      ) : ready.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-parchment/40 mb-2">No cases ready yet.</p>
          <p className="text-parchment/30 text-sm">Cases appear here once both sides have submitted evidence.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {ready.map((c) => {
            const isResolving = resolving === c.case_id;
            const isDone = resolved.includes(c.case_id);
            return (
              <div key={c.case_id} className="panel p-6 flex flex-col md:flex-row gap-6 ready-glow">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-parchment/40">CASE-{String(c.case_id).padStart(4,"0")}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-plum text-parchment/50 font-mono border border-lavender/10">
                      {CASE_TYPE_LABELS[c.case_type] ?? c.case_type}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl text-parchment">{c.case_title}</h2>
                  <p className="text-sm text-parchment/50 leading-relaxed">{c.agreement_summary}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <Stat label="At stake" value={`${c.amount_at_stake.toLocaleString()} ${c.asset_symbol}`} mono gold />
                    <Stat label="Evidence" value={`${c.evidence?.length ?? 0} items`} />
                    <Stat label="Deadline" value={new Date(c.resolution_deadline).toLocaleDateString()} />
                    <Stat label="Ambiguity" value="Moderate" />
                  </div>

                  {isDone ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                      <p className="text-sm text-gold">Validators are mapping overlap…</p>
                      <Link href={`/cases/${c.case_id}`} className="text-xs text-parchment/50 underline hover:text-parchment ml-auto">View case</Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleResolve(c.case_id)}
                      disabled={isResolving}
                      className="mt-2 self-start px-6 py-3 rounded-xl bg-gold text-inkbrown font-semibold text-sm hover:bg-apricot transition-colors disabled:opacity-60 gold-glow-sm"
                    >
                      {isResolving ? "Submitting to validators…" : "Ask GenLayer for the Fair Middle"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center">
                  {isResolving ? <ResolvingAnimation /> : isDone ? (
                    <div className="text-center px-4">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                        <span className="text-2xl">⚖️</span>
                      </div>
                      <p className="text-xs text-gold/70 font-mono">Pending consensus</p>
                    </div>
                  ) : (
                    <OverlapField size="sm" animated />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, mono, gold }: { label: string; value: string; mono?: boolean; gold?: boolean }) {
  return (
    <div>
      <p className="text-xs text-parchment/40 font-mono mb-0.5">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""} ${gold ? "text-gold" : "text-parchment/70"}`}>{value}</p>
    </div>
  );
}

function ResolvingAnimation() {
  return (
    <div className="flex flex-col items-center gap-3 px-6">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full">
          <circle cx="35" cy="48" r="26" fill="#C07A5A" fillOpacity="0.3" stroke="#C07A5A" strokeWidth="1" strokeOpacity="0.4">
            <animate attributeName="cx" values="35;48;35" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="61" cy="48" r="26" fill="#C9B8D8" fillOpacity="0.3" stroke="#C9B8D8" strokeWidth="1" strokeOpacity="0.4">
            <animate attributeName="cx" values="61;48;61" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="48" cy="48" r="8" fill="#D8A84F" fillOpacity="0.8">
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <p className="text-xs text-gold/70 font-mono text-center">Validators are mapping overlap</p>
    </div>
  );
}
