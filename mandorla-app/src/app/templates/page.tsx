const TEMPLATES = [
  {
    id: "split_payout",
    name: "Split Payout",
    color: "gold",
    icon: "⚖️",
    tagline: "Best when both parties have valid claims over funds.",
    explanation:
      "A split payout distributes the amount at stake proportionally based on what each side contributed or is owed. It recognises that neither position is entirely wrong.",
    sample:
      "A freelancer delivered 70% of agreed work. The client claims non-delivery. Validators assess completion and award 65% to freelancer, 35% refund to client.",
    whenNotTo:
      "When one party clearly and completely failed their obligation. Don't use split payout to avoid a hard truth.",
    evidence: ["Deliverable files or output", "Original agreement scope", "Completion checklist", "Client feedback history"],
  },
  {
    id: "partial_credit",
    name: "Partial Credit",
    color: "apricot",
    icon: "📋",
    tagline: "Best when work is useful but incomplete.",
    explanation:
      "Partial credit acknowledges that something of value was delivered, but the full obligation was not met. The reward reflects actual utility.",
    sample:
      "A DAO contributor delivered code but missed documentation and tests. Award 60% of the agreed bounty for the usable output.",
    whenNotTo:
      "When the incomplete work cannot be used at all, or when the missing part was the core deliverable.",
    evidence: ["Working output samples", "Original scope document", "Acceptance criteria", "Usage evidence"],
  },
  {
    id: "shared_fault",
    name: "Shared Fault",
    color: "faultrose",
    icon: "🔀",
    tagline: "Best when both sides contributed to harm.",
    explanation:
      "Shared fault maps responsibility proportionally. Neither party escapes accountability, but the degree reflects who contributed more to the problem.",
    sample:
      "Two community members escalated a conflict. One party made a public accusation, the other responded with harassment. 45/55 fault split.",
    whenNotTo:
      "When one party was clearly the sole cause and the other was entirely innocent. Shared fault should not erase real harm.",
    evidence: ["Communication records", "Witness accounts", "Timeline of events", "Policy documents"],
  },
  {
    id: "conditional_approval",
    name: "Conditional Approval",
    color: "lavender",
    icon: "✅",
    tagline: "Best when something is acceptable only with corrections.",
    explanation:
      "Conditional approval grants partial or full recognition subject to specific, verifiable conditions being met. It is not a yes or a no.",
    sample:
      "A grant proposal is technically sound but lacks an adoption plan. Approve 80% now, hold 20% pending a public roadmap within 30 days.",
    whenNotTo:
      "When conditions would be impossible to verify or enforce. Don't use conditional approval to delay a real rejection.",
    evidence: ["Proposal document", "Evaluation criteria", "Prior submissions", "Comparable approvals"],
  },
  {
    id: "staged_release",
    name: "Staged Release",
    color: "gold",
    icon: "📦",
    tagline: "Best when progress exists but further proof is needed.",
    explanation:
      "Staged release distributes funds in tranches tied to milestones. It rewards current progress while holding future funds accountable to future proof.",
    sample:
      "A team delivered a working testnet but not a mainnet deployment. Release 50% now. Hold 50% pending mainnet launch within 60 days.",
    whenNotTo:
      "When the staged conditions are too vague to evaluate fairly. Conditions must be specific and binary.",
    evidence: ["Milestone definition", "Progress documentation", "Independent verification", "Timeline history"],
  },
  {
    id: "revision_required",
    name: "Revision Required",
    color: "bluegrey",
    icon: "🔧",
    tagline: "Best when the output can still be repaired.",
    explanation:
      "Revision required pauses settlement and gives the responsible party a window to correct the issue. No payout until the problem is addressed.",
    sample:
      "Design files are structurally correct but missing responsive breakpoints. No payout until responsive variants are delivered within 10 days.",
    whenNotTo:
      "When the core output is fundamentally wrong and revision would be equivalent to starting over.",
    evidence: ["Original brief", "Current output", "Gap analysis", "Revision feasibility assessment"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Middle Outcome Templates</p>
        <h1 className="font-display text-4xl text-parchment">Forms of the Fair Middle</h1>
        <p className="text-parchment/50 text-sm mt-2 max-w-xl">
          Mandorla supports multiple outcome types. A binary result is valid — but it is not the default.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template: t }: { template: typeof TEMPLATES[0] }) {
  const colorMap: Record<string, string> = {
    gold: "border-gold/30 text-gold",
    apricot: "border-apricot/30 text-apricot",
    faultrose: "border-faultrose/30 text-faultrose",
    lavender: "border-lavender/30 text-lavender",
    bluegrey: "border-bluegrey/30 text-bluegrey",
  };
  const borderTop: Record<string, string> = {
    gold: "border-t-gold",
    apricot: "border-t-apricot",
    faultrose: "border-t-faultrose",
    lavender: "border-t-lavender",
    bluegrey: "border-t-bluegrey",
  };

  return (
    <div className={`panel p-6 md:p-8 border-t-2 ${borderTop[t.color]}`}>
      <div className="flex items-start gap-4 mb-4">
        <span className="text-3xl mt-1">{t.icon}</span>
        <div>
          <h2 className={`font-display text-2xl ${colorMap[t.color].split(" ")[1]}`}>{t.name}</h2>
          <p className="text-parchment/50 text-sm mt-1 italic">{t.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="flex flex-col gap-4">
          <section>
            <h3 className="text-xs font-mono text-parchment/40 uppercase tracking-wider mb-2">Explanation</h3>
            <p className="text-sm text-parchment/70 leading-relaxed">{t.explanation}</p>
          </section>
          <section>
            <h3 className="text-xs font-mono text-parchment/40 uppercase tracking-wider mb-2">Sample Case</h3>
            <p className="text-sm text-parchment/60 leading-relaxed italic border-l-2 border-gold/20 pl-3">
              {t.sample}
            </p>
          </section>
        </div>
        <div className="flex flex-col gap-4">
          <section>
            <h3 className="text-xs font-mono text-faultrose/60 uppercase tracking-wider mb-2">When Not to Use</h3>
            <p className="text-sm text-parchment/60 leading-relaxed">{t.whenNotTo}</p>
          </section>
          <section>
            <h3 className="text-xs font-mono text-parchment/40 uppercase tracking-wider mb-2">Likely Evidence Needed</h3>
            <ul className="flex flex-col gap-1">
              {t.evidence.map((e) => (
                <li key={e} className="text-sm text-parchment/60 flex gap-2">
                  <span className="text-gold/50 mt-0.5">◆</span>
                  {e}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
