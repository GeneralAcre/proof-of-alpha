"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { generateGirlSet, BOT_NAMES, TICKER_TEMPLATES, type Girl } from "../lib/girls";
import { sfx, initSounds } from "../lib/sounds";
import { ARCHETYPES, type StatBlock } from "../lib/archetypes";
import { getCharacterLevel } from "../lib/upgrades";
import { syncPlayerStats } from "../lib/leaderboard";
import { hasBsol } from "../lib/solblaze";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "lobby" | "chat" | "lock" | "resolve";
type Closer = "flirt" | "flex" | "leave";

type ChatMsg = { role: "user" | "assistant"; content: string; score?: number };

type RoundResult = {
  girlId: string;
  totalScore: number;
  closer: Closer;
  auraEarned: number;
  verdict: string;
  reaction: string;
};

type TickerEntry = { id: number; text: string };

// ─── Difficulty style ─────────────────────────────────────────────────────────

const DIFF_STYLE = {
  easy:   { label: "WARM",  color: "#EEF083" },
  medium: { label: "COLD",  color: "#EEF083" },
  hard:   { label: "ICY",   color: "#EEF083" },
} as const;

// ─── AURA economy ─────────────────────────────────────────────────────────────

const STARTING_AURA = 200;

function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 3.0;
  if (streak >= 3) return 1.75;
  if (streak >= 2) return 1.25;
  return 1.0;
}

// Difficulty penalty to win%: harder girls are harder to close
const DIFF_PENALTY: Record<string, number> = { easy: 0, medium: -12, hard: -25 };

// Stat bonus to win%: max +15% when stats are maxed
function statBonus(closer: Closer, stats: StatBlock): number {
  if (closer === "flirt") return Math.round(((stats.bluff + stats.aggression) / 20) * 15);
  if (closer === "flex")  return Math.round(((stats.aggression + stats.greed) / 20) * 15);
  return 0;
}

function calcWinChance(closer: Closer, totalScore: number, difficulty: string, stats: StatBlock): number {
  const score = Math.max(-20, Math.min(40, totalScore));
  const t = (score + 20) / 60; // 0..1
  let base = 0;
  if (closer === "flirt") base = 15 + t * 75;
  else if (closer === "flex") base = 35 + t * 35;
  else return 0;
  const penalty = DIFF_PENALTY[difficulty] ?? 0;
  const bonus   = statBonus(closer, stats);
  return Math.min(95, Math.max(5, Math.round(base + penalty + bonus)));
}

function calcAura(closer: Closer, totalScore: number, girl: Girl, streak: number, stats: StatBlock) {
  const mult = getStreakMultiplier(streak);
  if (closer === "leave") {
    return { aura: Math.round(girl.approachCost * 0.5), win: false, winChance: 0 };
  }
  const winChance = calcWinChance(closer, totalScore, girl.difficulty, stats);
  const won = Math.random() * 100 < winChance;
  const payout = closer === "flirt" ? girl.flirtWin : girl.flexWin;
  return { aura: won ? Math.round(payout * mult) : 0, win: won, winChance };
}

// ─── Ticker seed ─────────────────────────────────────────────────────────────

function seedTicker(): TickerEntry[] {
  const entries: TickerEntry[] = [];
  const girls = ["Bia (Influencer)", "Rin (Gym Girl)", "Luna (Crypto Degen)"];
  for (let i = 0; i < 8; i++) {
    const name = BOT_NAMES[i % BOT_NAMES.length];
    const girl = girls[i % 3];
    const pts  = Math.floor(Math.random() * 400) + 20;
    entries.push({ id: i, text: TICKER_TEMPLATES[i % TICKER_TEMPLATES.length](name, girl, pts) });
  }
  return entries;
}

// ─── Coach tip system ─────────────────────────────────────────────────────────

type CoachTipData = { text: string; type: "info" | "warn" | "good" };

function getCoachTip(girl: Girl, messages: ChatMsg[]): CoachTipData | null {
  const userMsgs  = messages.filter((m) => m.role === "user").length;
  const aiMsgs    = messages.filter((m) => m.role === "assistant" && m.content !== "▋");
  const lastAI    = aiMsgs[aiMsgs.length - 1];
  const lastScore = lastAI?.score ?? null;

  // No AI response yet — no tip
  if (lastScore === null) return null;

  // Score-reactive tips
  if (lastScore <= -6) {
    const tip = girl.wins[userMsgs % girl.wins.length];
    return { text: `She went cold. Pivot — try: ${tip.toLowerCase()}.`, type: "warn" };
  }
  if (lastScore < 0) {
    const fail = girl.fails[userMsgs % girl.fails.length];
    return { text: `That didn't land. She hates: ${fail.toLowerCase()}. Adjust.`, type: "warn" };
  }
  if (lastScore >= 7) {
    const next = girl.wins[(userMsgs + 1) % girl.wins.length];
    return { text: `She's into it. Double down on: ${next.toLowerCase()}.`, type: "good" };
  }
  if (lastScore > 0) {
    return { text: `Decent. She also likes: ${girl.wins[(userMsgs) % girl.wins.length].toLowerCase()}.`, type: "info" };
  }

  // Neutral — show a fail warning
  const fail = girl.fails[(userMsgs - 1) % girl.fails.length];
  return { text: `She's neutral. Avoid: ${fail.toLowerCase()}.`, type: "info" };
}

function CoachHint({ tip }: { tip: CoachTipData }) {
  const colors = {
    info: { border: "#91897C", text: "#d8d4a1", label: "#91897C" },
    warn: { border: "#ff6b6b", text: "#ffb1a1", label: "#ff6b6b" },
    good: { border: "#00FF9D", text: "#00FF9D", label: "#00FF9D" },
  }[tip.type];

  return (
    <div
      className="mt-1 inline-flex items-start gap-1.5 border-l-2 px-2 py-1"
      style={{ borderLeftColor: colors.border }}
    >
      <span className="shrink-0 font-mono text-[7px] uppercase tracking-[0.18em] mt-px" style={{ color: colors.label }}>
        Coach
      </span>
      <p className="font-mono text-[10px] leading-4" style={{ color: colors.text }}>
        {tip.text}
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerBar({ entries }: { entries: TickerEntry[] }) {
  return (
    <div className="border-b border-[#91897C]/30 bg-[#1a1710] overflow-hidden">
      <div className="flex gap-12 animate-[ticker_30s_linear_infinite] whitespace-nowrap px-4 py-2">
        {[...entries, ...entries].map((e, i) => (
          <span key={i} className="font-mono text-[10px] text-[#91897C] shrink-0">{e.text}</span>
        ))}
      </div>
    </div>
  );
}

function AttractionBar({ score }: { score: number }) {
  const pct   = Math.min(100, Math.max(0, ((score + 40) / 80) * 100));
  const color = score > 10 ? "#00FF9D" : score > 0 ? "#EEF083" : score > -10 ? "#ffb1a1" : "#ff4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[9px] uppercase text-[#91897C]">
        <span>Vibe</span><span>???</span>
      </div>
      <div className="h-1.5 w-full border border-[#91897C] bg-[#241F19]">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────

function GameContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { truncatedAddress, account } = useWallet();

  // Wallet guard — redirect to map if not connected
  useEffect(() => {
    if (!account) router.replace("/map");
  }, [account, router]);

  const archetypeId = params.get("archetype") ?? "alpha";
  const diffParam = params.get("difficulty") as "easy" | "medium" | "hard" | null;

  const [charStats, setCharStats] = useState<StatBlock>(() => {
    const arch = ARCHETYPES.find((a) => a.id === archetypeId);
    return arch ? arch.levels[0] : { aggression: 4, defense: 3, bluff: 2, greed: 3 };
  });

  useEffect(() => {
    const addr = account?.address ?? null;
    const level = getCharacterLevel(addr, archetypeId);
    const arch = ARCHETYPES.find((a) => a.id === archetypeId);
    if (arch) setCharStats(arch.levels[Math.max(0, level - 1)]);
  }, [archetypeId, account]);

  const [girlSet] = useState<Girl[]>(() => generateGirlSet(diffParam ?? undefined));

  const [phase,          setPhase]          = useState<Phase>("lobby");
  const [girlQueue,      setGirlQueue]      = useState<string[]>(() => girlSet.map((g) => g.id));
  const [currentGirl,    setCurrentGirl]    = useState<string>(() => girlSet[0]?.id ?? "");
  const [messages,       setMessages]       = useState<ChatMsg[]>([]);
  const [draft,          setDraft]          = useState("");
  const [isLoading,      setIsLoading]      = useState(false);
  const [totalScore,     setTotalScore]     = useState(0);
  const [msgCount,       setMsgCount]       = useState(0);
  const [selectedCloser, setSelectedCloser] = useState<Closer | null>(null);
  const [verdict,        setVerdict]        = useState("");
  const [reaction,       setReaction]       = useState("neutral");
  const [auraEarned,     setAuraEarned]     = useState(0);
  const [results,        setResults]        = useState<RoundResult[]>([]);
  const [sessionAura,    setSessionAura]    = useState(STARTING_AURA);
  const [streak,         setStreak]         = useState(0);
  const [lastWinChance,  setLastWinChance]  = useState(0);
  const [ticker,         setTicker]         = useState<TickerEntry[]>(() => seedTicker());
  const [tickerCount,    setTickerCount]    = useState(100);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const MAX_MSGS   = 4;

  useEffect(() => { initSounds(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);


  function pushTicker(text: string) {
    setTicker((prev) => [{ id: tickerCount, text }, ...prev.slice(0, 15)]);
    setTickerCount((n) => n + 1);
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || isLoading || msgCount >= MAX_MSGS) return;
    setDraft("");
    setIsLoading(true);
    sfx.moveSelect();
    const userMsg: ChatMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    const newCount = msgCount + 1;
    setMessages([...newMessages, { role: "assistant", content: "▋", score: 0 }]);
    setMsgCount(newCount);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "chat", archetypeId: currentGirl, girlName: girl.name, difficulty: girl.difficulty, messages: newMessages.map(({ role, content }) => ({ role, content })) }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const scoreIdx = fullText.indexOf("[SCORE:");
        const displayText = scoreIdx >= 0 ? fullText.slice(0, scoreIdx).trim() : fullText;
        setMessages([...newMessages, { role: "assistant", content: displayText + (scoreIdx < 0 ? "▋" : ""), score: 0 }]);
      }
      const scoreMatch = fullText.match(/\[SCORE:\s*(-?\d+)\]/);
      const score = scoreMatch ? Math.max(-10, Math.min(10, parseInt(scoreMatch[1]))) : 0;
      const scoreIdx = fullText.indexOf("[SCORE:");
      const finalText = (scoreIdx >= 0 ? fullText.slice(0, scoreIdx).trim() : fullText.trim()) || "...";
      setMessages([...newMessages, { role: "assistant", content: finalText, score }]);
      setTotalScore((s) => s + score);
      if (newCount >= MAX_MSGS) setTimeout(() => setPhase("lock"), 600);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "...", score: 0 }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function resolveRound(closer: Closer) {
    setSelectedCloser(closer);
    setPhase("resolve");
    setIsLoading(true);
    sfx.moveConfirm();
    const g = girlSet.find((gg) => gg.id === currentGirl) ?? girlSet[0];
    const { aura, win, winChance } = calcAura(closer, totalScore, g, streak, charStats);
    setAuraEarned(aura);
    setLastWinChance(winChance);
    setSessionAura((prev) => prev + aura);
    if (win) setStreak((s) => s + 1);
    else if (closer !== "leave") setStreak(0);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "resolve", archetypeId: currentGirl, girlName: girl.name, difficulty: girl.difficulty, messages: messages.map(({ role, content }) => ({ role, content })), closer, totalScore }),
      });
      const data = await res.json() as { verdict: string; reaction: string };
      setVerdict(data.verdict ?? "...");
      setReaction(data.reaction ?? "neutral");
      const addrLabel   = truncatedAddress ?? "ANON";
      const closerLabel = closer === "flirt" ? "FLIRT" : closer === "flex" ? "FLEX" : "LEAVE";
      pushTicker(`[${addrLabel}] tried to ${closerLabel} ${g.title}. She said: "${data.verdict}". ${aura > 0 ? `+${aura} AURA.` : "0 AURA. Devastating."}`);
      if (data.reaction === "impressed" || aura > 100) sfx.roundWin();
      else if (aura === 0) sfx.matchLoss();
      else sfx.moveConfirm();
    } catch {
      setVerdict("I have to go.");
      setReaction("neutral");
    } finally {
      setIsLoading(false);
    }
    setResults((prev) => [...prev, { girlId: currentGirl, totalScore, closer, auraEarned: aura, verdict: "", reaction: "neutral" }]);

    // Sync to Supabase leaderboard (fire-and-forget)
    const walletAddr = account?.address ? String(account.address) : null;
    if (walletAddr && closer !== "leave") {
      void syncPlayerStats(walletAddr, sessionAura + aura, win, win ? streak + 1 : 0);
    }
  }

  function nextRound() {
    const remaining = girlQueue.filter((g) => g !== currentGirl);
    if (remaining.length === 0) {
      const won = sessionAura > STARTING_AURA;
      router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${sessionAura}&elims=0&mode=rizz`);
      return;
    }
    setGirlQueue(remaining);
    setCurrentGirl(remaining[0]);
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setSelectedCloser(null); setVerdict(""); setReaction("neutral"); setAuraEarned(0);
    setPhase("lobby");
  }

  function startApproach(girlId: string) {
    const g = girlSet.find((gg) => gg.id === girlId)!;
    setSessionAura((prev) => prev - g.approachCost);
    setCurrentGirl(girlId);
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setPhase("chat");
    sfx.moveSelect();
  }

  const girl       = girlSet.find((g) => g.id === currentGirl) ?? girlSet[0];
  const attempted  = new Set(results.map((r) => r.girlId));
  const streakMult = getStreakMultiplier(streak);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    const roundNum = attempted.size + 1;
    const allDone  = attempted.size === girlSet.length;

    return (
      <div className="min-h-screen bg-[#241F19] text-[#EEF083] flex flex-col">
        <Nav />
        <TickerBar entries={ticker} />

        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">

          {/* Header */}
          <div className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
              Proof of Alpha · Rizz Mode
            </p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <h1 className="text-4xl font-black uppercase sm:text-5xl">
                {allDone ? "All Done" : `Round ${roundNum} of 3`}
              </h1>
              <div className="shrink-0 text-right border border-[#91897C]/40 px-4 py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">AURA</p>
                <p className={`font-mono text-2xl font-black leading-none ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                  {sessionAura}
                </p>
              </div>
            </div>

            {streak >= 2 && (
              <div className="mt-3 inline-flex items-center gap-2 border border-[#EEF083]/30 bg-[#EEF083]/5 px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#EEF083]">
                  {streak}× Win Streak · {streakMult}× Boost
                </span>
              </div>
            )}

            {/* Round progress */}
            <div className="mt-4 flex gap-1.5">
              {girlSet.map((g) => (
                <div
                  key={g.id}
                  className="h-0.5 flex-1 transition-all duration-500"
                  style={{ backgroundColor: attempted.has(g.id) ? g.accentColor : "#3a342c" }}
                />
              ))}
            </div>
          </div>

          {/* Girl cards */}
          <div className="space-y-4">
            {girlSet.map((g, i) => {
              const done         = attempted.has(g.id);
              const result       = results.find((r) => r.girlId === g.id);
              const tier         = DIFF_STYLE[g.difficulty];
              const canAfford    = sessionAura >= g.approachCost;
              const flirtPreview = Math.round(g.flirtWin * streakMult);
              const flexPreview  = Math.round(g.flexWin * streakMult);

              if (done) {
                return (
                  <div key={g.id} className="flex items-center gap-4 border border-[#2a2520] bg-[#2a2520] px-5 py-4 opacity-40">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-[#3a342c] grayscale">
                      <Image alt={g.name} src={g.image} fill className="object-cover object-top" sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-[#91897C] text-sm">{g.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-black text-[#91897C]">
                        {(result?.auraEarned ?? 0) > 0 ? `+${result?.auraEarned}` : "0"} AURA
                      </p>
                      <p className="font-mono text-[9px] uppercase text-[#3a342c]">Done</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={g.id} className="border border-[#91897C]/40 bg-[#2f2922]">
                  <div className="flex items-stretch">

                    {/* Portrait */}
                    <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-[#1a1710] border-r border-[#91897C]/30">
                      <Image
                        alt={g.name}
                        src={g.image}
                        fill
                        className="object-cover object-top grayscale transition duration-300 hover:grayscale-0"
                        sizes="(max-width: 640px) 112px, 144px"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#2f2922]/70 to-transparent" />
                      {/* Difficulty badge over portrait */}
                      <div className="absolute bottom-2 left-2">
                        <span className="font-mono text-[7px] font-black uppercase tracking-[0.2em] border border-[#EEF083]/40 bg-[#241F19]/80 px-1.5 py-0.5 text-[#EEF083]/70">
                          {tier.label}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Name + round */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm uppercase tracking-[0.2em] text-[#91897C]">Round {i + 1}</span>
                        </div>
                        <p className="text-3xl font-black uppercase text-[#EEF083] leading-none">{g.name}</p>

                        {/* Tagline */}
                        <p className="mt-2 font-mono text-sm italic text-[#91897C] leading-5">
                          "{g.tagline}"
                        </p>
                      </div>

                      {/* Economy row */}
                      <div className="mt-4 flex gap-5 border-t border-[#91897C]/20 pt-3">
                        <div>
                          <p className="font-mono text-xs uppercase tracking-wide text-[#91897C]">Entry</p>
                          <p className="font-mono text-base font-black text-[#ff6b6b]">−{g.approachCost}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase tracking-wide text-[#91897C]">Flirt</p>
                          <p className="font-mono text-base font-black text-[#EEF083]">
                            +{flirtPreview}{streakMult > 1 && <span className="ml-0.5 text-xs text-[#91897C]">×{streakMult}</span>}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase tracking-wide text-[#91897C]">Flex</p>
                          <p className="font-mono text-base font-black text-[#d8d4a1]">
                            +{flexPreview}{streakMult > 1 && <span className="ml-0.5 text-xs text-[#91897C]">×{streakMult}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Hints */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {g.wins.slice(0, 2).map((w) => (
                          <span key={w} className="inline-flex items-center gap-1.5 font-mono text-sm text-[#91897C]">
                            <span className="inline-block h-3 w-3 shrink-0 bg-[#EEF083]" />
                            {w}
                          </span>
                        ))}
                        {g.fails.slice(0, 1).map((f) => (
                          <span key={f} className="inline-flex items-center gap-1.5 font-mono text-sm text-[#91897C]">
                            <span className="inline-block h-3 w-3 shrink-0 bg-[#241F19] border border-[#91897C]/50" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Approach button — full width below */}
                  <button
                    disabled={!canAfford}
                    className="w-full border-t border-[#91897C]/30 py-3.5 font-mono text-xs font-black uppercase tracking-widest transition-all touch-manipulation bg-[#EEF083] text-[#241F19] hover:bg-[#d8d4a1] disabled:opacity-25 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#91897C]"
                    onClick={() => startApproach(g.id)}
                    type="button"
                  >
                    {canAfford ? `Approach ${g.name} — ${g.approachCost} AURA` : `Need ${g.approachCost} AURA`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cash out */}
          {allDone && (
            <button
              className="mt-6 w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 text-lg font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
              onClick={() => {
                const won = sessionAura > STARTING_AURA;
                router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${sessionAura}&elims=0&mode=rizz`);
              }}
              type="button"
            >
              Cash Out — {sessionAura} AURA
            </button>
          )}
        </main>
      </div>
    );
  }

  // ── CHAT + LOCK ───────────────────────────────────────────────────────────
  if (phase === "chat" || phase === "lock") {
    return (
      <div className="flex h-svh flex-col bg-[#241F19] text-[#EEF083]">
        <Nav />
        <TickerBar entries={ticker} />

        {/* Chat header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderBottomColor: girl.accentColor, borderBottomWidth: 2 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden border-2"
              style={{ borderColor: girl.accentColor }}>
              <Image alt={girl.name} src={girl.image} fill className="object-cover object-top" sizes="40px" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black uppercase" style={{ color: girl.accentColor }}>{girl.name}</p>
                <span
                  className="font-mono text-[8px] uppercase px-1.5 py-0.5 border"
                  style={{ borderColor: DIFF_STYLE[girl.difficulty].color, color: DIFF_STYLE[girl.difficulty].color }}
                >
                  {DIFF_STYLE[girl.difficulty].label}
                </span>
              </div>
              <p className="font-mono text-[9px] uppercase text-[#91897C]">{girl.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden w-28 sm:block">
              <AttractionBar score={totalScore} />
            </div>
            <div className="border border-[#91897C]/50 px-3 py-1.5 text-center min-w-13">
              <p className="font-mono text-[8px] uppercase text-[#91897C]">Msgs</p>
              <p className="font-mono text-sm font-black">{msgCount}/{MAX_MSGS}</p>
            </div>
            <div className="border border-[#91897C]/50 px-3 py-1.5 text-center min-w-13">
              <p className="font-mono text-[8px] uppercase text-[#91897C]">AURA</p>
              <p className={`font-mono text-sm font-black ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                {sessionAura}
              </p>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
                {girl.name} is waiting.
              </p>
              <p className="text-sm italic text-[#91897C]">"{girl.tagline}"</p>
              <p className="mt-3 font-mono text-[9px] text-[#3a342c] uppercase">
                Win threshold {girl.winThreshold}+ pts · Flirt +{Math.round(girl.flirtWin * streakMult)} · Flex +{Math.round(girl.flexWin * streakMult)}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 relative h-7 w-7 shrink-0 overflow-hidden border"
                  style={{ borderColor: girl.accentColor }}>
                  <Image alt={girl.name} src={girl.image} fill className="object-cover object-top" sizes="28px" />
                </div>
              )}
              <div
                className={`max-w-[75%] border px-3 py-2 text-sm leading-6 ${
                  msg.role === "user"
                    ? "border-[#EEF083] bg-[#EEF083]/10 text-[#EEF083]"
                    : "border-[#91897C]/50 bg-[#2f2922] text-[#d8d4a1]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {/* Coach hint — shows under last AI message */}
          {phase === "chat" && !isLoading && (() => {
            const tip = getCoachTip(girl, messages);
            return tip ? (
              <div className="flex justify-start pl-9">
                <CoachHint tip={tip} />
              </div>
            ) : null;
          })()}

          <div ref={chatEndRef} />
        </div>

        {/* Input or closer buttons */}
        {phase === "chat" ? (
          <form
            className="border-t border-[#91897C]/50 flex"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              ref={inputRef}
              autoFocus
              className="flex-1 bg-transparent px-4 py-3.5 font-mono text-sm text-[#EEF083] placeholder-[#91897C] outline-none"
              disabled={isLoading || msgCount >= MAX_MSGS}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={msgCount >= MAX_MSGS ? "Choose your closer ↓" : `Message ${girl.name}…`}
              type="text"
              value={draft}
            />
            <button
              className="border-l border-[#91897C]/50 px-5 py-3.5 font-mono text-xs font-black uppercase text-[#91897C] transition hover:bg-[#EEF083] hover:text-[#241F19] disabled:opacity-30 touch-manipulation"
              disabled={!draft.trim() || isLoading || msgCount >= MAX_MSGS}
              type="submit"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="border-t-2 border-[#91897C]/40 bg-[#1a1710] p-4">
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
              Chat over — pick your closer
            </p>
            {(() => {
              const flirtChance = calcWinChance("flirt", totalScore, girl.difficulty, charStats);
              const flexChance  = calcWinChance("flex",  totalScore, girl.difficulty, charStats);
              return (
                <div className="grid grid-cols-3 gap-2">
                  {/* Flirt */}
                  <button
                    className="border-2 border-[#EEF083] bg-[#EEF083]/5 px-2 py-4 text-center transition hover:bg-[#EEF083] hover:text-[#241F19] touch-manipulation group"
                    onClick={() => resolveRound("flirt")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#91897C] group-hover:text-[#241F19]">Flirt</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#EEF083] group-hover:text-[#241F19]">+{Math.round(girl.flirtWin * streakMult)}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-black" style={{ color: flirtChance >= 60 ? "#00FF9D" : flirtChance >= 40 ? "#EEF083" : "#ff6b6b" }}>
                      {flirtChance}% WIN
                    </p>
                  </button>
                  {/* Flex */}
                  <button
                    className="border-2 border-[#00FF9D] bg-[#00FF9D]/5 px-2 py-4 text-center transition hover:bg-[#00FF9D]/20 touch-manipulation"
                    onClick={() => resolveRound("flex")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#91897C]">Flex</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#00FF9D]">+{Math.round(girl.flexWin * streakMult)}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-black" style={{ color: flexChance >= 60 ? "#00FF9D" : flexChance >= 40 ? "#EEF083" : "#ff6b6b" }}>
                      {flexChance}% WIN
                    </p>
                  </button>
                  {/* Leave */}
                  <button
                    className="border-2 border-[#91897C]/40 bg-[#91897C]/5 px-2 py-4 text-center transition hover:bg-[#91897C]/15 touch-manipulation"
                    onClick={() => resolveRound("leave")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#91897C]">Leave</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#91897C]">+{Math.round(girl.approachCost * 0.5)}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#91897C]">Safe exit</p>
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // ── RESOLVE ───────────────────────────────────────────────────────────────
  if (phase === "resolve") {
    const isLeave   = selectedCloser === "leave";
    const isMiss    = !isLeave && auraEarned === 0;
    const isWin     = auraEarned > 0 && !isLeave;

    // ── LOSS SCREEN ──────────────────────────────────────────────────────────
    if (isMiss) {
      return (
        <div className="relative flex h-svh flex-col overflow-hidden bg-[#0a0906]">
          {/* Loss background image */}
          <Image
            src="/loss-alpha.png"
            alt="Loss"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />

          {/* Dark overlay */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0a0906] via-[#0a0906]/70 to-[#0a0906]/20" />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col">
            <Nav />

            <div className="flex flex-1 flex-col items-center justify-end px-6 pb-12 text-center sm:justify-center sm:pb-0">

              {/* Status label */}
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#ff4444]">
                Not Interested
              </p>

              {/* Big headline */}
              <h1
                className="mt-2 font-black uppercase leading-[0.82] tracking-tight text-white"
                style={{ fontSize: "clamp(3rem, 12vw, 8rem)" }}
              >
                She
                <br />
                Left.
              </h1>

              {/* Her verdict */}
              {isLoading ? (
                <p className="mt-6 font-mono text-sm text-[#91897C] animate-pulse">Waiting…</p>
              ) : (
                <div className="mt-6 max-w-md border-l-2 border-[#ff4444]/60 pl-4 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff4444]/70">
                    {girl.name} said:
                  </p>
                  <p className="mt-1 text-base leading-7 font-semibold text-[#d8d4a1]">
                    &ldquo;{verdict || "..."}&rdquo;
                  </p>
                </div>
              )}

              {/* Stats row */}
              {!isLoading && (
                <div className="mt-6 flex gap-5 font-mono text-xs text-[#91897C]">
                  <span>Odds: <span className="text-white">{lastWinChance}%</span></span>
                  <span>Score: <span className="text-white">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
                  <span>AURA: <span className="text-[#ff4444]">+0</span></span>
                </div>
              )}

              {/* Next button */}
              {!isLoading && (
                <button
                  className="mt-8 w-full max-w-sm border-2 border-white bg-white py-4 font-black uppercase tracking-widest text-[#0a0906] shadow-[6px_6px_0_rgba(0,0,0,0.5)] transition hover:bg-transparent hover:text-white touch-manipulation"
                  onClick={nextRound}
                  type="button"
                >
                  {girlQueue.filter((g) => g !== currentGirl).length > 0
                    ? "Next Round"
                    : `Cash Out — ${sessionAura} AURA`}
                </button>
              )}

            </div>
          </div>
        </div>
      );
    }

    // ── WIN / LEAVE SCREEN ───────────────────────────────────────────────────
    return (
      <div className="flex h-svh flex-col bg-[#241F19] text-[#EEF083]">
        <Nav />
        <TickerBar entries={ticker} />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">

          {/* Girl badge */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden border-2"
              style={{ borderColor: girl.accentColor }}>
              <Image alt={girl.name} src={girl.image} fill className="object-cover object-top" sizes="64px" />
            </div>
            <div className="text-left">
              <p className="font-black uppercase" style={{ color: girl.accentColor }}>{girl.name}</p>
              <p className="font-mono text-[9px] uppercase text-[#91897C]">{girl.title}</p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`w-full max-w-lg border-2 p-6 shadow-[8px_8px_0_#1a1710] mb-6 ${
            isWin ? "border-[#EEF083] bg-[#EEF083]/5" : "border-[#91897C]"
          }`}>
            {isLoading ? (
              <p className="font-mono text-sm text-[#91897C] animate-pulse">Waiting for her reaction…</p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
                  {girl.name} says:
                </p>
                <p className="text-lg font-bold leading-7 text-[#EEF083]">"{verdict || "..."}"</p>
              </>
            )}
          </div>

          {/* AURA result */}
          {!isLoading && (
            <div className="mb-6">
              {isLeave && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#91897C]">Safe exit</p>}
              {isWin   && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00FF9D]">Win — {lastWinChance}% chance</p>}
              <p className={`text-6xl font-black tabular-nums ${auraEarned > 0 ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                {auraEarned > 0 ? `+${auraEarned}` : "0"}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-[#91897C]">AURA</p>
              <p className="mt-3 font-mono text-sm text-[#91897C]">
                Balance: <span className={`font-black ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>{sessionAura}</span>
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="mb-6 flex gap-4 font-mono text-xs text-[#91897C]">
              <span>Closer: <span className="uppercase text-[#EEF083]">{selectedCloser}</span></span>
              <span>Score: <span className="text-[#EEF083]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
              {!isLeave && <span>Odds: <span className="text-[#EEF083]">{lastWinChance}%</span></span>}
              {streak > 1 && <span>Streak: <span className="text-[#EEF083]">{streak}×</span></span>}
            </div>
          )}

          {!isLoading && (
            <button
              className="w-full max-w-lg border-2 border-[#EEF083] bg-[#EEF083] py-4 font-black uppercase tracking-widest text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
              onClick={nextRound}
              type="button"
            >
              {girlQueue.filter((g) => g !== currentGirl).length > 0
                ? "Next Round"
                : `Cash Out — ${sessionAura} AURA`}
            </button>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <GameContent />
    </Suspense>
  );
}
