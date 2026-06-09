"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "./components/Nav";

export default function Home() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div
        className="relative flex h-svh items-end justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#241F19]/80 via-transparent to-transparent" />

        <div className="relative z-10 w-full px-6 pb-16 text-center sm:pb-24">
          <h1 className="mb-6 text-[clamp(3.5rem,14vw,9rem)] font-black uppercase leading-[0.82] tracking-tight text-[#EEF083] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            Proof of Alpha
          </h1>
          <p className="mx-auto mb-10 max-w-md font-mono text-sm text-[#d8d4a1]/90">
            Pick your meme archetype, enter with 100&nbsp;$TEST, bluff your target in 10 seconds.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="border-2 border-[#EEF083] bg-[#EEF083] px-12 py-4 text-lg font-black uppercase tracking-[0.18em] text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#241F19] text-[#EEF083]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(238,240,131,0.06)_1px,transparent_1px),linear-gradient(rgba(238,240,131,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 scanlines" />
      </div>

      <div className="relative z-10">
        <Nav />

        <section className="flex min-h-[calc(100vh-64px)] items-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 inline-block bg-[#EEF083] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#241F19]">
              On-chain dominance test · Solana devnet
            </p>
            <h1 className="glitch mb-8 text-[clamp(3.5rem,12vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
              Proof
              <br />
              of Alpha.
            </h1>
            <p className="mb-10 max-w-2xl text-lg font-semibold leading-8 text-[#d8d4a1] sm:text-xl">
              Pick your meme archetype, enter with 100&nbsp;$TEST, bluff your target in 10 seconds.
              Every elimination is permanent and on-chain.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="border-2 border-[#EEF083] bg-[#EEF083] px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
                href="/mode-select"
              >
                Play Now
              </Link>
              <Link
                className="border-2 border-[#91897C] px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-[#EEF083] shadow-[6px_6px_0_#91897C] transition hover:border-[#EEF083]"
                href="/how-to-play"
              >
                How to Play
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
