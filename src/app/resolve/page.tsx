import { getAllCases } from "@/lib/contractData";
import { ResolveClient } from "./ResolveClient";

export const revalidate = 20;

export default async function ResolvePage() {
  const all = await getAllCases();
  const ready = all.filter(c => c.status === "ready_for_resolution");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-parchment/40 mb-2 uppercase tracking-wider">Resolution Console</p>
        <h1 className="font-display text-4xl text-parchment">Cases Ready for Resolution</h1>
        <p className="text-parchment/50 text-sm mt-2">
          {ready.length} {ready.length === 1 ? "case" : "cases"} waiting for GenLayer validators to map the fair middle.
        </p>
      </div>
      <ResolveClient ready={ready} />
    </div>
  );
}
