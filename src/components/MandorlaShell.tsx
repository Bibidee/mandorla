"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ConnectWallet } from "./ConnectWallet";

const NAV = [
  { href: "/cases", label: "Observatory" },
  { href: "/resolve", label: "Resolve" },
  { href: "/settlements", label: "Settlements" },
  { href: "/templates", label: "Templates" },
  { href: "/about", label: "About" },
];

export function MandorlaShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-lavender/10 bg-aubergine/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <MandorlaLogo />
            <span className="font-display text-xl font-semibold text-parchment tracking-tight group-hover:text-gold transition-colors">
              Mandorla
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "text-sm transition-colors",
                  path.startsWith(n.href)
                    ? "text-gold"
                    : "text-parchment/60 hover:text-parchment"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ConnectWallet />
            <Link
              href="/cases/new"
              className="px-4 py-2 rounded-lg bg-gold text-inkbrown text-sm font-medium hover:bg-apricot transition-colors"
            >
              Open a Case
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-lavender/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-parchment/40 text-sm font-mono">
            Mandorla Protocol — GenLayer
          </p>
          <p className="text-parchment/30 text-xs italic">
            Not every dispute has one clean winner.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MandorlaLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="10" cy="14" r="9" fill="#C07A5A" fillOpacity="0.5" />
      <circle cx="18" cy="14" r="9" fill="#C9B8D8" fillOpacity="0.5" />
      <path
        d="M14 5.5 C10.5 8.5 10.5 19.5 14 22.5 C17.5 19.5 17.5 8.5 14 5.5Z"
        fill="#D8A84F"
        fillOpacity="0.85"
      />
    </svg>
  );
}
