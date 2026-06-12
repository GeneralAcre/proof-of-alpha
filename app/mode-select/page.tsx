"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";

function ModeSelectContent() {
  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
          Step 1 of 3
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase sm:text-5xl">Select Mode</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          {/* ── SOLO — active ── */}
          <div className="border-2 border-[#E4D474] bg-[#E4D474] p-6 text-left shadow-[6px_6px_0_#a09ab8]">
            <p className="text-2xl font-black uppercase text-[#24153E]">Solo</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#24153E]/70">
              Available Now
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#24153E]">
              {[
                "Instant — no wait",
                "Chat with 3 AI Girls",
                "Earn AURA each session",
                "Good for practice",
              ].map((t) => (
                <li key={t} className="flex gap-2"><span className="shrink-0">—</span>{t}</li>
              ))}
            </ul>
          </div>

          {/* ── MULTIPLAYER — coming soon ── */}
          <div className="relative border-2 border-[#170b2e] bg-[#2d1a4a] p-6 text-left opacity-60 cursor-not-allowed select-none">
            {/* Coming soon badge */}
            <div className="absolute right-4 top-4 border border-[#a09ab8] bg-[#24153E] px-2 py-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a09ab8]">Coming Soon</span>
            </div>

            <p className="text-2xl font-black uppercase text-[#a09ab8]">Multiplayer</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#170b2e]">
              Full Points · On-chain
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#a09ab8]">
              {[
                "Up to 5 human players",
                "AI fills empty slots",
                "Full 1× AURA rewards",
                "Ranked on-chain",
              ].map((t) => (
                <li key={t} className="flex gap-2"><span className="shrink-0">—</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── SOLO CTA ── */}
        <Link
          className="block border-2 border-[#E4D474] bg-[#E4D474] px-6 py-4 text-center text-lg font-black uppercase text-[#24153E] shadow-[6px_6px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
          href="/character-select?mode=solo"
        >
          Play Solo Now
        </Link>

      </main>
    </div>
  );
}

export default function ModeSelectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#24153E]" />}>
      <ModeSelectContent />
    </Suspense>
  );
}
