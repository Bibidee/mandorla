import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 mb-8 opacity-30">
        <svg viewBox="0 0 96 96">
          <circle cx="34" cy="48" r="26" fill="#C07A5A" fillOpacity="0.5"/>
          <circle cx="62" cy="48" r="26" fill="#C9B8D8" fillOpacity="0.5"/>
        </svg>
      </div>
      <h1 className="font-display text-4xl text-parchment mb-3">The fair middle has not been found.</h1>
      <p className="text-parchment/40 text-sm mb-8">This page does not exist — or the overlap has not been mapped yet.</p>
      <Link href="/" className="px-6 py-2.5 rounded-lg bg-gold text-inkbrown text-sm font-semibold hover:bg-apricot transition-colors">
        Return to Mandorla
      </Link>
    </div>
  );
}
