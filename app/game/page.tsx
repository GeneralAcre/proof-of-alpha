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

// ─── Tier display config ──────────────────────────────────────────────────────

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

function calcAura(
  closer: Closer,
  totalScore: number,
  girl: Girl,
  streak: number,
): { aura: number; win: boolean } {
  const mult = getStreakMultiplier(streak);
  if (closer === "flirt") {
    if (totalScore >= girl.winThreshold) {
      return { aura: Math.round(girl.flirtWin * mult), win: true };
    }
    return { aura: 0, win: false };
  }
  if (closer === "flex") {
    return { aura: Math.round(girl.flexWin * mult), win: true };
  }
  // leave — recover 50% approach cost
  return { aura: Math.round(girl.approachCost * 0.5), win: false };
}

// ─── Lobby ticker seed ────────────────────────────────────────────────────────

function seedTicker(): TickerEntry[] {
  const entries: TickerEntry[] = [];
  const girls = ["Bia (Influencer)", "Rin (Gym Girl)", "Luna (Crypto Degen)"];
  for (let i = 0; i < 8; i++) {
    const name = BOT_NAMES[i % BOT_NAMES.length];
    const girl = girls[i % 3];
    const pts  = Math.floor(Math.random() * 400) + 20;
    const fn   = TICKER_TEMPLATES[i % TICKER_TEMPLATES.length];
    entries.push({ id: i, text: fn(name, girl, pts) });
  }
  return entries;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerBar({ entries }: { entries: TickerEntry[] }) {
  return (
    <div className="border-b border-[#91897C] bg-[#1a1710] px-4 py-2 overflow-hidden">
      <div className="flex gap-8 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...entries, ...entries].map((e, i) => (
          <span key={i} className="font-mono text-[10px] text-[#91897C] shrink-0">{e.text}</span>
        ))}
      </div>
    </div>
  );
}

function AttractionBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, ((score + 40) / 80) * 100));
  const color = score > 10 ? "#00FF9D" : score > 0 ? "#EEF083" : score > -10 ? "#ffb1a1" : "#ff4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[9px] uppercase text-[#91897C]">
        <span>Vibe</span>
        <span>???</span>
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

  const [phase,          setPhase]         = useState<Phase>("lobby");
  const [girlQueue,      setGirlQueue]     = useState<GirlId[]>(["bia", "rin", "luna"]);
  const [currentGirl,    setCurrentGirl]   = useState<GirlId>("bia");
  const [messages,       setMessages]      = useState<ChatMsg[]>([]);
  const [draft,          setDraft]         = useState("");
  const [isLoading,      setIsLoading]     = useState(false);
  const [totalScore,     setTotalScore]    = useState(0);
  const [msgCount,       setMsgCount]      = useState(0);
  const [selectedCloser, setSelectedCloser]= useState<Closer | null>(null);
  const [verdict,        setVerdict]       = useState("");
  const [reaction,       setReaction]      = useState("neutral");
  const [auraEarned,     setAuraEarned]    = useState(0);
  const [results,        setResults]       = useState<RoundResult[]>([]);
  const [sessionAura,    setSessionAura]   = useState(STARTING_AURA);
  const [streak,         setStreak]        = useState(0);
  const [ticker,         setTicker]        = useState<TickerEntry[]>(() => seedTicker());
  const [tickerCount,    setTickerCount]   = useState(100);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const MAX_MSGS = 4;

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
        body: JSON.stringify({
          phase: "chat",
          girlId: currentGirl,
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
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
    const { aura, win } = calcAura(closer, totalScore, g, streak);
    setAuraEarned(aura);
    setSessionAura((prev) => prev + aura);
    if (win) {
      setStreak((s) => s + 1);
    } else if (closer !== "leave") {
      setStreak(0);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "resolve",
          girlId: currentGirl,
          messages: messages.map(({ role, content }) => ({ role, content })),
          closer,
          totalScore,
        }),
      });
      const data = await res.json() as { verdict: string; reaction: string };
      setVerdict(data.verdict ?? "...");
      setReaction(data.reaction ?? "neutral");

      const addrLabel = truncatedAddress ?? "ANON";
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

    setResults((prev) => [...prev, {
      girlId: currentGirl,
      totalScore,
      closer,
      auraEarned: aura,
      verdict: "",
      reaction: "neutral",
    }]);
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
    setMessages([]);
    setDraft("");
    setTotalScore(0);
    setMsgCount(0);
    setSelectedCloser(null);
    setVerdict("");
    setReaction("neutral");
    setAuraEarned(0);
    setPhase("lobby");
  }

  function startApproach(girlId: GirlId) {
    const g = getGirl(girlId);
    setSessionAura((prev) => prev - g.approachCost);
    setCurrentGirl(girlId);
    setMessages([]);
    setDraft("");
    setTotalScore(0);
    setMsgCount(0);
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

          {/* ── Header ── */}
          <div className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
              Proof of Alpha · Rizz Mode
            </p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <h1 className="text-4xl font-black uppercase sm:text-5xl">
                {allDone ? "All Rounds Done" : `Round ${roundNum} of 3`}
              </h1>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">AURA Balance</p>
                <p className={`font-mono text-2xl font-black ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                  {sessionAura}
                </p>
              </div>
            </div>

            {/* Streak badge */}
            {streak >= 2 && (
              <div className="mt-2 inline-flex items-center gap-1.5 border border-[#EEF083]/40 px-2 py-1">
                <span className="text-[10px]">🔥</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#EEF083]">
                  {streak}× Win Streak · {streakMult}× Boost Active
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-4 flex gap-1.5">
              {GIRLS.map((g) => (
                <div
                  key={g.id}
                  className="h-1 flex-1 transition-all duration-500"
                  style={{ backgroundColor: attempted.has(g.id) ? g.accentColor : "#3a342c" }}
                />
              ))}
            </div>
          </div>

          {/* ── Girl rows ── */}
          <div className="space-y-3">
            {GIRLS.map((g, i) => {
              const done       = attempted.has(g.id);
              const result     = results.find((r) => r.girlId === g.id);
              const tier       = TIER_STYLE[g.tier];
              const canAfford  = sessionAura >= g.approachCost;
              const flirtPreview = Math.round(g.flirtWin * streakMult);
              const flexPreview  = Math.round(g.flexWin * streakMult);

              return (
                <div
                  key={g.id}
                  className={`border bg-[#2f2922] transition-all duration-300 ${
                    done
                      ? "border-[#3a342c] opacity-60"
                      : "border-[#91897C] shadow-[4px_4px_0_#3a342c] hover:border-[#EEF083] hover:shadow-[4px_4px_0_#91897C]"
                  }`}
                >
                  {done ? (
                    /* Completed row */
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C] w-16 shrink-0">
                        Round {i + 1}
                      </span>
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-xs font-black"
                        style={{ borderColor: g.accentColor, color: g.accentColor }}
                      >
                        {g.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black uppercase text-[#EEF083] truncate">{g.name}</p>
                        <p className="font-mono text-[9px] uppercase text-[#91897C] truncate">{g.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-xs font-black" style={{ color: (result?.auraEarned ?? 0) > 0 ? "#EEF083" : "#91897C" }}>
                          +{result?.auraEarned ?? 0} AURA
                        </p>
                        <p className="font-mono text-[9px] uppercase text-[#91897C]">Done</p>
                      </div>
                    </div>
                  ) : (
                    /* Active row */
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center border-2 font-mono text-lg font-black"
                          style={{ borderColor: g.accentColor, color: g.accentColor }}
                        >
                          {g.initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
                              Round {i + 1}
                            </span>
                            <span
                              className="font-mono text-[9px] uppercase px-2 py-0.5 border font-black"
                              style={{ borderColor: tier.color, color: tier.color }}
                            >
                              {tier.label}
                            </span>
                          </div>
                          <p className="mt-1 text-2xl font-black uppercase text-[#EEF083]">{g.name}</p>
                          <p className="mt-0.5 text-xs italic text-[#91897C]">"{g.tagline}"</p>
                        </div>
                      </div>

                      {/* Economy stats */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="border border-[#3a342c] bg-[#1a1710] p-2">
                          <p className="font-mono text-[9px] uppercase text-[#91897C]">Entry</p>
                          <p className="mt-0.5 font-mono text-sm font-black text-[#ff6b6b]">−{g.approachCost}</p>
                        </div>
                        <div className="border border-[#3a342c] bg-[#1a1710] p-2">
                          <p className="font-mono text-[9px] uppercase text-[#91897C]">FLIRT Win</p>
                          <p className="mt-0.5 font-mono text-sm font-black text-[#EEF083]">
                            +{flirtPreview}
                            {streakMult > 1 && <span className="ml-1 text-[8px] text-[#91897C]">×{streakMult}</span>}
                          </p>
                        </div>
                        <div className="border border-[#3a342c] bg-[#1a1710] p-2">
                          <p className="font-mono text-[9px] uppercase text-[#91897C]">FLEX Safe</p>
                          <p className="mt-0.5 font-mono text-sm font-black text-[#00FF9D]">
                            +{flexPreview}
                            {streakMult > 1 && <span className="ml-1 text-[8px] text-[#91897C]">×{streakMult}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Hints */}
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                        {g.wins.slice(0, 3).map((w) => (
                          <p key={w} className="font-mono text-[9px] text-[#91897C]">
                            <span style={{ color: g.accentColor }}>+</span> {w}
                          </p>
                        ))}
                        {g.fails.slice(0, 2).map((f) => (
                          <p key={f} className="font-mono text-[9px] text-[#91897C]">
                            <span className="text-[#ff6b6b]">✗</span> {f}
                          </p>
                        ))}
                      </div>

                      {/* Approach button */}
                      <button
                        disabled={!canAfford}
                        className="mt-5 w-full border-2 py-3 font-black uppercase tracking-[0.1em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={canAfford ? {
                          borderColor: g.accentColor,
                          backgroundColor: g.accentColor,
                          color: "#241F19",
                        } : {
                          borderColor: "#3a342c",
                          backgroundColor: "transparent",
                          color: "#91897C",
                        }}
                        onMouseEnter={(e) => {
                          if (!canAfford) return;
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.style.backgroundColor = "transparent";
                          btn.style.color = g.accentColor;
                        }}
                        onMouseLeave={(e) => {
                          if (!canAfford) return;
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.style.backgroundColor = g.accentColor;
                          btn.style.color = "#241F19";
                        }}
                        onClick={() => startApproach(g.id)}
                        type="button"
                      >
                        {canAfford
                          ? `Approach ${g.name} — ${g.approachCost} AURA →`
                          : `Need ${g.approachCost} AURA`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cash out when all done */}
          {allDone && (
            <button
              className="mt-6 w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 text-lg font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
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

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#91897C] px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 font-mono text-xs font-black"
              style={{ borderColor: girl.accentColor, color: girl.accentColor }}
            >
              {girl.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black uppercase text-[#EEF083]">{girl.name}</p>
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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden w-24 sm:block sm:w-32">
              <AttractionBar score={totalScore} />
            </div>
            <div className="border border-[#91897C] px-2 py-1.5 text-center min-w-[44px]">
              <p className="font-mono text-[9px] uppercase text-[#91897C]">Msgs</p>
              <p className="font-mono text-sm font-black">{msgCount}/{MAX_MSGS}</p>
            </div>
            <div className="border border-[#91897C] px-2 py-1.5 text-center min-w-[44px]">
              <p className="font-mono text-[9px] uppercase text-[#91897C]">AURA</p>
              <p className={`font-mono text-sm font-black ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                {sessionAura}
              </p>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
                {girl.name} is waiting. Say something.
              </p>
              <p className="text-[10px] italic text-[#91897C]">"{girl.tagline}"</p>
              <p className="font-mono text-[9px] text-[#3a342c] uppercase">
                Win at {girl.winThreshold}+ pts · FLIRT: +{Math.round(girl.flirtWin * streakMult)} AURA · FLEX: +{Math.round(girl.flexWin * streakMult)} AURA
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[9px] font-black"
                  style={{ borderColor: girl.accentColor, color: girl.accentColor }}
                >
                  {girl.initials.slice(0, 2)}
                </div>
              )}
              <div
                className={`max-w-[75%] border px-3 py-2 text-sm leading-6 ${
                  msg.role === "user"
                    ? "border-[#EEF083] bg-[#EEF083]/10 text-[#EEF083]"
                    : "border-[#91897C] bg-[#2f2922] text-[#d8d4a1]"
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
            className="border-t border-[#91897C] flex"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              ref={inputRef}
              autoFocus
              className="flex-1 bg-transparent px-4 py-3.5 font-mono text-sm text-[#EEF083] placeholder-[#91897C] outline-none"
              disabled={isLoading || msgCount >= MAX_MSGS}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={msgCount >= MAX_MSGS ? "Choose your closer ↓" : `Type to ${girl.name}…`}
              type="text"
              value={draft}
            />
            <button
              className="border-l border-[#91897C] px-5 py-3.5 font-mono text-xs font-black uppercase text-[#91897C] transition hover:bg-[#EEF083] hover:text-[#241F19] disabled:opacity-40 touch-manipulation"
              disabled={!draft.trim() || isLoading || msgCount >= MAX_MSGS}
              type="submit"
            >
              Send
            </button>
          </form>
        ) : (
          /* LOCK PHASE — closer buttons */
          <div className="border-t border-[#91897C] bg-[#1a1710] p-4">
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
              Chat over — choose your closer
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                className="border border-[#EEF083] bg-[#EEF083]/5 px-2 py-4 text-center transition hover:bg-[#EEF083] hover:text-[#241F19] touch-manipulation"
                onClick={() => resolveRound("flirt")}
                type="button"
              >
                <p className="text-xl">✨</p>
                <p className="mt-1 font-black uppercase text-xs text-[#EEF083]">Flirt</p>
                <p className="mt-0.5 font-mono text-[9px] text-[#91897C]">Win if {girl.winThreshold}+ pts</p>
                <p className="font-mono text-[9px] text-[#EEF083]">+{Math.round(girl.flirtWin * streakMult)}</p>
              </button>
              <button
                className="border border-[#00FF9D] bg-[#00FF9D]/5 px-2 py-4 text-center transition hover:bg-[#00FF9D]/20 touch-manipulation"
                onClick={() => resolveRound("flex")}
                type="button"
              >
                <p className="text-xl">💪</p>
                <p className="mt-1 font-black uppercase text-xs text-[#EEF083]">Flex</p>
                <p className="mt-0.5 font-mono text-[9px] text-[#91897C]">Always wins</p>
                <p className="font-mono text-[9px] text-[#00FF9D]">+{Math.round(girl.flexWin * streakMult)}</p>
              </button>
              <button
                className="border border-[#91897C] bg-[#91897C]/5 px-2 py-4 text-center transition hover:bg-[#91897C]/10 touch-manipulation"
                onClick={() => resolveRound("leave")}
                type="button"
              >
                <p className="text-xl">🚶</p>
                <p className="mt-1 font-black uppercase text-xs text-[#EEF083]">Leave</p>
                <p className="mt-0.5 font-mono text-[9px] text-[#91897C]">50% back</p>
                <p className="font-mono text-[9px] text-[#91897C]">+{Math.round(girl.approachCost * 0.5)}</p>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RESOLVE ───────────────────────────────────────────────────────────────
  if (phase === "resolve") {
    const isFlirtGhost = selectedCloser === "flirt" && auraEarned === 0;
    const isWin        = auraEarned > 0 && selectedCloser !== "leave";

    return (
      <div className="flex h-svh flex-col bg-[#241F19] text-[#EEF083]">
        <Nav />
        <TickerBar entries={ticker} />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">

          {/* Girl header */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center border-2 font-mono text-sm font-black"
              style={{ borderColor: girl.accentColor, color: girl.accentColor }}
            >
              {girl.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black uppercase text-[#EEF083]">{girl.name}</p>
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

          {/* Verdict box */}
          <div className={`w-full max-w-lg border-2 p-6 text-center shadow-[8px_8px_0_#91897C] mb-6 ${
            isFlirtGhost ? "border-[#ff4444] bg-[#ff4444]/5" :
            isWin        ? "border-[#EEF083]" :
                           "border-[#91897C]"
          }`}>
            {isLoading ? (
              <p className="font-mono text-sm text-[#91897C] animate-pulse">Waiting for verdict…</p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
                  {girl.name} says:
                </p>
                <p className="text-lg font-bold leading-7 text-[#EEF083]">"{verdict || "..."}"</p>
              </>
            )}
          </div>

          {/* AURA earned */}
          {!isLoading && (
            <div className="mb-6 text-center">
              {isFlirtGhost && (
                <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-[#ff4444]">
                  👻 Ghosted — Score below {girl.winThreshold}
                </p>
              )}
              {selectedCloser === "leave" && (
                <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
                  🚶 Strategic Walk Away
                </p>
              )}
              <p className={`text-5xl font-black ${auraEarned > 0 ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                {auraEarned > 0 ? `+${auraEarned}` : "0"}
              </p>
              <p className="mt-1 font-mono text-xs uppercase text-[#91897C]">AURA Earned</p>
              <p className="mt-3 font-mono text-sm text-[#91897C]">
                Balance: <span className={`font-black ${sessionAura >= STARTING_AURA ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>{sessionAura}</span> AURA
              </p>
            </div>
          )}

          {/* Summary row */}
          {!isLoading && (
            <div className="mb-6 flex flex-wrap gap-4 font-mono text-xs text-[#91897C]">
              <span>Closer: <span className="uppercase text-[#EEF083]">{selectedCloser}</span></span>
              <span>Chat: <span className="text-[#EEF083]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
              {streak > 1 && <span>Streak: <span className="text-[#EEF083]">🔥 {streak}×</span></span>}
            </div>
          )}

          {!isLoading && (
            <button
              className="w-full max-w-lg border-2 border-[#EEF083] bg-[#EEF083] py-4 font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
              onClick={nextRound}
              type="button"
            >
              {girlQueue.filter((g) => g !== currentGirl).length > 0
                ? "Back to Lobby →"
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
