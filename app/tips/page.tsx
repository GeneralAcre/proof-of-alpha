"use client";

import Link from "next/link";
import { Nav } from "../components/Nav";

// ─── Conversation examples ────────────────────────────────────────────────────

const CONVOS = [
  {
    girl: "Coffee Barista",
    tier: "FRIENDLY",
    lines: [
      { who: "you", msg: "Hey, you're really cute. Can I get your number?", score: -7 },
      { who: "her", msg: "Ha. No." },
      { who: "you", msg: "I've been trying to dial in my V60 ratio at home — do you brew at home too or does work kill the passion?", score: +9 },
      { who: "her", msg: "Oh actually yeah — I have a Chemex at home. Work definitely kills it some days though 😅" },
    ],
    lesson: "Skip the compliment. Ask about her craft. She's an expert — treat her like one.",
  },
  {
    girl: "Software Engineer",
    tier: "OK",
    lines: [
      { who: "you", msg: "I have this app idea, I just need someone to build it.", score: -9 },
      { who: "her", msg: "Cool. Good luck with that." },
      { who: "you", msg: "I shipped a side project last month — nothing fancy, just a CLI tool. What do you work on outside your job?", score: +10 },
      { who: "her", msg: "Wait actually that's sick — I've been building a homelab setup. What's the tool do?" },
    ],
    lesson: "Never ask her to work for you. Lead with something you built. Then ask about her.",
  },
  {
    girl: "On-Chain Analyst",
    tier: "ALPHA",
    lines: [
      { who: "you", msg: "So what do you think Bitcoin is going to hit this cycle?", score: -7 },
      { who: "her", msg: "I don't do price predictions." },
      { who: "you", msg: "Been watching TVL flows on Aave — the utilisation rate shifts have been interesting post the rate change. What protocols are you watching?", score: +9 },
      { who: "her", msg: "Finally. Yeah Aave's been moving. I've also been watching Morpho — the lending architecture is way cleaner." },
    ],
    lesson: "Price talk is normie. She works in DeFi mechanics. Speak her language.",
  },
];

// ─── Closer cheat sheet ───────────────────────────────────────────────────────

const CLOSERS = [
  {
    name: "FLIRT",
    range: "15 – 90%",
    use: "Chat went well — score strongly positive",
    avoid: "Score flat or negative — you're gambling",
  },
  {
    name: "FLEX",
    range: "35 – 70%",
    use: "Decent or neutral chat — safer floor",
    avoid: "You're leaving money on the table if the chat was great",
  },
  {
    name: "LEAVE",
    range: "Always",
    use: "Bad chat, score negative — get 50% back, keep your streak",
    avoid: "Using it when you actually had a good chat",
  },
];

// ─── Girl quick guide ─────────────────────────────────────────────────────────

const GIRL_GUIDE = [
  {
    tier: "FRIENDLY",
    girls: [
      { name: "Coffee Barista",  tip: "Ask about her brew method. Avoid pickup lines entirely." },
      { name: "Bookstore Clerk", tip: "Name a specific book or author. 'I don't read' ends it." },
      { name: "Yoga Instructor", tip: "Show actual self-awareness. Bro-gym energy reads insecure." },
      { name: "College Student", tip: "Match her sardonic energy. Don't lecture." },
      { name: "Trail Runner",    tip: "Name a real trail. 'I prefer the gym' is an instant drop." },
    ],
  },
  {
    tier: "OK",
    girls: [
      { name: "Personal Trainer",  tip: "Give real lift numbers. She knows what's fake." },
      { name: "Software Engineer", tip: "Talk about something you've actually shipped." },
      { name: "Private Chef",      tip: "Name a technique or unusual ingredient. Takeout is a red flag." },
      { name: "Photographer",      tip: "Know one focal length. Phone camera talk costs you." },
      { name: "Indie Musician",    tip: "Deep cuts and music theory score high. Spotify Wrapped doesn't." },
    ],
  },
  {
    tier: "ALPHA",
    girls: [
      { name: "Startup CEO",      tip: "Come with ARR, retention, PMF reasoning. Not a vague idea." },
      { name: "On-Chain Analyst", tip: "DeFi mechanics and liquidity. Price talk is beneath her." },
      { name: "Corporate Lawyer", tip: "Argue precisely. Lawyer jokes are the fastest way out." },
      { name: "Fashion Editor",   tip: "Know a designer by era. 'I just wear what's comfortable' closes the door." },
      { name: "VC Partner",       tip: "Lead with market thesis, not your ask." },
    ],
  },
];

// ─── Universal rules ─────────────────────────────────────────────────────────

const RULES = [
  "Never open with a compliment on her looks",
  "Faking knowledge always gets punished — she will test you",
  "One-word answers lose ground fast",
  "A LEAVE doesn't break your streak. A loss does.",
  "High score on message 1 can still be ruined by message 3",
  "Picking FLIRT on a flat chat is just burning AURA",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 space-y-14">

        {/* Header */}
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">Field Manual</p>
          <h1 className="text-5xl font-black uppercase sm:text-6xl">Tips</h1>
          <p className="mt-3 max-w-xl font-mono text-sm leading-7 text-[#716a7e]">
            See what actually scores — and what kills the conversation before it starts.
          </p>
        </div>

        {/* ── Conversations ── */}
        <section>
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[#716a7e]">
            See it in action
          </p>
          <div className="space-y-8">
            {CONVOS.map((c) => (
              <div key={c.girl}>
                {/* Girl label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-black uppercase text-sm text-[#231942]">{c.girl}</span>
                  <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#716a7e]">
                    {c.tier}
                  </span>
                </div>

                {/* Chat bubbles */}
                <div className="rounded-xl space-y-2 border border-white/7 bg-[#f3f0fa] p-4 sm:p-5">
                  {c.lines.map((l, i) => (
                    <div key={i} className={`flex items-start gap-3 ${l.who === "you" ? "" : "flex-row-reverse"}`}>
                      {l.who === "you" && l.score !== undefined && (
                        <span className={`mt-1 shrink-0 font-mono text-[10px] font-black ${l.score > 0 ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                          {l.score > 0 ? `+${l.score}` : l.score}
                        </span>
                      )}
                      <div className={`rounded-xl max-w-[80%] border px-3 py-2 text-sm leading-6 ${
                        l.who === "you"
                          ? "border-white/10 bg-white text-[#231942]"
                          : "border-[#5e548e]/15 bg-[#5e548e]/5 text-[#716a7e]"
                      }`}>
                        {l.msg}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lesson */}
                <p className="mt-3 font-mono text-xs leading-5 text-[#716a7e]">
                  <span className="text-[#5e548e] font-black">Lesson: </span>{c.lesson}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Closer cheat sheet ── */}
        <section>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#716a7e]">Closer cheat sheet</p>
          <div className="rounded-lg divide-y divide-white/7 border border-white/10">
            {CLOSERS.map((c) => (
              <div key={c.name} className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] items-start gap-4 bg-white px-4 py-4 sm:px-5">
                <div>
                  <p className="font-mono text-sm font-black text-[#5e548e]">{c.name}</p>
                  <p className="font-mono text-[9px] text-[#716a7e] mt-0.5">{c.range}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#231942]"><span className="font-mono text-[9px] uppercase tracking-wide text-[#5e548e]/60 mr-2">Use</span>{c.use}</p>
                  <p className="text-sm text-[#716a7e]"><span className="font-mono text-[9px] uppercase tracking-wide text-[#716a7e]/60 mr-2">Not if</span>{c.avoid}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Girl quick guide ── */}
        <section>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#716a7e]">By girl type</p>
          <div className="space-y-4">
            {GIRL_GUIDE.map((g) => (
              <div key={g.tier}>
                <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#5e548e]/60">{g.tier}</p>
                <div className="rounded-lg border border-white/7 bg-[#f3f0fa] divide-y divide-white/[0.04]">
                  {g.girls.map((girl) => (
                    <div key={girl.name} className="flex items-baseline gap-3 px-4 py-3 sm:px-5">
                      <span className="shrink-0 font-mono text-xs font-black text-[#231942] w-32 sm:w-36">{girl.name}</span>
                      <span className="font-mono text-xs text-[#716a7e]">{girl.tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Universal rules ── */}
        <section className="pb-8">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#716a7e]">Rules that apply to every girl</p>
          <div className="rounded-lg border border-white/7 bg-white divide-y divide-white/[0.04]">
            {RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-px font-mono text-[10px] text-[#5e548e]/30 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm text-[#231942]">{r}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/character-select"
              className="rounded-xl border border-[#5e548e] bg-[#5e548e] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
            >
              Play Now
            </Link>
            <Link
              href="/how-to-play"
              className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e] touch-manipulation"
            >
              How to Play
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
