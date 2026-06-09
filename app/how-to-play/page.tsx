"use client";

import Link from "next/link";
import { Nav } from "../components/Nav";
import { ARCHETYPES, RANKS } from "../lib/archetypes";

const GAME_STEPS = [
  {
    step: "01",
    title: "Connect & Select",
    desc: "Connect your Solana wallet. Pick Solo or Multiplayer mode. Choose your archetype — each has unique stats, a passive ability, and a unique move.",
  },
  {
    step: "02",
    title: "Enter the Lobby",
    desc: "Join a public room or create a private one with a room code. Wait for players to fill (or bots if solo). Each player starts with 100 $TEST tokens.",
  },
  {
    step: "03",
    title: "Play Rounds",
    desc: "Every round: choose a move, pick a target, confirm. Moves resolve simultaneously. Winners steal $TEST. Eliminated players drop to zero balance.",
  },
  {
    step: "04",
    title: "Locker Room",
    desc: "Between rounds: check the scoreboard, switch your archetype, read the next round modifier. You have 30 seconds.",
  },
  {
    step: "05",
    title: "Last One Standing",
    desc: "The match ends when only one player has $TEST remaining. Winner earns Sigma Points, NFT badges, and bragging rights.",
  },
  {
    step: "06",
    title: "Earn & Rank Up",
    desc: "Sigma Points accumulate across matches. Hit thresholds to rank up from NPC → Beta → Alpha → Sigma → Gigachad. Top ranks unlock exclusive archetypes.",
  },
];

const MOVES = [
  { name: "Tax",     cost: "5 $TEST",  effect: "Take 5 $TEST from target. Safe and reliable.",             counter: "Counter" },
  { name: "Steal",   cost: "10 $TEST", effect: "Take 10 $TEST from target. Higher risk, higher reward.",   counter: "Counter" },
  { name: "Rob",     cost: "20 $TEST", effect: "Take 20 $TEST from target. Only works if uncountered.",    counter: "Counter" },
  { name: "Bluff",   cost: "Free",     effect: "Fake a big steal. If target burns Counter, you get +5.",   counter: "None" },
  { name: "Counter", cost: "5 $TEST",  effect: "Block incoming Tax / Steal / Rob. Counters return to you.", counter: "Bluff" },
  { name: "NUKE",    cost: "30 $TEST", effect: "Eliminate target if their balance ≤ 30. High variance.",   counter: "Fold" },
  { name: "Fold",    cost: "Free",     effect: "Skip this round, cannot be nuked. Purely defensive.",      counter: "None" },
];

const COUNTER_CHART = [
  { attacker: "Tax",   counters: "Counter", note: "Counter refunds the cost" },
  { attacker: "Steal", counters: "Counter", note: "Counter refunds the cost" },
  { attacker: "Rob",   counters: "Counter", note: "Counter refunds the cost" },
  { attacker: "Bluff", counters: "None",    note: "Bluff beats Counter" },
  { attacker: "NUKE",  counters: "Fold",    note: "Fold protects you from NUKE" },
  { attacker: "NUKE",  counters: "Counter", note: "Counter does NOT stop NUKE" },
];

const MODIFIERS = [
  { name: "Standard",    desc: "Normal rules. No special effects." },
  { name: "Greed Mode",  desc: "All successful bets are doubled this round. Max upside, max risk." },
  { name: "Chaos Mode",  desc: "Targets are shuffled randomly mid-round. Your target may change." },
  { name: "Scarcity",    desc: "Max bet capped at 25 $TEST for all players. Forces conservative play." },
  { name: "Final Stand", desc: "Eliminated players get one last bet before they're truly out." },
];

const SIGMA_SYSTEM = [
  { action: "Match win",          pts: "+50" },
  { action: "Elimination",        pts: "+8" },
  { action: "Biggest steal",      pts: "+18" },
  { action: "Survival bonus",     pts: "+10" },
  { action: "Solo mode penalty",  pts: "−5" },
  { action: "Match loss",         pts: "−12" },
];

const FAQ = [
  {
    q: "Is the game fully on-chain?",
    a: "Game execution runs on MagicBlock Ephemeral Rollups (near-instant, cheap). Final settlements post to Solana mainnet at match end.",
  },
  {
    q: "What is $TEST?",
    a: "$TEST is the in-match token. Every player starts with 100 $TEST. It is not a real token — it exists only within a match session.",
  },
  {
    q: "How do I unlock new archetypes?",
    a: "Spend Sigma Points (σ) in the locker room archetype picker. NPC and Wojak are free. Others cost between 500σ and 2,000σ.",
  },
  {
    q: "Can I play on mobile?",
    a: "Yes. Proof of Alpha supports Solana Mobile Wallet Adapter — connect directly from Phantom, Backpack, or any MWA-compatible wallet.",
  },
  {
    q: "What happens when I'm eliminated?",
    a: "Your $TEST balance hits zero. You can spectate the rest of the match. With Final Stand modifier active, you get one last move.",
  },
  {
    q: "Are matches ranked?",
    a: "All matches affect your Sigma Points. Solo mode earns slightly fewer points than multiplayer.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-14">

        {/* ── HEADER ── */}
        <div>
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Game Guide
          </p>
          <h1 className="text-4xl font-black uppercase sm:text-5xl">How to Play</h1>
          <p className="mt-3 max-w-xl text-sm text-[#d8d4a1]">
            Proof of Alpha is a fully on-chain PvP meme battle game. Steal, bluff, and outlast every other player to claim Proof of Alpha.
          </p>
        </div>

        {/* ── GAME FLOW ── */}
        <section>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Game Flow
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_STEPS.map((s) => (
              <div key={s.step} className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
                <p className="mb-2 font-mono text-2xl font-black text-[#EEF083]/20">{s.step}</p>
                <p className="font-black uppercase text-[#EEF083]">{s.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#d8d4a1]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ARCHETYPES ── */}
        <section>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Archetypes
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARCHETYPES.map((a) => (
              <div key={a.id} className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#EEF083] font-mono text-lg font-black text-[#EEF083]">
                    {a.initials}
                  </div>
                  <div>
                    <p className="font-black uppercase text-[#EEF083]">{a.name}</p>
                    <p className="font-mono text-[10px] text-[#91897C] uppercase tracking-[0.12em]">{a.role}</p>
                  </div>
                  {a.unlockCost === 0 ? (
                    <span className="ml-auto border border-[#EEF083] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#EEF083]">
                      Free
                    </span>
                  ) : (
                    <span className="ml-auto font-mono text-xs text-[#91897C]">{a.unlockCost.toLocaleString()}σ</span>
                  )}
                </div>
                <p className="mb-3 text-sm italic text-[#d8d4a1]">"{a.tagline}"</p>

                {/* Stat bars */}
                {(["aggression","defense","bluff","greed"] as const).map((stat) => (
                  <div key={stat} className="mb-1.5">
                    <div className="mb-0.5 flex justify-between font-mono text-[10px] uppercase text-[#91897C]">
                      <span>{stat}</span>
                      <span>{a.stats[stat]}</span>
                    </div>
                    <div className="h-1 w-full bg-[#241F19]">
                      <div className="h-full bg-[#EEF083]" style={{ width: `${a.stats[stat]}%` }} />
                    </div>
                  </div>
                ))}

                <div className="mt-3 space-y-1">
                  <p className="font-mono text-[10px] text-[#91897C]">
                    <span className="text-[#EEF083]">Passive:</span> {a.passive}
                  </p>
                  <p className="font-mono text-[10px] text-[#91897C]">
                    <span className="text-[#EEF083]">Unique:</span> {a.uniqueMove}
                  </p>
                  <p className="font-mono text-[10px] text-[#91897C]">
                    <span className="text-[#EEF083]">Beats:</span> {a.beats.join(", ")}
                  </p>
                  <p className="font-mono text-[10px] text-[#91897C]">
                    <span className="text-[#EEF083]">Fears:</span> {a.fears.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MOVES ── */}
        <section>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Moves
          </p>
          <div className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
            <div className="grid grid-cols-[80px_90px_1fr_80px] border-b border-[#91897C] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#91897C]">
              <span>Move</span>
              <span>Cost</span>
              <span>Effect</span>
              <span>Countered by</span>
            </div>
            {MOVES.map((m) => (
              <div key={m.name} className="grid grid-cols-[80px_90px_1fr_80px] items-start border-b border-[#91897C] px-5 py-3.5 last:border-b-0">
                <span className="font-mono text-sm font-black text-[#EEF083]">{m.name}</span>
                <span className="font-mono text-xs text-[#d8d4a1]">{m.cost}</span>
                <span className="text-sm text-[#d8d4a1]">{m.effect}</span>
                <span className="font-mono text-xs text-[#91897C]">{m.counter}</span>
              </div>
            ))}
          </div>

          {/* Counter chart */}
          <div className="mt-5 border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Counter Chart
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {COUNTER_CHART.map((c, i) => (
                <div key={i} className="flex items-center gap-3 border border-[#91897C] px-4 py-2.5">
                  <span className="font-mono text-sm font-black text-[#EEF083] w-14">{c.attacker}</span>
                  <span className="font-mono text-xs text-[#91897C]">→</span>
                  <span className="font-mono text-xs text-[#d8d4a1]">countered by <span className="font-black text-[#EEF083]">{c.counters}</span></span>
                  <span className="ml-auto font-mono text-[10px] text-[#91897C]">{c.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROUND MODIFIERS ── */}
        <section>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Round Modifiers
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODIFIERS.map((m) => (
              <div key={m.name} className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
                <p className="font-black uppercase text-[#EEF083]">{m.name}</p>
                <p className="mt-1.5 text-sm text-[#d8d4a1]">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SIGMA POINTS ── */}
        <section>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Sigma Points System
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#91897C]">Points per Action</p>
              </div>
              {SIGMA_SYSTEM.map(({ action, pts }) => (
                <div key={action} className="flex items-center justify-between border-b border-[#91897C] px-5 py-3 last:border-b-0">
                  <span className="text-sm text-[#d8d4a1]">{action}</span>
                  <span className={`font-mono text-sm font-black ${pts.startsWith("+") ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                    {pts} σ
                  </span>
                </div>
              ))}
            </div>

            <div className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#91897C]">Rank Thresholds</p>
              </div>
              {RANKS.map((r) => (
                <div key={r.name} className="flex items-center justify-between border-b border-[#91897C] px-5 py-3 last:border-b-0">
                  <span className="font-black uppercase text-[#EEF083]">{r.name}</span>
                  <span className="font-mono text-sm text-[#91897C]">
                    {r.min.toLocaleString()} σ{r.next ? ` — ${r.next.toLocaleString()} σ` : "+"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pb-8">
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            FAQ
          </p>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
                <p className="font-black uppercase text-[#EEF083]">{q}</p>
                <p className="mt-2 text-sm leading-6 text-[#d8d4a1]">{a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              className="border-2 border-[#EEF083] bg-[#EEF083] px-8 py-4 font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
              href="/mode-select"
            >
              Play Now
            </Link>
            <Link
              className="border-2 border-[#91897C] px-8 py-4 font-black uppercase text-[#EEF083] transition hover:border-[#EEF083]"
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
