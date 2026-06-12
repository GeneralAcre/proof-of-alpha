"use client";

import Link from "next/link";
import { Nav } from "../components/Nav";
import { RANKS } from "../lib/archetypes";

const GAME_STEPS = [
  { n: "01", title: "Pick Your Archetype", desc: "Choose Alpha, Beta, or Sigma. Each has different stats that affect how the AI reacts to your style. Upgrade them with AURA to increase your stats over 10 levels." },
  { n: "02", title: "Enter the Lobby",     desc: "Three girls appear — Easy, Medium, and Hard. Each round costs AURA to approach. Harder girls pay more on win but are tougher to impress." },
  { n: "03", title: "Start the Chat",      desc: "You get 4 messages. Every reply the AI gives you a hidden score from -10 to +10. Talk your way up — the higher your total score, the better your win odds." },
  { n: "04", title: "Pick a Closer",       desc: "After 4 messages you choose: FLIRT (high risk, high reward), FLEX (safer floor), or LEAVE (safe exit, 50% back). Win % is shown live on each button." },
  { n: "05", title: "Collect AURA",        desc: "Win and collect AURA. Build a streak (2×, 3×, 5× multiplier). Lose and you get nothing — except a LEAVE refund." },
  { n: "06", title: "Cash Out",            desc: "After all 3 girls, cash out. If your AURA is above your starting amount, you win. All AURA carries over to upgrade your character." },
];

const CLOSERS = [
  {
    name: "FLIRT",
    risk: "High Risk",
    odds: "15% – 90%",
    desc: "The big play. Win chance scales hard with your conversation score — bad chat = 15%, great chat = 90%. Pays the most on win.",
  },
  {
    name: "FLEX",
    risk: "Safer",
    odds: "35% – 70%",
    desc: "More consistent floor. Even with a bad chat you still have 35% odds. Ceiling caps at 70% — lower payout but less variance.",
  },
  {
    name: "LEAVE",
    risk: "Safe Exit",
    odds: "Always",
    desc: "Walk away and get 50% of your approach cost back. Doesn't count as a win or loss. Use it when the chat went badly.",
  },
];

const DIFFICULTY = [
  {
    label: "FRIENDLY",
    cost: "10 AURA",
    flirt: "+80 AURA",
    flex: "+40 AURA",
    threshold: "Score 8+",
    examples: "Barista, Bookstore Clerk, Yoga Instructor, College Student, Trail Runner",
  },
  {
    label: "OK",
    cost: "50 AURA",
    flirt: "+150 AURA",
    flex: "+80 AURA",
    threshold: "Score 20+",
    examples: "Personal Trainer, Software Engineer, Chef, Photographer, Musician",
  },
  {
    label: "ALPHA",
    cost: "100 AURA",
    flirt: "+500 AURA",
    flex: "+200 AURA",
    threshold: "Score 30+",
    examples: "Startup CEO, Crypto Analyst, Lawyer, Fashion Editor, VC Partner",
  },
];

const AURA_USES = [
  { action: "Approach a girl",         cost: "10 – 100 AURA (by difficulty)", earn: false },
  { action: "Win with FLIRT",          cost: "80 – 500 AURA (by difficulty)", earn: true  },
  { action: "Win with FLEX",           cost: "40 – 200 AURA (by difficulty)", earn: true  },
  { action: "LEAVE refund",            cost: "50% of approach cost back",     earn: true  },
  { action: "Level up an archetype",   cost: "Level × 150 AURA",              earn: false },
  { action: "Win streak ×2",           cost: "+25% multiplier on winnings",   earn: true  },
  { action: "Win streak ×3",           cost: "+75% multiplier on winnings",   earn: true  },
  { action: "Win streak ×5",           cost: "+200% multiplier on winnings",  earn: true  },
];

const FAQ = [
  { q: "What is AURA?",                      a: "AURA is the in-game currency. You start with 200 per session. Spend it to approach girls, earn it back by winning closers. AURA persists between sessions and can be spent upgrading your archetype." },
  { q: "How does the conversation score work?", a: "Each AI response includes a hidden score (-10 to +10) based on how well your message landed. After 4 messages your total score determines the win % shown on your closer buttons." },
  { q: "What's the difference between FLIRT and FLEX?", a: "FLIRT is high variance — terrible odds with a bad chat, great odds with a good one. FLEX has a safer floor but caps lower. FLIRT always pays more on win." },
  { q: "Does my archetype affect the chat?",  a: "Your archetype stats (Aggression, Defense, Bluff, Greed) influence your character's style but the AI scores you on the actual quality of your messages — not your stats directly." },
  { q: "How do I upgrade my archetype?",      a: "On the Character Select page, tap any character, then Level Up. Cost is Level × 150 AURA. Each level unlocks better base stats. Max level is 10." },
  { q: "Are girls random every game?",        a: "Yes. Each session picks 3 random girls from a pool of 15 archetypes (5 per difficulty tier). Names and accent colors are randomised too — no two sessions look the same." },
  { q: "Can I play on mobile?",               a: "Yes. Proof of Alpha supports Solana Mobile Wallet Adapter — connect directly from Phantom, Backpack, or any MWA wallet." },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">
      {children}
    </p>
  );
}

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 space-y-12">

        {/* HEADER */}
        <div>
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">Game Guide</p>
          <h1 className="text-5xl font-black uppercase">How to Play</h1>
          <p className="mt-3 text-sm leading-7 text-[#ffffff]">
            Chat with AI girls. Read the room. Pick the right closer. Earn AURA.
          </p>
        </div>

        {/* GAME FLOW */}
        <section>
          <SectionLabel>Game Flow</SectionLabel>
          <ol className="space-y-3">
            {GAME_STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 border border-[#a09ab8]/50 bg-[#2d1a4a] px-5 py-4">
                <span className="shrink-0 font-mono text-lg font-bold text-[#E4D474]/20">{s.n}</span>
                <div>
                  <p className="font-black uppercase text-[#E4D474]">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-[#ffffff]">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* DIFFICULTY TIERS */}
        <section>
          <SectionLabel>Girl Difficulty Tiers</SectionLabel>
          <p className="mb-4 text-sm text-[#a09ab8]">Three girls per session, randomly picked from a pool of 15 archetypes. Harder girls pay more but are smarter AI models.</p>
          <div className="space-y-3">
            {DIFFICULTY.map((d) => (
              <div key={d.label} className="border border-white/10 bg-white/4 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3">
                  <span className="border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-xs font-black text-white tracking-widest">
                    {d.label}
                  </span>
                  <span className="font-mono text-xs text-[#a09ab8]">{d.threshold} to win FLIRT</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/[0.07] border-b border-white/[0.07]">
                  <div className="px-4 py-3 text-center">
                    <p className="font-mono text-[9px] uppercase text-[#a09ab8]">Entry</p>
                    <p className="mt-1 font-mono text-sm font-black text-white">{d.cost}</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="font-mono text-[9px] uppercase text-[#a09ab8]">Flirt Win</p>
                    <p className="mt-1 font-mono text-sm font-black text-[#E4D474]">{d.flirt}</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="font-mono text-[9px] uppercase text-[#a09ab8]">Flex Win</p>
                    <p className="mt-1 font-mono text-sm font-black text-white">{d.flex}</p>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-[9px] uppercase text-[#a09ab8]">Examples</p>
                  <p className="mt-0.5 text-xs text-[#ffffff]">{d.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CLOSERS */}
        <section>
          <SectionLabel>Closers</SectionLabel>
          <p className="mb-4 text-sm text-[#a09ab8]">After 4 messages the chat locks and you pick a closer. Win % is shown live based on your conversation score.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CLOSERS.map((c) => (
              <div key={c.name} className="border border-white/10 bg-white/4 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-sm font-black text-white">{c.name}</p>
                  <span className="border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#a09ab8]">{c.risk}</span>
                </div>
                <p className="font-mono text-lg font-black mb-2 text-[#E4D474]">{c.odds}</p>
                <p className="text-xs leading-5 text-[#ffffff]">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AURA */}
        <section>
          <SectionLabel>AURA Economy</SectionLabel>
          <div className="border border-[#a09ab8]/50 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
            {AURA_USES.map(({ action, cost, earn }) => (
              <div key={action} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#ffffff]">{action}</span>
                <span className={`font-mono text-xs font-black ${earn ? "text-[#E4D474]" : "text-[#a09ab8]"}`}>{cost}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RANKS */}
        <section>
          <SectionLabel>Rank Thresholds</SectionLabel>
          <div className="border border-[#a09ab8]/50 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
            {RANKS.map((r) => (
              <div key={r.name} className="flex items-center justify-between px-5 py-3">
                <span className="font-black uppercase text-[#E4D474]">{r.name}</span>
                <span className="font-mono text-xs text-[#a09ab8]">
                  {r.min.toLocaleString()}{r.next ? ` – ${r.next.toLocaleString()}` : "+"} AURA
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-8">
          <SectionLabel>FAQ</SectionLabel>
          <div className="border border-[#a09ab8]/50 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 cursor-pointer">
                <summary className="font-black uppercase text-sm text-[#E4D474] list-none flex items-center justify-between">
                  {q}
                  <span className="font-mono text-[#a09ab8] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#ffffff]">{a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="border-2 border-[#E4D474] bg-[#E4D474] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
              href="/character-select"
            >
              Play Now
            </Link>
            <Link
              className="border-2 border-[#a09ab8] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-[#E4D474] transition hover:border-[#E4D474]"
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
