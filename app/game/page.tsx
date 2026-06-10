"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { GIRLS, BOT_NAMES, TICKER_TEMPLATES, getGirl, type GirlId, type Girl } from "../lib/girls";
import { sfx, initSounds } from "../lib/sounds";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "lobby" | "chat" | "lock" | "resolve";
type Closer = "flirt" | "flex" | "leave";

type ChatMsg = { role: "user" | "assistant"; content: string; score?: number };

type RoundResult = {
  girlId: GirlId;
  totalScore: number;
  closer: Closer;
  auraEarned: number;
  verdict: string;
  reaction: string;
};

type TickerEntry = { id: number; text: string };

// ─── Tier config ─────────────────────────────────────────────────────────────

const TIER_STYLE = {
  common:    { label: "COMMON",    color: "#91897C" },
  rare:      { label: "RARE",      color: "#60a5fa" },
  legendary: { label: "LEGENDARY", color: "#EEF083" },
} as const;

// ─── AURA economy ─────────────────────────────────────────────────────────────

const STARTING_AURA = 200;

function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 3.0;
  if (streak >= 3) return 1.75;
  if (streak >= 2) return 1.25;
  return 1.0;
}

/**
 * Win probability (0–100) based on conversation score.
 * score range realistically -20 to +40 with 4 messages.
 * FLIRT: high variance 15%→90% — big upside if she liked you, crashes if not.
 * FLEX:  safer floor  35%→70% — more consistent, lower ceiling.
 */
function calcWinChance(closer: Closer, totalScore: number): number {
  const score = Math.max(-20, Math.min(40, totalScore));
  const t = (score + 20) / 60; // 0..1
  if (closer === "flirt") return Math.round(15 + t * 75);
  if (closer === "flex")  return Math.round(35 + t * 35);
  return 0;
}

function calcAura(closer: Closer, totalScore: number, girl: Girl, streak: number) {
  const mult = getStreakMultiplier(streak);
  if (closer === "leave") {
    return { aura: Math.round(girl.approachCost * 0.5), win: false, winChance: 0 };
  }
  const winChance = calcWinChance(closer, totalScore);
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
  const { truncatedAddress } = useWallet();

  const archetypeId = params.get("archetype") ?? "alpha";

  const [phase,          setPhase]          = useState<Phase>("lobby");
  const [girlQueue,      setGirlQueue]      = useState<GirlId[]>(["bia", "rin", "luna"]);
  const [currentGirl,    setCurrentGirl]    = useState<GirlId>("bia");
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
        body: JSON.stringify({ phase: "chat", girlId: currentGirl, messages: newMessages.map(({ role, content }) => ({ role, content })) }),
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
    const g = getGirl(currentGirl);
    const { aura, win, winChance } = calcAura(closer, totalScore, g, streak);
    setAuraEarned(aura);
    setLastWinChance(winChance);
    setSessionAura((prev) => prev + aura);
    if (win) setStreak((s) => s + 1);
    else if (closer !== "leave") setStreak(0);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "resolve", girlId: currentGirl, messages: messages.map(({ role, content }) => ({ role, content })), closer, totalScore }),
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

  function startApproach(girlId: GirlId) {
    const g = getGirl(girlId);
    setSessionAura((prev) => prev - g.approachCost);
    setCurrentGirl(girlId);
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setPhase("chat");
    sfx.moveSelect();
  }

  const girl       = getGirl(currentGirl);
  const attempted  = new Set(results.map((r) => r.girlId));
  const streakMult = getStreakMultiplier(streak);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    const roundNum = attempted.size + 1;
    const allDone  = attempted.size === GIRLS.length;

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
              {GIRLS.map((g) => (
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
            {GIRLS.map((g, i) => {
              const done         = attempted.has(g.id);
              const result       = results.find((r) => r.girlId === g.id);
              const tier         = TIER_STYLE[g.tier];
              const canAfford    = sessionAura >= g.approachCost;
              const flirtPreview = Math.round(g.flirtWin * streakMult);
              const flexPreview  = Math.round(g.flexWin * streakMult);

              if (done) {
                return (
                  <div key={g.id} className="flex items-center gap-4 border border-[#3a342c] bg-[#2f2922]/60 px-5 py-4 opacity-50">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center border font-mono text-xs font-black"
                      style={{ borderColor: g.accentColor, color: g.accentColor }}
                    >
                      {g.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-[#EEF083] text-sm">{g.name}</p>
                      <p className="font-mono text-[9px] uppercase text-[#91897C]">{g.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-black" style={{ color: (result?.auraEarned ?? 0) > 0 ? "#EEF083" : "#91897C" }}>
                        +{result?.auraEarned ?? 0} AURA
                      </p>
                      <p className="font-mono text-[9px] uppercase text-[#91897C]">Done</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={g.id}
                  className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#1a1710]"
                  style={{ borderTopColor: g.accentColor, borderTopWidth: 3 }}
                >
                  <div className="p-5">
                    {/* Top row: avatar + info */}
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center border-2 font-mono text-base font-black"
                        style={{ borderColor: g.accentColor, color: g.accentColor }}
                      >
                        {g.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#91897C]">Round {i + 1}</span>
                          <span
                            className="font-mono text-[8px] uppercase px-1.5 py-0.5 border font-black"
                            style={{ borderColor: tier.color, color: tier.color }}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xl font-black uppercase" style={{ color: g.accentColor }}>{g.name}</p>
                        <p className="font-mono text-xs text-[#91897C]">{g.title}</p>
                      </div>
                    </div>

                    <p className="mt-3 border-l-2 pl-3 font-mono text-xs italic text-[#d8d4a1]" style={{ borderColor: g.accentColor }}>
                      "{g.tagline}"
                    </p>

                    {/* Economy stats */}
                    <div className="mt-4 grid grid-cols-3 divide-x divide-[#3a342c] border border-[#3a342c]">
                      <div className="bg-[#1a1710] px-3 py-2.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#91897C]">Entry</p>
                        <p className="mt-1 font-mono text-sm font-black text-[#ff6b6b]">−{g.approachCost}</p>
                      </div>
                      <div className="bg-[#1a1710] px-3 py-2.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#91897C]">Flirt Win</p>
                        <p className="mt-1 font-mono text-sm font-black text-[#EEF083]">
                          +{flirtPreview}
                          {streakMult > 1 && <span className="ml-1 text-[9px] text-[#91897C]">×{streakMult}</span>}
                        </p>
                      </div>
                      <div className="bg-[#1a1710] px-3 py-2.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#91897C]">Flex Win</p>
                        <p className="mt-1 font-mono text-sm font-black text-[#00FF9D]">
                          +{flexPreview}
                          {streakMult > 1 && <span className="ml-1 text-[9px] text-[#91897C]">×{streakMult}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Hints */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {g.wins.slice(0, 2).map((w) => (
                        <span key={w} className="font-mono text-[9px] text-[#91897C]">
                          <span style={{ color: g.accentColor }}>+ </span>{w}
                        </span>
                      ))}
                      {g.fails.slice(0, 2).map((f) => (
                        <span key={f} className="font-mono text-[9px] text-[#91897C]">
                          <span className="text-[#ff6b6b]">✗ </span>{f}
                        </span>
                      ))}
                    </div>

                    {/* Approach button */}
                    <button
                      disabled={!canAfford}
                      className="mt-4 w-full border-2 py-3.5 font-mono text-xs font-black uppercase tracking-widest transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                      style={canAfford ? {
                        borderColor: g.accentColor,
                        backgroundColor: g.accentColor,
                        color: "#241F19",
                      } : {
                        borderColor: "#3a342c",
                        color: "#91897C",
                      }}
                      onPointerEnter={(e) => {
                        if (!canAfford) return;
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = g.accentColor;
                      }}
                      onPointerLeave={(e) => {
                        if (!canAfford) return;
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = g.accentColor;
                        (e.currentTarget as HTMLButtonElement).style.color = "#241F19";
                      }}
                      onClick={() => startApproach(g.id)}
                      type="button"
                    >
                      {canAfford ? `Approach ${g.name} — ${g.approachCost} AURA →` : `Need ${g.approachCost} AURA`}
                    </button>
                  </div>
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
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 font-mono text-xs font-black"
              style={{ borderColor: girl.accentColor, color: girl.accentColor }}
            >
              {girl.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black uppercase" style={{ color: girl.accentColor }}>{girl.name}</p>
                <span
                  className="font-mono text-[8px] uppercase px-1.5 py-0.5 border"
                  style={{ borderColor: TIER_STYLE[girl.tier].color, color: TIER_STYLE[girl.tier].color }}
                >
                  {TIER_STYLE[girl.tier].label}
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
                <div
                  className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[9px] font-black"
                  style={{ borderColor: girl.accentColor, color: girl.accentColor }}
                >
                  {girl.initials.slice(0, 2)}
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
              const flirtChance = calcWinChance("flirt", totalScore);
              const flexChance  = calcWinChance("flex",  totalScore);
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

    return (
      <div className="flex h-svh flex-col bg-[#241F19] text-[#EEF083]">
        <Nav />
        <TickerBar entries={ticker} />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">

          {/* Girl badge */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center border-2 font-mono text-sm font-black"
              style={{ borderColor: girl.accentColor, color: girl.accentColor }}
            >
              {girl.initials}
            </div>
            <div className="text-left">
              <p className="font-black uppercase" style={{ color: girl.accentColor }}>{girl.name}</p>
              <p className="font-mono text-[9px] uppercase text-[#91897C]">{girl.title}</p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`w-full max-w-lg border-2 p-6 shadow-[8px_8px_0_#1a1710] mb-6 ${
            isMiss  ? "border-[#ff4444] bg-[#ff4444]/5" :
            isWin   ? "border-[#EEF083] bg-[#EEF083]/5" :
                      "border-[#91897C]"
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
              {isMiss  && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#ff4444]">Missed — {lastWinChance}% chance</p>}
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
                ? "Next Round →"
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
