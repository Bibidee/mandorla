"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RespondPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    agree_with: "",
    dispute: "",
    missing_context: "",
    fair_outcome: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const inputCls =
    "bg-aubergine border border-lavender/20 rounded-lg px-3 py-2.5 text-sm text-parchment focus:outline-none focus:border-gold/50 placeholder:text-parchment/20 w-full resize-none";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Respondent Reply</p>
        <h1 className="font-display text-4xl text-parchment leading-tight">
          Add the other truth.
        </h1>
        <p className="text-parchment/50 text-sm mt-3 leading-relaxed">
          You have been named as the respondent in this case. You are not required to confess or capitulate — you are invited to add your perspective.
        </p>
      </div>

      <div className="panel p-6 md:p-8 flex flex-col gap-6">
        <Field label="What do you agree with?" hint="Start with common ground. It builds trust with validators.">
          <textarea
            className={inputCls}
            rows={3}
            value={form.agree_with}
            onChange={(e) => update("agree_with", e.target.value)}
            placeholder="What parts of the claimant's account are accurate?"
          />
        </Field>

        <Field label="What do you dispute?" hint="Be specific. Vague denial weakens your position.">
          <textarea
            className={inputCls}
            rows={3}
            value={form.dispute}
            onChange={(e) => update("dispute", e.target.value)}
            placeholder="What parts of the claim are inaccurate or misleading?"
          />
        </Field>

        <Field label="What context is missing?" hint="What does the claimant's account leave out?">
          <textarea
            className={inputCls}
            rows={3}
            value={form.missing_context}
            onChange={(e) => update("missing_context", e.target.value)}
            placeholder="What background, history, or nuance would change the picture?"
          />
        </Field>

        <Field label="What outcome would be fair?" hint="A proportional answer is more credible than demanding zero accountability.">
          <textarea
            className={inputCls}
            rows={3}
            value={form.fair_outcome}
            onChange={(e) => update("fair_outcome", e.target.value)}
            placeholder="What result would you consider just — and why?"
          />
        </Field>

        <p className="text-xs text-parchment/30 italic border-t border-lavender/10 pt-4">
          "Add the part of the story the other side cannot see."
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-lavender/20 text-parchment/60 text-sm hover:border-lavender/40 hover:text-parchment transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors"
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-parchment/80">{label}</label>
      {hint && <p className="text-xs text-parchment/35">{hint}</p>}
      {children}
    </div>
  );
}
