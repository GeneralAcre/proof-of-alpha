"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import {
  SCENARIOS,
  SCENARIO_DIFF_LABEL,
  SCENARIO_CATEGORY_LABEL,
  type Scenario,
  type ScenarioDifficulty,
} from "../lib/scenarios";

const AURA_KEY = (addr: string) => `poa_aura_${addr}`;

const DIFF_ACCENT: Record<ScenarioDifficulty, string> = {
  easy:   "#E4D474",
  medium: "#a09ab8",
  hard:   "#9945FF",
};

function ScenarioCard({ scenario, aura, addr, archetype, onEnter }: {
  scenario: Scenario;
  aura: number;
  addr: string | null;
  archetype: string;
  onEnter: (s: Scenario) => void;
}) {
  const accent     = DIFF_ACCENT[scenario.difficulty];
  const canAfford  = aura >= scenario.approachCost;
  const label      = SCENARIO_DIFF_LABEL[scenario.difficulty];
  const category   = SCENARIO_CATEGORY_LABEL[scenario.category];

  return (
    <div
      className="relative flex flex-col justify-between border border-[#E4D474]/10 p-5 sm:p-6"
      style={{ backgroundColor: "#24153E", minHeight: "clamp(180px, 28vw, 240px)" }}
    >
      {/* Grid overlay */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`gp-${scenario.id}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0L0 0 0 22" fill="none" stroke="#E4D474" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#gp-${scenario.id})`} />
      </svg>

      {/* Top accent strip */}
      <div className="absolute left-0 right-0 top-0 h-0.5" style={{ backgroundColor: accent }} />

      {/* Header row */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-1">
        <div className="flex items-center gap-2">
          <span
            className="border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.22em]"
            style={{ borderColor: accent + "55", color: accent }}
          >
            {label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a09ab8]">
            {category}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-[#a09ab8]">
          {scenario.approachCost} AURA
        </span>
      </div>

      {/* Title + subtitle */}
      <div className="relative z-10 mt-4 flex-1">
        <h3
          className="font-black uppercase leading-[0.9] tracking-tight"
          style={{ color: accent, fontSize: "clamp(14px, 2vw + 6px, 26px)" }}
        >
          {scenario.title}
        </h3>
        <p className="mt-2 font-mono text-[11px] italic leading-4 text-[#a09ab8] line-clamp-2 sm:text-xs">
          {scenario.subtitle}
        </p>
      </div>

      {/* Reward row */}
      <div className="relative z-10 mt-4 flex gap-2 border-t border-[#a09ab8]/20 pt-3">
        <div className="flex-1 text-center">
          <p className="font-mono text-[8px] uppercase tracking-wide text-[#a09ab8]">Own It</p>
          <p className="font-mono text-sm font-black" style={{ color: accent }}>+{scenario.ownItWin}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="font-mono text-[8px] uppercase tracking-wide text-[#a09ab8]">Play It Cool</p>
          <p className="font-mono text-sm font-black text-[#ffffff]">+{scenario.coolWin}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-4">
        {!addr ? (
          <button
            className="w-full border border-[#a09ab8]/50 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#a09ab8] opacity-60 cursor-not-allowed touch-manipulation"
            disabled
            type="button"
          >
            Connect Wallet
          </button>
        ) : canAfford ? (
          <button
            className="w-full py-2.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#24153E] transition hover:opacity-75 touch-manipulation"
            style={{ backgroundColor: accent }}
            onClick={() => onEnter(scenario)}
            type="button"
          >
            Practice — {scenario.approachCost} AURA
          </button>
        ) : (
          <button
            className="w-full border border-[#a09ab8]/30 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#a09ab8] opacity-50 cursor-not-allowed touch-manipulation"
            disabled
            type="button"
          >
            Need {scenario.approachCost} AURA
          </button>
        )}
      </div>
    </div>
  );
}

function ScenariosContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const { account } = useWallet();
  const addr      = account ? String(account.address) : null;
  const archetype = params.get("archetype") ?? (typeof window !== "undefined" ? localStorage.getItem("poa_last_archetype") ?? "alpha" : "alpha");

  const [aura, setAura] = useState(0);

  useEffect(() => {
    if (!addr) return;
    setAura(Number(localStorage.getItem(AURA_KEY(addr)) ?? "0") || 0);
  }, [addr]);

  function handleEnter(scenario: Scenario) {
    router.push(`/life?scenario=${scenario.id}&archetype=${archetype}`);
  }

  const easy   = SCENARIOS.filter((s) => s.difficulty === "easy");
  const medium = SCENARIOS.filter((s) => s.difficulty === "medium");
  const hard   = SCENARIOS.filter((s) => s.difficulty === "hard");

  return (
    <div className="min-h-screen bg-[#000F08] text-[#E4D474]">
      <Nav />

      <main className="px-4 py-10 sm:px-8">

        {/* Wallet gate */}
        {!addr && (
          <div className="mb-6 flex items-center justify-between gap-4 border border-[#E4D474]/30 bg-[#E4D474]/5 px-5 py-4">
            <div>
              <p className="font-black uppercase text-sm text-[#E4D474]">Connect your wallet to practice</p>
              <p className="font-mono text-xs text-[#a09ab8] mt-0.5">Real life costs AURA too.</p>
            </div>
            <div className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#a09ab8]">
              Use Connect in the nav
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <button
              onClick={() => router.push(`/play?archetype=${archetype}`)}
              className="mb-4 bg-[#E4D474] px-5 py-2 font-mono text-xs font-black uppercase tracking-widest text-[#24153E] transition hover:opacity-80 touch-manipulation"
              type="button"
            >
              Back
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Proof of Alpha</p>
            <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Field Manual</h1>
            <p className="mt-2 font-mono text-sm text-[#a09ab8]">
              Real scenarios. Real stakes. Practice before it matters.
            </p>
          </div>
          {addr && (
            <div className="shrink-0 border border-[#a09ab8]/30 px-4 py-2.5 text-right">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#a09ab8]">Your AURA</p>
              <p className="mt-0.5 font-mono text-2xl font-black leading-none text-[#E4D474]">{aura}</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mb-8 border border-[#a09ab8]/20 bg-[#24153E]/50 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8] mb-2">How It Works</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { step: "01", text: "Pick a scenario you struggle with" },
              { step: "02", text: "Chat 4 messages — the AI plays her" },
              { step: "03", text: "Choose your closer. Win AURA. Learn." },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="font-mono text-xs font-black text-[#E4D474] shrink-0">{step}</span>
                <p className="font-mono text-xs text-[#a09ab8]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closers legend */}
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]">
          <span><span className="text-[#E4D474] font-black">■</span> Own It — address head-on (high risk, high reward)</span>
          <span><span className="text-[#ffffff] font-black">■</span> Play It Cool — handle with grace (safer odds)</span>
          <span><span className="text-[#a09ab8] font-black">□</span> Sidestep — dodge & deflect (partial refund)</span>
        </div>

        {/* EASY tier */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] border border-[#E4D474]/40 text-[#E4D474] px-2 py-0.5">
              Rookie — Easy
            </span>
            <div className="flex-1 h-px bg-[#E4D474]/10" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {easy.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                aura={aura}
                addr={addr}
                archetype={archetype}
                onEnter={handleEnter}
              />
            ))}
          </div>
        </div>

        {/* MEDIUM tier */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] border border-[#a09ab8]/40 text-[#a09ab8] px-2 py-0.5">
              Tested — Medium
            </span>
            <div className="flex-1 h-px bg-[#a09ab8]/10" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {medium.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                aura={aura}
                addr={addr}
                archetype={archetype}
                onEnter={handleEnter}
              />
            ))}
          </div>
        </div>

        {/* HARD tier */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] border border-[#9945FF]/40 text-[#9945FF] px-2 py-0.5">
              Hard Mode
            </span>
            <div className="flex-1 h-px bg-[#9945FF]/10" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {hard.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                aura={aura}
                addr={addr}
                archetype={archetype}
                onEnter={handleEnter}
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000F08]" />}>
      <ScenariosContent />
    </Suspense>
  );
}
