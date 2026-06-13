"use client";

import Image from "next/image";
import Link from "next/link";
import { Nav } from "../components/Nav";

const PARTNERS = [
  { name: "islandDAO", src: "/project/islanddao-wordmark-light.png" },
  { name: "Phantom",   src: "/project/Phantom-Logo-White.png" },
  { name: "SolBlaze",  src: "/project/solblaze_grayscale_transparent.png" },
  { name: "Solflare",  src: "/project/solflare-logo.png" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#24153E] text-[#E4D474]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(228,212,116,0.06)_1px,transparent_1px),linear-gradient(rgba(228,212,116,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 scanlines" />
      </div>

      <div className="relative z-10">
        <Nav />

        {/* ── Partner marquee ── */}
        <section className="overflow-hidden border-b border-[#a09ab8]/25 bg-[#0a0820]">
          <div className="flex items-center">
            <div className="shrink-0 border-r border-[#a09ab8]/25 px-3 py-3 sm:px-5 sm:py-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white font-black">Built with</p>
            </div>
            <div className="overflow-hidden flex-1">
              <div
                className="flex items-center whitespace-nowrap py-3 sm:py-4"
                style={{ animation: "ticker 10s linear infinite" }}
              >
                {Array.from({ length: 8 }, () => PARTNERS).flat().map((p, i) => (
                  <span key={i} className="inline-flex shrink-0 items-center px-6 sm:px-12">
                    <Image
                      src={p.src}
                      alt={p.name}
                      height={0}
                      width={0}
                      sizes="200px"
                      className="h-5 w-auto object-contain brightness-200 opacity-90 transition-opacity hover:opacity-100 sm:h-8"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:px-12">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* Left — text */}
            <div className="flex-1">
              <p className="mb-5 inline-block bg-[#E4D474] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#24153E]">
                AURA-powered · Solana devnet
              </p>
              <h1 className="glitch mb-6 font-black uppercase leading-[0.85] tracking-tight text-[clamp(3rem,9vw,7rem)]">
                Proof
                <br />
                of Alpha.
              </h1>
              <p className="mb-3 max-w-lg text-base leading-8 text-[#ffffff] sm:text-lg">
                Pick your archetype. Spend AURA to approach. Charm her in 4 messages or get shut down on-chain.
              </p>
              <p className="mb-8 max-w-md font-mono text-sm leading-6 text-[#a09ab8]">
                Every opener, every flex, every close — recorded on Solana. Earn AURA back by winning.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="border-2 border-[#E4D474] bg-[#E4D474] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#24153E] shadow-[5px_5px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
                  href="/character-select"
                >
                  Play Now
                </Link>
                <Link
                  className="border-2 border-[#a09ab8] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#E4D474] shadow-[5px_5px_0_#a09ab8] transition hover:border-[#E4D474] touch-manipulation"
                  href="/how-to-play"
                >
                  How to Play
                </Link>
              </div>
            </div>

            {/* Right — character */}
            <div className="relative mx-auto w-64 shrink-0 sm:w-80 lg:w-96">
              <div className="relative overflow-hidden border border-[#a09ab8]/30" style={{ aspectRatio: "3/4" }}>
                <Image
                  src="/charecter/alpha-charecter.png"
                  alt="Alpha"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 384px"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#24153E]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 border border-[#E4D474]/30 bg-[#24153E]/70 px-3 py-1.5 backdrop-blur-sm">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#a09ab8]">Your guide</p>
                  <p className="font-mono text-xs font-black text-[#E4D474]">Alpha</p>
                </div>
              </div>
              <div className="absolute -right-2 -top-2 h-8 w-8 border-r-2 border-t-2 border-[#E4D474]/40" />
              <div className="absolute -bottom-2 -left-2 h-8 w-8 border-b-2 border-l-2 border-[#E4D474]/40" />
            </div>
          </div>
        </section>

        {/* ── Feature row ── */}
        <section className="border-t border-[#a09ab8]/20">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
            <div className="grid grid-cols-1 gap-px bg-[#a09ab8]/15 sm:grid-cols-3">
              {[
                { n: "15", label: "Girl Archetypes",  sub: "5 per difficulty tier" },
                { n: "4",  label: "Messages",         sub: "Then pick your closer" },
                { n: "3×", label: "Max Streak Boost", sub: "Win streaks multiply AURA" },
              ].map((f) => (
                <div key={f.n} className="bg-[#24153E] px-8 py-8">
                  <p className="font-black text-[clamp(2.5rem,5vw,4rem)] leading-none text-[#E4D474]">{f.n}</p>
                  <p className="mt-1 font-black uppercase text-sm text-[#E4D474]">{f.label}</p>
                  <p className="mt-1 font-mono text-xs text-[#a09ab8]">{f.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
