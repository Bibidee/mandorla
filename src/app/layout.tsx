import type { Metadata } from "next";
import "./globals.css";
import { MandorlaShell } from "@/components/MandorlaShell";

export const metadata: Metadata = {
  title: "Mandorla — Fair Middle Protocol",
  description:
    "A GenLayer shared-decision protocol for disputes and reviews that should not be reduced to yes or no.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MandorlaShell>{children}</MandorlaShell>
      </body>
    </html>
  );
}
