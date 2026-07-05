import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(192,122,90,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(201,184,216,0.08) 0%, transparent 55%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-gold/70 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" style={{ animation: "pulse-slow 3s infinite" }} />
            GenLayer Protocol
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold text-parchment leading-tight tracking-tight">
            When two truths overlap,{" "}
            <em className="text-gold not-italic">Mandorla</em>{" "}
            finds the fair middle.
          </h1>

          <p className="text-lg text-parchment/60 max-w-2xl leading-relaxed">
            A GenLayer shared-decision protocol for disputes and reviews that should not be reduced to yes or no.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/cases/new"
              className="px-8 py-3.5 rounded-xl bg-gold text-inkbrown font-semibold text-base hover:bg-apricot transition-colors gold-glow-sm"
            >
              Open a Case
            </Link>
            <Link
              href="/templates"
              className="px-8 py-3.5 rounded-xl border border-lavender/30 text-parchment/70 font-medium text-base hover:border-lavender/60 hover:text-parchment transition-colors"
            >
              Explore Middle Outcomes
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative z-10 mt-20 w-full max-w-lg mx-auto">
          <HeroOverlapSVG />
        </div>
      </section>

      {/* Three zones */}
      <section className="py-24 px-4 max-w-6xl mx-auto w-full">
        <h2 className="font-display text-3xl md:text-4xl text-parchment text-center mb-4">
          The Overlap Chamber
        </h2>
        <p className="text-parchment/50 text-center max-w-xl mx-auto mb-14 text-sm">
          Every case maps two truths onto a shared field. The fair middle lives in the overlap.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="panel p-6 flex flex-col gap-3">
            <div className="w-3 h-3 rounded-full bg-clay" />
            <h3 className="font-display text-xl text-parchment">Claimant Truth</h3>
            <p className="text-parchment/50 text-sm leading-relaxed">The claimant's position, evidence, and requested outcome enter from the left.</p>
          </div>
          <div className="panel p-6 flex flex-col gap-3 border-gold/20" style={{ background: "linear-gradient(135deg, #4B2E4F 0%, rgba(216,168,79,0.05) 100%)" }}>
            <div className="w-3 h-3 rounded-full bg-gold" />
            <h3 className="font-display text-xl text-gold">Fair Middle</h3>
            <p className="text-parchment/50 text-sm leading-relaxed">Validators identify the proportional outcome — not a coin flip, but a reasoned overlap.</p>
          </div>
          <div className="panel p-6 flex flex-col gap-3">
            <div className="w-3 h-3 rounded-full bg-lavender" />
            <h3 className="font-display text-xl text-parchment">Respondent Truth</h3>
            <p className="text-parchment/50 text-sm leading-relaxed">The respondent's position and counter-evidence enter from the right.</p>
          </div>
        </div>
      </section>

      {/* Microcopy */}
      <section className="py-16 border-t border-lavender/10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            "Not every dispute has one clean winner.",
            "Mandorla does not split by default. It weighs proportion.",
            "Uncertainty is recorded instead of hidden.",
            "A middle outcome can still be firm.",
            "The fair result may be 80/20, 60/40, conditional, or no payout.",
            "Add the part of the story the other side cannot see.",
          ].map((q) => (
            <blockquote key={q} className="text-parchment/50 text-base italic leading-relaxed pl-4 border-l-2 border-gold/30">
              {q}
            </blockquote>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 px-4 max-w-6xl mx-auto w-full">
        <h2 className="font-display text-3xl text-parchment mb-12 text-center">
          Built for ambiguous agreements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="panel-dark p-5 flex flex-col gap-2 rounded-xl">
              <span className="text-2xl">{u.icon}</span>
              <h4 className="font-display text-parchment text-lg">{u.title}</h4>
              <p className="text-parchment/50 text-sm leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center border-t border-lavender/10">
        <h2 className="font-display text-4xl text-parchment mb-4">Ready to map the overlap?</h2>
        <p className="text-parchment/50 mb-8 max-w-md mx-auto text-sm">
          Open a shared-decision case and let proportional fairness replace binary judgment.
        </p>
        <Link href="/cases/new" className="inline-block px-10 py-4 rounded-xl bg-gold text-inkbrown font-semibold text-lg hover:bg-apricot transition-colors gold-glow">
          Open a Case
        </Link>
      </section>
    </div>
  );
}

function HeroOverlapSVG() {
  const W = 480, H = 240, r = 100, cy = H / 2;
  const cx1 = W * 0.36, cx2 = W * 0.64;
  const d = cx2 - cx1;
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const mx = W / 2;
  const path = `M ${mx} ${cy - h} A ${r} ${r} 0 0 1 ${mx} ${cy + h} A ${r} ${r} 0 0 1 ${mx} ${cy - h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="hcg" cx="40%" cy="50%"><stop offset="0%" stopColor="#C07A5A" stopOpacity="0.55"/><stop offset="100%" stopColor="#C07A5A" stopOpacity="0.05"/></radialGradient>
        <radialGradient id="hlg" cx="60%" cy="50%"><stop offset="0%" stopColor="#C9B8D8" stopOpacity="0.55"/><stop offset="100%" stopColor="#C9B8D8" stopOpacity="0.05"/></radialGradient>
        <radialGradient id="hgg" cx="50%" cy="50%"><stop offset="0%" stopColor="#D8A84F" stopOpacity="0.9"/><stop offset="100%" stopColor="#D8A84F" stopOpacity="0.35"/></radialGradient>
        <filter id="hglow"><feGaussianBlur stdDeviation="6" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
      </defs>
      <circle cx={cx1} cy={cy} r={r} fill="url(#hcg)" stroke="#C07A5A" strokeWidth="1" strokeOpacity="0.25"/>
      <circle cx={cx2} cy={cy} r={r} fill="url(#hlg)" stroke="#C9B8D8" strokeWidth="1" strokeOpacity="0.25"/>
      <path d={path} fill="url(#hgg)" filter="url(#hglow)"/>
      <path d={path} fill="none" stroke="#D8A84F" strokeWidth="1.5" strokeOpacity="0.7"/>
      <text x={mx} y={cy + 5} textAnchor="middle" fill="#241827" fontSize="9" fontWeight="700" fontFamily="IBM Plex Mono,monospace">fair middle</text>
      <text x={cx1 - 45} y={cy + r + 18} fill="#C07A5A" fontSize="10" fontFamily="IBM Plex Mono,monospace" opacity="0.8">claimant truth</text>
      <text x={cx2 + 5} y={cy + r + 18} fill="#C9B8D8" fontSize="10" fontFamily="IBM Plex Mono,monospace" opacity="0.8">respondent truth</text>
    </svg>
  );
}

const USE_CASES = [
  { icon: "💻", title: "Freelance Delivery", desc: "Work is useful but incomplete. Partial credit reflects both effort and shortfall." },
  { icon: "🏛", title: "DAO Compensation", desc: "Contributors hit some milestones but miss others. Proportional reward without full rejection." },
  { icon: "📊", title: "Grant Milestones", desc: "Technical progress without adoption. Staged release with conditions." },
  { icon: "⚖️", title: "Community Conflict", desc: "Both sides contributed to harm. Shared fault replaces one-sided blame." },
  { icon: "🛡", title: "Insurance Claims", desc: "Partial loss with exclusions. Reasoned payout without binary accept/reject." },
  { icon: "🤖", title: "AI Agent Tasks", desc: "Agent completed the task with deviations. Conditional reward with logged breach." },
];
