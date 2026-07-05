import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Protocol Explanation</p>
        <h1 className="font-display text-5xl text-parchment leading-tight mb-4">
          What is <em className="text-gold not-italic">Mandorla</em>?
        </h1>
        <p className="text-parchment/60 text-lg leading-relaxed">
          A GenLayer protocol for resolving ambiguous claims through proportional outcomes instead of binary winners.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        <Section title="The Problem">
          <p>
            Most smart contracts work when the condition is binary: paid or unpaid, delivered or not, yes or no.
          </p>
          <p>
            But real human agreements are rarely binary. Work is often useful but incomplete. Delays are real but partly justified. Claims are valid but exaggerated. Both parties can be partly right at the same time.
          </p>
          <p>
            A traditional deterministic contract cannot fairly resolve that. It picks a winner even when neither deserves to win completely.
          </p>
        </Section>

        <Section title="The Mandorla Approach">
          <p>
            Mandorla asks a different question: given the claim, counterclaim, agreement, evidence, and context — what proportional outcome best reflects the overlapping truths?
          </p>
          <p>
            This is a GenLayer use case because proportional fairness is not deterministic. Validators must interpret facts, intent, performance, damage, effort, context, and ambiguity — and reach consensus on a canonical structured result.
          </p>
        </Section>

        <div className="panel p-6">
          <h3 className="font-display text-xl text-gold mb-4">Why "Mandorla"?</h3>
          <p className="text-parchment/70 text-sm leading-relaxed">
            A mandorla is the almond-shaped intersection formed when two circles overlap. In religious art, it appears as the space where the human and divine meet — neither one, neither the other, but a third thing created by their meeting.
          </p>
          <p className="text-parchment/70 text-sm leading-relaxed mt-3">
            For dispute resolution, it is the zone where two truths overlap. The fair middle does not belong entirely to either side. It exists in the intersection.
          </p>
        </div>

        <Section title="Outcome Types">
          <p>Mandorla supports multiple forms of resolution. Binary outcomes are allowed but not the default mental model.</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              ["Split Payout", "clay"],
              ["Partial Credit", "apricot"],
              ["Shared Fault", "faultrose"],
              ["Conditional Approval", "lavender"],
              ["Staged Release", "gold"],
              ["Revision Required", "bluegrey"],
              ["Insufficient Evidence", "bluegrey"],
              ["Mutual Concession", "lavender"],
            ].map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: `var(--color-${color})` }} />
                <span className="text-sm text-parchment/70">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What Mandorla is Not">
          <ul className="flex flex-col gap-2">
            {[
              "Not a court replacement",
              "Not a prediction market",
              "Not an escrow clone",
              "Not a voting app",
              "Not a yes/no dispute machine",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-parchment/60 text-sm">
                <span className="text-faultrose/60">✕</span> {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How GenLayer Powers This">
          <p>
            GenLayer's Equivalence Principle allows multiple validators to reason independently over the same inputs and reach consensus even when their reasoning paths differ. This is what makes proportional fairness possible on-chain.
          </p>
          <p>
            Each case resolution runs a non-deterministic validator prompt that evaluates both positions, weighs evidence, and returns a canonical JSON result. The contract stores the consensus result and uses it to calculate settlement.
          </p>
        </Section>

        <div className="flex gap-4 pt-4 border-t border-lavender/10">
          <Link href="/cases/new" className="px-6 py-3 rounded-xl bg-gold text-inkbrown font-semibold text-sm hover:bg-apricot transition-colors">
            Open a Case
          </Link>
          <Link href="/templates" className="px-6 py-3 rounded-xl border border-lavender/20 text-parchment/60 text-sm hover:border-lavender/40 hover:text-parchment transition-colors">
            Browse Templates
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-parchment mb-4">{title}</h2>
      <div className="flex flex-col gap-3 text-parchment/65 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
