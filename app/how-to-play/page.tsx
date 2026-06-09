"use client";

import Link from "next/link";
import { Nav } from "../components/Nav";
import { RANKS } from "../lib/archetypes";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const GAME_STEPS = [
  { n: "01", title: "Connect & Select",   desc: "Connect your Solana wallet, pick Solo or Multiplayer, then choose your archetype." },
  { n: "02", title: "Enter the Lobby",    desc: "Join a public room or create a private one. Each player starts with 100 $TEST." },
  { n: "03", title: "Play Rounds",        desc: "Choose a move, pick a target, confirm. Moves resolve simultaneously." },
  { n: "04", title: "Locker Room",        desc: "Between rounds: check the scoreboard, swap archetype, read the next modifier. 30 seconds." },
  { n: "05", title: "Last One Standing",  desc: "Match ends when one player holds all the $TEST. Winner earns Sigma Points." },
  { n: "06", title: "Rank Up",            desc: "Sigma Points accumulate across matches. Hit thresholds to unlock new archetypes." },
];

const MOVES = [
  { name: "Tax",     cost: "5 $TEST",  effect: "Take 5 $TEST from target. Safe and reliable.",             counter: "Counter" },
  { name: "Steal",   cost: "10 $TEST", effect: "Take 10 $TEST from target. Higher risk, higher reward.",   counter: "Counter" },
  { name: "Rob",     cost: "20 $TEST", effect: "Take 20 $TEST from target. Only works if uncountered.",    counter: "Counter" },
  { name: "Bluff",   cost: "Free",     effect: "Fake a big steal. If target wastes a Counter, you get +5.", counter: "Nothing — Bluff beats Counter" },
  { name: "Counter", cost: "5 $TEST",  effect: "Block any incoming Tax, Steal, or Rob. Cost refunded on success.", counter: "Bluff" },
  { name: "NUKE",    cost: "30 $TEST", effect: "Eliminate target instantly if their balance ≤ 30. High variance.",  counter: "Fold" },
  { name: "Fold",    cost: "Free",     effect: "Skip the round entirely. You cannot be nuked. Purely defensive.",   counter: "Nothing" },
];

const MODIFIERS = [
  { name: "Standard",    desc: "Normal rules, no special effects." },
  { name: "Greed Mode",  desc: "All successful steals are doubled." },
  { name: "Chaos Mode",  desc: "Targets are shuffled randomly mid-round." },
  { name: "Scarcity",    desc: "Max bet capped at 25 $TEST for everyone." },
  { name: "Final Stand", desc: "Eliminated players get one last move before they're out." },
];

const SIGMA_SYSTEM = [
  { action: "Match win",         pts: "+50", positive: true },
  { action: "Elimination",       pts: "+8",  positive: true },
  { action: "Biggest steal",     pts: "+18", positive: true },
  { action: "Survival bonus",    pts: "+10", positive: true },
  { action: "Match loss",        pts: "−12", positive: false },
  { action: "Solo mode penalty", pts: "−5",  positive: false },
];

const FAQ = [
  { q: "Is the game fully on-chain?",       a: "Game execution runs on MagicBlock Ephemeral Rollups — near-instant and cheap. Final settlements post to Solana devnet at match end." },
  { q: "What is $TEST?",                    a: "$TEST is the in-match token. Every player starts with 100. It only exists within a match session." },
  { q: "How do I unlock new archetypes?",   a: "Spend Sigma Points (σ) in the archetype picker. Some archetypes are free; others cost up to 2,000σ." },
  { q: "Can I play on mobile?",             a: "Yes. Proof of Alpha supports Solana Mobile Wallet Adapter — connect directly from Phantom, Backpack, or any MWA wallet." },
  { q: "What happens when I'm eliminated?", a: "Your $TEST hits zero. You can spectate the rest of the match. Final Stand modifier gives you one last move." },
  { q: "Are matches ranked?",               a: "All matches affect Sigma Points. Solo mode earns slightly fewer points than multiplayer." },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">
      {children}
    </p>
  );
}

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">

        {/* HEADER */}
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">Game Guide</p>
          <h1 className="text-5xl uppercase">How to Play</h1>
          <p className="mt-3 text-sm leading-7 text-[#d8d4a1]">
            Steal, bluff, and outlast every other player to claim Proof of Alpha.
          </p>
        </div>

        {/* GAME FLOW */}
        <section>
          <SectionLabel>Game Flow</SectionLabel>
          <ol className="space-y-3">
            {GAME_STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 border border-[#91897C]/50 bg-[#2f2922] px-5 py-4">
                <span className="shrink-0 font-mono text-lg font-bold text-[#EEF083]/20">{s.n}</span>
                <div>
                  <p className="font-semibold text-[#EEF083]">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-[#d8d4a1]">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* MOVES */}
        <section>
          <SectionLabel>Moves</SectionLabel>
          <Accordion className="border border-[#91897C]/50 bg-[#2f2922]">
            {MOVES.map((m) => (
              <AccordionItem key={m.name} value={m.name} className="border-b border-[#91897C]/50 last:border-b-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-[#EEF083]/5 [&_svg]:text-[#91897C]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#EEF083]">{m.name}</span>
                    <span className="rounded-none border border-[#91897C]/60 px-2 py-0.5 font-mono text-[10px] text-[#91897C]">{m.cost}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <p className="text-sm leading-6 text-[#d8d4a1]">{m.effect}</p>
                  <p className="mt-2 text-xs text-[#91897C]">
                    Countered by: <span className="text-[#EEF083]">{m.counter}</span>
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ROUND MODIFIERS */}
        <section>
          <SectionLabel>Round Modifiers</SectionLabel>
          <ul className="space-y-2">
            {MODIFIERS.map((m) => (
              <li key={m.name} className="flex gap-4 border border-[#91897C]/50 bg-[#2f2922] px-5 py-4">
                <span className="shrink-0 min-w-25 font-semibold text-[#EEF083]">{m.name}</span>
                <span className="text-sm leading-6 text-[#d8d4a1]">{m.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* SIGMA POINTS */}
        <section>
          <SectionLabel>Sigma Points</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Points per action */}
            <div className="border border-[#91897C]/50 bg-[#2f2922]">
              <p className="border-b border-[#91897C]/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#91897C]">
                Points per Action
              </p>
              {SIGMA_SYSTEM.map(({ action, pts, positive }) => (
                <div key={action} className="flex items-center justify-between border-b border-[#91897C]/30 px-5 py-3 last:border-b-0">
                  <span className="text-sm text-[#d8d4a1]">{action}</span>
                  <span className={`font-mono text-sm font-bold ${positive ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                    {pts} σ
                  </span>
                </div>
              ))}
            </div>

            {/* Rank thresholds */}
            <div className="border border-[#91897C]/50 bg-[#2f2922]">
              <p className="border-b border-[#91897C]/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#91897C]">
                Rank Thresholds
              </p>
              {RANKS.map((r) => (
                <div key={r.name} className="flex items-center justify-between border-b border-[#91897C]/30 px-5 py-3 last:border-b-0">
                  <span className="font-semibold text-[#EEF083]">{r.name}</span>
                  <span className="font-mono text-xs text-[#91897C]">
                    {r.min.toLocaleString()}{r.next ? ` – ${r.next.toLocaleString()}` : "+"} σ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-8">
          <SectionLabel>FAQ</SectionLabel>
          <Accordion className="border border-[#91897C]/50 bg-[#2f2922]">
            {FAQ.map(({ q, a }) => (
              <AccordionItem key={q} value={q} className="border-b border-[#91897C]/50 last:border-b-0">
                <AccordionTrigger className="px-5 py-4 text-left font-semibold text-[#EEF083] hover:no-underline hover:bg-[#EEF083]/5 [&_svg]:text-[#91897C]">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-sm leading-6 text-[#d8d4a1]">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="border-2 border-[#EEF083] bg-[#EEF083] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
              href="/mode-select"
            >
              Play Now
            </Link>
            <Link
              className="border-2 border-[#91897C] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#EEF083] transition hover:border-[#EEF083]"
              href="/character-select"
            >
              Browse Archetypes
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
