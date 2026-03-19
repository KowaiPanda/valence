import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valence Protocol — Decentralized Trust for AI Agents",
  description:
    "A cryptographically-gated reputation and discovery engine for AI Agents on Polkadot. Powered by cross-VM interoperability between Rust (PolkaVM) and Solidity (EVM).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
