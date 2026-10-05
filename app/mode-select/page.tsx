"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";

function ModeSelectContent() {
  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">
          Step 1 of 3
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase sm:text-5xl">Select Mode</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          {/* ── SOLO — active ── */}
          <div className="border-2 border-[#5e548e] bg-[#5e548e] p-6 text-left shadow-[6px_6px_0_#716a7e]">
            <p className="text-2xl font-black uppercase text-[#231942]">Solo</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#231942]/70">
              Available Now
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#231942]">
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
          <div className="relative border-2 border-[#170b2e] bg-white p-6 text-left opacity-60 cursor-not-allowed select-none">
            {/* Coming soon badge */}
            <div className="absolute right-4 top-4 border border-[#ddd6ea] bg-[#f8f7fc] px-2 py-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]">Coming Soon</span>
            </div>

            <p className="text-2xl font-black uppercase text-[#716a7e]">Multiplayer</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#170b2e]">
              Full Points · On-chain
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[#716a7e]">
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
          className="block border-2 border-[#5e548e] bg-[#5e548e] px-6 py-4 text-center text-lg font-black uppercase text-white shadow-[6px_6px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
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
    <Suspense fallback={<div className="min-h-screen bg-[#f8f7fc]" />}>
      <ModeSelectContent />
    </Suspense>
  );
}
