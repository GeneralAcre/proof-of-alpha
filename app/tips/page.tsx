"use client";

import Link from "next/link";
import { Nav } from "../components/Nav";

// ─── Data ────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    label: "FRIENDLY",
    color: "#E4D474",
    cost: "10 AURA entry",
    desc: "These girls value realness over flash. No need to impress — just don't be cringe.",
    archetypes: [
      {
        title: "Coffee Barista",
        tip: "Ask about her shift or what her favourite brew method is. She's seen every pickup line — skip it entirely.",
        dos: ["Mention actual coffee knowledge", "Be patient and genuine", "Ask a real question"],
        donts: ["Cringe openers", "Acting superior", "Rushing her"],
      },
      {
        title: "Bookstore Clerk",
        tip: "Name a specific book or author you actually like. 'I don't really read' ends the conversation immediately.",
        dos: ["Name a specific title or author", "Ask what she's reading", "Intellectual banter"],
        donts: ["Saying you don't read", "Asking for bestsellers", "Mentioning the movie adaptation"],
      },
      {
        title: "Yoga Instructor",
        tip: "Talk about mindfulness or wellness with genuine interest. Bro-gym energy reads as insecure here.",
        dos: ["Use pose names correctly", "Ask about her practice", "Show actual self-awareness"],
        donts: ["'Yoga is just stretching'", "Unsolicited flexibility comments", "Aggressive gym talk"],
      },
      {
        title: "College Student",
        tip: "Treat her as an equal. She has sardonic Gen Z energy — match it, don't lecture.",
        dos: ["Campus or major banter", "Genuine curiosity", "Self-deprecating humor"],
        donts: ["Bragging about money", "Unsolicited life advice", "Age jokes"],
      },
      {
        title: "Trail Runner",
        tip: "Know trail names and elevations. 'I prefer the gym' is an instant score drop.",
        dos: ["Name specific trails", "Talk gear or race distances", "Actual outdoor stories"],
        donts: ["Saying you prefer the gym", "Calling nature boring", "Faking outdoor experience"],
      },
    ],
  },
  {
    label: "OK",
    color: "#E4D474",
    cost: "50 AURA entry",
    desc: "These girls are domain experts. Vague answers get punished. Show real knowledge or get filtered out.",
    archetypes: [
      {
        title: "Personal Trainer",
        tip: "Give real lift numbers — she knows what's fake. Talk programming or macros, not aesthetics.",
        dos: ["Actual compound lift numbers", "Macro / programming knowledge", "Specific training goals"],
        donts: ["Exaggerating your bench", "Skipping leg day talk", "'I just do cardio'"],
      },
      {
        title: "Software Engineer",
        tip: "Talk about something you've actually built. 'I have an app idea' is the worst opener.",
        dos: ["Specific stack or project", "Talk about shipping something real", "Smart technical questions"],
        donts: ["'I have an app idea'", "Asking her to build it", "Buzzword soup"],
      },
      {
        title: "Private Chef",
        tip: "Name a specific technique or unusual ingredient you cook with. 'I mostly do takeout' is a red flag.",
        dos: ["Cooking techniques", "Specific ingredients", "Food travel stories"],
        donts: ["Microwaving everything", "'Food is just fuel'", "Being a takeout person"],
      },
      {
        title: "Photographer",
        tip: "Know at least one focal length or photographer by name. Phone camera talk will cost you.",
        dos: ["Gear and focal length knowledge", "Composition or lighting talk", "Reference real photographers"],
        donts: ["'My iPhone is enough'", "Instagram as your portfolio", "Asking for free shoots"],
      },
      {
        title: "Indie Musician",
        tip: "Have actual opinions on music. Deep cuts and music theory score high. Spotify Wrapped doesn't.",
        dos: ["Niche artists", "Music theory basics", "Playing an instrument"],
        donts: ["Only Top 40", "'Put on whatever'", "TikTok audio talk"],
      },
    ],
  },
  {
    label: "ALPHA",
    color: "#a09ab8",
    cost: "100 AURA entry",
    desc: "Elite-tier. These women run rooms. You need sharp thinking, real metrics, and domain depth — not just charm.",
    archetypes: [
      {
        title: "Startup CEO",
        tip: "Come with real numbers — ARR, retention, PMF reasoning. 'It's like Uber but for X' will get you laughed out.",
        dos: ["ARR/MRR + real metrics", "Product-market fit reasoning", "Something you've actually shipped"],
        donts: ["Vague 'I have an idea'", "No traction", "Asking for intros immediately"],
      },
      {
        title: "On-Chain Analyst",
        tip: "Go deep on DeFi mechanics, not price. Liquidity positions and on-chain data score high. Price talk is normie.",
        dos: ["DeFi protocol specifics", "Liquidity + validator knowledge", "On-chain data references"],
        donts: ["Bitcoin price chat", "Asking what a seed phrase is", "'My friend told me to buy'"],
      },
      {
        title: "Corporate Lawyer",
        tip: "Think precisely and argue well. She respects logic over charm. Lawyer jokes are the fastest way out.",
        dos: ["Sharp logical arguments", "Actual legal concepts", "Witty debate"],
        donts: ["Lawyer jokes", "Asking for free advice", "Sloppy reasoning"],
      },
      {
        title: "Fashion Editor",
        tip: "Have a defined personal style and know at least one designer by era. 'I just wear what's comfortable' closes the door.",
        dos: ["Specific designers", "Fashion history references", "Defined aesthetic"],
        donts: ["'I just wear whatever'", "Head-to-toe fast fashion", "'Fashion is just clothes'"],
      },
      {
        title: "VC Partner",
        tip: "Lead with market thesis, not your idea. She filters for signal in seconds — don't ask for intros before showing value.",
        dos: ["Fund structure knowledge", "Portfolio thinking", "Market thesis with data"],
        donts: ["'I just need funding'", "No traction or metrics", "Asking for intros first"],
      },
    ],
  },
];

const CLOSER_TIPS = [
  {
    name: "FLIRT",
    color: "#E4D474",
    when: "Your chat score is high — use it when the conversation went genuinely well.",
    rule: "Odds range from 15% to 90% based on your conversation score. With a bad chat, FLIRT is a coin flip into a wall. With a great chat, it's the highest payout in the game.",
    trigger: "Score strongly positive? Pick FLIRT. Score negative or flat? Don't.",
  },
  {
    name: "FLEX",
    color: "#E4D474",
    when: "Your chat was decent but not exceptional — or you're not sure.",
    rule: "Floor is 35%, ceiling is 70%. It pays less than FLIRT but the safety net is real. If your score is around zero, FLEX is almost always the better play.",
    trigger: "Neutral or slightly positive chat? FLEX every time. Never risk FLIRT on a flat conversation.",
  },
  {
    name: "LEAVE",
    color: "#a09ab8",
    when: "The chat went badly and your score is negative.",
    rule: "You get 50% of your approach cost back. It doesn't count as a loss — your streak stays intact. Use it as a reset, not a failure.",
    trigger: "Negative chat score or you got a bad vibe? LEAVE. Protect the streak. Live to approach another day.",
  },
];

const STREAK_TIPS = [
  { n: "2×", boost: "+25%", tip: "Back-to-back wins. Don't chase FLIRT now — lock in a FLEX on the next girl to protect it." },
  { n: "3×", boost: "+75%", tip: "Three wins. The multiplier is real now. If the next chat is going well, FLIRT is worth it." },
  { n: "5×", boost: "+200%", tip: "Five wins in a row. This is max multiplier. Even a FLEX win at 5× pays massive. Don't blow it on a bad chat." },
];

const MESSAGE_BREAKDOWNS = [
  {
    archetype: "Coffee Barista",
    tier: "FRIENDLY",
    color: "#E4D474",
    examples: [
      {
        msg: "Hey, you're really cute. Can I get your number?",
        score: -7,
        why: "Treats her like a vending machine. She gets this 10 times a day. Zero interest in her as a person.",
      },
      {
        msg: "What's a good drink if I'm tired of espresso?",
        score: +5,
        why: "Puts her in the expert seat. Opens a real conversation without being creepy.",
      },
      {
        msg: "I've been trying to dial in my V60 ratio at home — do you brew at home too or does work kill the passion?",
        score: +9,
        why: "Shows real knowledge, asks a genuine question, and invites her to share something personal about herself.",
      },
    ],
  },
  {
    archetype: "Software Engineer",
    tier: "OK",
    color: "#E4D474",
    examples: [
      {
        msg: "I have this idea for an app, I just need someone to build it.",
        score: -9,
        why: "The single most hated opener for any engineer. You're asking for free labour before saying hello.",
      },
      {
        msg: "What stack are you working with these days? I've been going back and forth on Next.js vs Remix.",
        score: +7,
        why: "Immediately signals you're technical. Invites a real opinion. Treats her as a peer, not a resource.",
      },
      {
        msg: "I shipped a side project last month — nothing fancy, just a CLI tool. What do you work on outside of your job?",
        score: +10,
        why: "You led with something real you built, then asked about her. Shows initiative and genuine curiosity.",
      },
    ],
  },
  {
    archetype: "Corporate Lawyer",
    tier: "ALPHA",
    color: "#a09ab8",
    examples: [
      {
        msg: "Haha lawyers are basically just professional liars right?",
        score: -10,
        why: "Lawyer joke. She's heard it 500 times. You've just proven you have no original thoughts.",
      },
      {
        msg: "What's your take on the tension between attorney-client privilege and mandatory reporting obligations?",
        score: +8,
        why: "Specific, intellectually serious, and not a question Google answers in one line. She has to think.",
      },
      {
        msg: "I read the Chevron case got overturned — genuinely curious what that does to regulatory litigation long term.",
        score: +10,
        why: "Real case, real consequence, real question. You've done homework. She'll respect that immediately.",
      },
    ],
  },
  {
    archetype: "Trail Runner",
    tier: "FRIENDLY",
    color: "#E4D474",
    examples: [
      {
        msg: "Wow you run? I mostly just use the treadmill at my gym.",
        score: -6,
        why: "Treadmill vs trail is a direct downgrade in her world. You've confirmed you don't get it.",
      },
      {
        msg: "Did you run this morning? I caught a sunrise on the Ridgeline trail last weekend — first time doing that segment.",
        score: +8,
        why: "You named a real trail, shared a real story, and made it easy for her to respond with her own.",
      },
    ],
  },
  {
    archetype: "On-Chain Analyst",
    tier: "ALPHA",
    color: "#a09ab8",
    examples: [
      {
        msg: "So what do you think Bitcoin is going to hit this cycle?",
        score: -7,
        why: "Price chat is normie. She works in on-chain data and DeFi mechanics. Price prediction is beneath her.",
      },
      {
        msg: "Been watching TVL flows on Aave lately — the utilisation rate shifts have been interesting post the rate change. What protocols are you watching?",
        score: +9,
        why: "TVL, utilisation rate, protocol-specific — you're talking in her language. She'll want to keep going.",
      },
    ],
  },
  {
    archetype: "Indie Musician",
    tier: "OK",
    color: "#E4D474",
    examples: [
      {
        msg: "I love music! My Spotify Wrapped was insane this year.",
        score: -5,
        why: "Spotify Wrapped flex with mainstream taste is exactly what she rolls her eyes at. Algorithm listener, not a real one.",
      },
      {
        msg: "Do you play or mainly produce? I've been going deep on modular synthesis lately — it's a rabbit hole.",
        score: +7,
        why: "Modular synthesis is niche and serious. You've signalled you go deep on music, not just consume it.",
      },
      {
        msg: "I've been obsessing over Grouper's production — that wet reverb on Dragging a Dead Deer is still unmatched. What are you working on?",
        score: +10,
        why: "Specific artist, specific album, specific sonic detail. Then you asked about her. This is how you score max.",
      },
    ],
  },
];

const UNIVERSAL_DONTS = [
  "Opening with a generic compliment on her looks",
  "Using a pickup line — ever",
  "Bragging about money or status unprompted",
  "Faking knowledge you don't have — she will test you",
  "One-word or one-line answers with zero substance",
  "Asking questions you could have answered yourself",
  "Pivoting to a completely unrelated topic mid-chat",
];

// ─── Components ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a09ab8]">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 space-y-14">

        {/* Header */}
        <div>
          <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Field Manual</p>
          <h1 className="text-5xl font-black uppercase sm:text-6xl">Tips &amp; Tricks</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#ffffff]">
            Every girl scores you on what you actually say. Know your target, pick the right closer, and protect your streak. This is how you win.
          </p>
        </div>

        {/* How scoring works */}
        <section>
          <SectionLabel>How Scoring Works</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { range: "+7 to +10", label: "She's into it", color: "#E4D474", desc: "Deep domain knowledge, genuine curiosity, smart humor. She'll warm up fast." },
              { range: "+1 to +6", label: "Decent",         color: "#E4D474", desc: "Polite and relevant. Not impressive but not damaging. Keep building." },
              { range: "-1 to -10", label: "Scored against you", color: "#a09ab8", desc: "Generic lines, faking knowledge, cringe energy. You're losing ground." },
            ].map((s) => (
              <div key={s.range} className="border bg-[#2d1a4a] p-5" style={{ borderColor: s.color + "44", borderTopColor: s.color, borderTopWidth: 2 }}>
                <p className="font-mono text-xl font-black" style={{ color: s.color }}>{s.range}</p>
                <p className="mt-1 font-black uppercase text-sm text-[#E4D474]">{s.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#a09ab8]">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 border border-[#a09ab8]/30 bg-[#160c2c] px-5 py-4">
            <p className="text-sm leading-6 text-[#ffffff]">
              <span className="font-black text-[#E4D474]">4 messages.</span> Your total score across all 4 replies determines your win % on the closer buttons. A great opener can be ruined by one bad follow-up — and a slow start can be recovered with substance.
            </p>
          </div>
        </section>

        {/* Message breakdowns */}
        <section>
          <SectionLabel>Message Breakdown — What You're Saying Wrong</SectionLabel>
          <p className="mb-5 text-sm leading-6 text-[#ffffff]">
            Real examples of bad, decent, and great openers — and exactly why each one scores the way it does.
          </p>
          <div className="space-y-5">
            {MESSAGE_BREAKDOWNS.map((b) => (
              <div key={b.archetype} className="border border-[#a09ab8]/30 bg-[#2d1a4a]">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-[#a09ab8]/20 px-5 py-3">
                  <span className="font-black uppercase text-sm" style={{ color: b.color }}>{b.archetype}</span>
                  <span className="font-mono text-[10px] border px-1.5 py-0.5 uppercase tracking-[0.16em]"
                    style={{ borderColor: b.color + "55", color: b.color }}>{b.tier}</span>
                </div>
                {/* Messages */}
                <div className="divide-y divide-[#a09ab8]/15">
                  {b.examples.map((ex, i) => {
                    const isGood = ex.score > 4;
                    const isBad  = ex.score < 0;
                    const scoreColor = isGood ? "#E4D474" : isBad ? "#a09ab8" : "#E4D474";
                    return (
                      <div key={i} className="px-5 py-4 space-y-2">
                        {/* Chat bubble */}
                        <div className="flex items-start gap-3">
                          <div
                            className="shrink-0 border px-1.5 py-0.5 font-mono text-[10px] font-black mt-0.5"
                            style={{ borderColor: scoreColor + "66", color: scoreColor }}
                          >
                            {ex.score > 0 ? `+${ex.score}` : ex.score}
                          </div>
                          <div className="flex-1 border border-[#a09ab8]/30 bg-[#160c2c] px-4 py-2.5">
                            <p className="text-sm leading-6 text-[#E4D474]">&ldquo;{ex.msg}&rdquo;</p>
                          </div>
                        </div>
                        {/* Why */}
                        <div className="flex items-start gap-3 pl-10">
                          <p className="text-sm leading-6 text-[#a09ab8]">
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] mr-2" style={{ color: scoreColor }}>Why:</span>
                            {ex.why}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tier guide */}
        {TIERS.map((tier) => (
          <section key={tier.label}>
            <div className="mb-5 flex items-center gap-3">
              <span className="border px-2.5 py-1 font-mono text-xs font-black uppercase tracking-[0.22em]"
                style={{ borderColor: tier.color, color: tier.color }}>
                {tier.label}
              </span>
              <span className="font-mono text-xs text-[#a09ab8]">{tier.cost}</span>
            </div>
            <p className="mb-5 text-sm leading-6 text-[#ffffff]">{tier.desc}</p>
            <div className="space-y-3">
              {tier.archetypes.map((a) => (
                <div key={a.title} className="border border-[#a09ab8]/30 bg-[#2d1a4a]">
                  <div className="flex items-center justify-between border-b border-[#a09ab8]/20 px-5 py-3">
                    <p className="font-black uppercase text-sm" style={{ color: tier.color }}>{a.title}</p>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <p className="text-sm leading-6 text-[#ffffff]">{a.tip}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">Say this</p>
                        <div className="space-y-1.5">
                          {a.dos.map((d) => (
                            <div key={d} className="flex items-center gap-2">
                              <span className="inline-block h-2.5 w-2.5 shrink-0 bg-[#E4D474]" />
                              <span className="text-sm text-[#ffffff]">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">Avoid this</p>
                        <div className="space-y-1.5">
                          {a.donts.map((d) => (
                            <div key={d} className="flex items-center gap-2">
                              <span className="inline-block h-2.5 w-2.5 shrink-0 bg-[#24153E] border border-[#a09ab8]/50" />
                              <span className="text-sm text-[#a09ab8]">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Closer strategy */}
        <section>
          <SectionLabel>Closer Strategy</SectionLabel>
          <p className="mb-5 text-sm leading-6 text-[#ffffff]">Picking the wrong closer on a good chat wastes AURA. Picking the right one on a bad chat still loses. Know when to use each.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CLOSER_TIPS.map((c) => (
              <div key={c.name} className="border-2 bg-[#2d1a4a] p-5 space-y-3" style={{ borderColor: c.color }}>
                <p className="font-mono text-sm font-black" style={{ color: c.color }}>{c.name}</p>
                <p className="text-sm leading-6 text-[#ffffff]">{c.rule}</p>
                <div className="border-t pt-3" style={{ borderTopColor: c.color + "33" }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: c.color }}>When to use</p>
                  <p className="text-sm leading-5 text-[#a09ab8]">{c.trigger}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Streak play */}
        <section>
          <SectionLabel>Streak Multipliers</SectionLabel>
          <p className="mb-5 text-sm leading-6 text-[#ffffff]">Win streaks stack your payout multiplier. A LEAVE doesn't break your streak — a loss does. Use LEAVE to preserve streaks when the chat goes badly.</p>
          <div className="border border-[#a09ab8]/30 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
            {STREAK_TIPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4 px-5 py-4">
                <div className="shrink-0 text-center">
                  <p className="font-mono text-2xl font-black text-[#E4D474]">{s.n}</p>
                  <p className="font-mono text-[9px] uppercase text-[#a09ab8]">{s.boost}</p>
                </div>
                <p className="text-sm leading-6 text-[#ffffff] pt-0.5">{s.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Universal don'ts */}
        <section className="pb-8">
          <SectionLabel>Universal Don'ts</SectionLabel>
          <p className="mb-5 text-sm leading-6 text-[#ffffff]">These tank your score with every archetype, every tier, no exceptions.</p>
          <div className="border border-[#a09ab8]/30 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
            {UNIVERSAL_DONTS.map((d) => (
              <div key={d} className="flex items-center gap-3 px-5 py-3.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 bg-[#24153E] border border-[#a09ab8]/50" />
                <span className="text-sm text-[#ffffff]">{d}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="border-2 border-[#E4D474] bg-[#E4D474] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
              href="/map"
            >
              Play Now
            </Link>
            <Link
              className="border-2 border-[#a09ab8] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-[#E4D474] transition hover:border-[#E4D474]"
              href="/how-to-play"
            >
              How to Play
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
