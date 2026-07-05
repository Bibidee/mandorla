import Link from "next/link";
import { CaseCard } from "@/components/CaseCard";
import { MOCK_CASES, STATUS_LABELS } from "@/lib/mockData";

export default function CasesPage() {
  const statuses = ["all", "open", "evidence_open", "ready_for_resolution", "resolved", "settled"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Case Observatory</p>
          <h1 className="font-display text-4xl text-parchment">All Overlaps</h1>
          <p className="text-parchment/50 text-sm mt-2">
            {MOCK_CASES.length} cases mapped — {MOCK_CASES.filter(c => c.status === "ready_for_resolution").length} ready for resolution
          </p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-inkbrown font-semibold text-sm hover:bg-apricot transition-colors self-start md:self-auto"
        >
          + Open a Case
        </Link>
      </div>

      {/* Empty state check */}
      {MOCK_CASES.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {MOCK_CASES.map((c) => (
            <div key={c.case_id} className="break-inside-avoid">
              <CaseCard c={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-32">
      <div className="w-20 h-20 mx-auto mb-6 opacity-30">
        <svg viewBox="0 0 80 80">
          <circle cx="30" cy="40" r="24" fill="#C07A5A" fillOpacity="0.4"/>
          <circle cx="50" cy="40" r="24" fill="#C9B8D8" fillOpacity="0.4"/>
        </svg>
      </div>
      <h3 className="font-display text-2xl text-parchment/60 mb-2">No overlaps mapped yet.</h3>
      <p className="text-parchment/40 text-sm mb-6">Create the first shared-decision case.</p>
      <Link href="/cases/new" className="px-6 py-2.5 rounded-lg bg-gold text-inkbrown font-medium text-sm hover:bg-apricot transition-colors">
        Open a Case
      </Link>
    </div>
  );
}
