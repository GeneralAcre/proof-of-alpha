"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ARCHETYPES } from "./lib/archetypes";
import { useWallet } from "./components/WalletProvider";
import { Nav } from "./components/Nav";

const TICKER_ITEMS = [
  { label: "On-chain PvP",       value: "Solana devnet" },
  { label: "Powered by",         value: "MagicBlock ER" },
  { label: "Starting balance",   value: "100 $TEST" },
  { label: "Round timer",        value: "10 seconds" },
  { label: "First to",           value: "3 round wins" },
  { label: "Free archetypes",    value: "NPC + Wojak" },
];

const HOW_TO_PLAY = [
  {
    step: "01",
    title: "Connect Wallet",
    desc: "Use Solana Mobile or any Wallet Standard wallet to authorize on devnet. No gas needed to start.",
  },
  {
    step: "02",
    title: "Pick Your Archetype",
    desc: "Choose from 6 meme archetypes. Start free with NPC or Wojak. Unlock rarer ones with Sigma Points.",
  },
  {
    step: "03",
    title: "Bluff, Eliminate, Dominate",
    desc: "10-second rounds. Hidden bluffs. Simultaneous reveal. Every elimination is on-chain. First to 3 wins.",
  },
];

export default function Home() {
  const router = useRouter();
  const { account } = useWallet();

  useEffect(() => {
    if (account) router.push("/dashboard");
  }, [account, router]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#241F19] text-[#EEF083]">
      {/* Fixed background: grid + scanlines */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(238,240,131,0.06)_1px,transparent_1px),linear-gradient(rgba(238,240,131,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 scanlines" />
      </div>

      <div className="relative z-10">
        <Nav />

        {/* ── HERO ── */}
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
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
              href="/dashboard"
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
        </section>

        {/* ── LIVE STATS TICKER ── */}
        <div className="overflow-hidden border-y border-[#91897C] bg-[#2f2922] py-3">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 px-8 font-mono text-xs uppercase tracking-[0.16em]"
              >
                <span className="live-dot inline-block h-1.5 w-1.5 bg-[#EEF083]" />
                <span className="text-[#91897C]">{item.label}</span>
                <span className="font-black text-[#EEF083]">{item.value}</span>
                <span className="text-[#91897C]">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── ARCHETYPE PREVIEW ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">
            Choose your fighter
          </p>
          <h2 className="mb-8 text-3xl font-black uppercase">6 Archetypes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ARCHETYPES.map((a) => (
              <div
                key={a.id}
                className={`border bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C] transition-opacity ${
                  a.unlockCost > 0 ? "border-[#91897C] opacity-60" : "border-[#EEF083]"
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center border border-[#EEF083] bg-[#EEF083]/10 font-mono text-xl font-black text-[#EEF083]">
                  {a.initials}
                </div>
                <p className="text-base font-black uppercase">{a.name}</p>
                <p className="mt-0.5 text-xs text-[#91897C]">{a.role}</p>
                <p className="mt-2 font-mono text-xs">
                  {a.unlockCost > 0 ? (
                    <span className="text-[#91897C]">{a.unlockCost.toLocaleString()} σ to unlock</span>
                  ) : (
                    <span className="text-[#EEF083]">Free</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW TO PLAY ── */}
        <section className="border-t border-[#91897C] mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">
            Quick start
          </p>
          <h2 className="mb-10 text-3xl font-black uppercase">How to Play</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_TO_PLAY.map(({ step, title, desc }) => (
              <div
                key={step}
                className="border border-[#91897C] bg-[#2f2922] p-6 shadow-[6px_6px_0_#91897C]"
              >
                <p className="mb-4 font-mono text-5xl font-black text-[#EEF083]/20">{step}</p>
                <p className="mb-2 text-lg font-black uppercase">{title}</p>
                <p className="text-sm leading-6 text-[#d8d4a1]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#91897C] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#EEF083]">
              Proof of Alpha
            </p>
            <div className="flex gap-3">
              <span className="border border-[#91897C] bg-[#2f2922] px-3 py-2 font-mono text-xs font-black uppercase text-[#EEF083]">
                Built on Solana
              </span>
              <span className="border border-[#91897C] bg-[#2f2922] px-3 py-2 font-mono text-xs font-black uppercase text-[#EEF083]">
                Powered by MagicBlock ER
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
