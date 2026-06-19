"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";

function PlayContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const archetype = params.get("archetype") ?? "alpha";

  return (
    <div className="min-h-screen bg-[#000F08] text-[#E4D474] flex flex-col">
      <Nav />

      <main className="flex flex-1 flex-col px-4 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push("/character-select")}
            className="mb-6 bg-[#E4D474] px-5 py-2 font-mono text-xs font-black uppercase tracking-widest text-[#24153E] transition hover:opacity-80 touch-manipulation"
            type="button"
          >
            Back
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Proof of Alpha</p>
          <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Choose Mode</h1>
          <p className="mt-2 font-mono text-sm text-[#a09ab8]">Two ways to earn AURA. Pick your game.</p>
        </div>

        {/* Cards */}
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">

          {/* ── Flirting Game ──────────────────────────────────────────────── */}
          <button
            className="group relative flex flex-col overflow-hidden border-2 border-[#E4D474]/25 bg-[#0d0820] text-left transition duration-200 hover:border-[#E4D474]/70 hover:bg-[#130e28] touch-manipulation"
            onClick={() => router.push(`/map?archetype=${archetype}`)}
            type="button"
          >
            {/* Grid pattern */}
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gp-f" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0L0 0 0 24" fill="none" stroke="#E4D474" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gp-f)" />
            </svg>

            {/* Top accent bar */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-[#E4D474] transition-all duration-200 group-hover:h-1.5" />

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col p-7 sm:p-8">

              <div className="mb-6">
                <span className="inline-block border border-[#E4D474]/40 bg-[#E4D474]/5 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.25em] text-[#E4D474]">
                  Rizz Mode
                </span>
              </div>

              <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight text-[#E4D474] sm:text-5xl">
                Flirting<br />Game
              </h2>

              <p className="mt-4 font-mono text-xs leading-6 text-[#a09ab8]">
                Approach AI girls across 7 venues. 4-message chat. Pick your closer. Win AURA on-chain.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "7 venues · 15 girl archetypes",
                  "Flirt / Flex / Leave closers",
                  "On-chain AURA rewards",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2.5 font-mono text-xs text-[#a09ab8]">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 bg-[#E4D474]" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <div className="inline-block border-2 border-[#E4D474] bg-[#E4D474] px-6 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-[#24153E] transition duration-150 group-hover:bg-transparent group-hover:text-[#E4D474]">
                  Enter Flirting Game
                </div>
              </div>
            </div>
          </button>

          {/* ── Situation Game ─────────────────────────────────────────────── */}
          <button
            className="group relative flex flex-col overflow-hidden border-2 border-[#9945FF]/25 bg-[#0d0820] text-left transition duration-200 hover:border-[#9945FF]/70 hover:bg-[#130e28] touch-manipulation"
            onClick={() => router.push(`/scenarios?archetype=${archetype}`)}
            type="button"
          >
            {/* Grid pattern */}
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gp-s" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0L0 0 0 24" fill="none" stroke="#9945FF" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gp-s)" />
            </svg>

            {/* Top accent bar */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-[#9945FF] transition-all duration-200 group-hover:h-1.5" />

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col p-7 sm:p-8">

              <div className="mb-6">
                <span className="inline-block border border-[#9945FF]/40 bg-[#9945FF]/5 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.25em] text-[#9945FF]">
                  Field Manual
                </span>
              </div>

              <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight text-[#9945FF] sm:text-5xl">
                Situation<br />Game
              </h2>

              <p className="mt-4 font-mono text-xs leading-6 text-[#a09ab8]">
                Real-life scenarios men can't handle: forgotten anniversaries, trip planning, conflict. Practice before it counts.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "9 real scenarios · 3 difficulty tiers",
                  "Own It / Play It Cool / Sidestep",
                  "AURA rewards for handling it right",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2.5 font-mono text-xs text-[#a09ab8]">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 bg-[#9945FF]" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <div className="inline-block border-2 border-[#9945FF] bg-[#9945FF] px-6 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-white transition duration-150 group-hover:bg-transparent group-hover:text-[#9945FF]">
                  Enter Situation Game
                </div>
              </div>
            </div>
          </button>

        </div>
      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000F08]" />}>
      <PlayContent />
    </Suspense>
  );
}
