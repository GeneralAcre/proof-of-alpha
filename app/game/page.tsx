"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { generateGirlSet, type Difficulty, type Girl } from "../lib/girls";
import { sfx, initSounds } from "../lib/sounds";
import { ARCHETYPES, type StatBlock } from "../lib/archetypes";
import { getCharacterLevel } from "../lib/upgrades";
import { syncPlayerStats } from "../lib/leaderboard";
import { hasBsol } from "../lib/solblaze";
import { calcWinChance, getStreakMultiplier } from "../lib/game-logic";
import { initPlayerOnChain } from "../lib/solana-client";
import { getOrInitAura, STARTING_AURA } from "../lib/aura";
import { hapticTap, hapticWin, hapticLoss, hapticSuccess } from "../lib/haptics";

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
  easy:   { label: "FRIENDLY", color: "#5e548e" },
  medium: { label: "OK",       color: "#5e548e" },
  hard:   { label: "ALPHA",    color: "#5e548e" },
  god:    { label: "GOD",      color: "#5e548e" },
} as const;

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
    info: { border: "#716a7e", text: "#231942", label: "#716a7e" },
    warn: { border: "#716a7e", text: "#716a7e", label: "#716a7e" },
    good: { border: "#5e548e", text: "#5e548e", label: "#5e548e" },
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
    <div className="border-b border-[#ddd6ea]/30 bg-[#f3f0fa] overflow-hidden">
      <div className="flex gap-12 animate-[ticker_30s_linear_infinite] whitespace-nowrap px-4 py-2">
        {[...entries, ...entries].map((e, i) => (
          <span key={i} className="font-mono text-[10px] text-[#716a7e] shrink-0">{e.text}</span>
        ))}
      </div>
    </div>
  );
}

function AttractionBar({ score }: { score: number }) {
  const pct   = Math.min(100, Math.max(0, ((score + 40) / 80) * 100));
  const color = score > 10 ? "#5e548e" : score > 0 ? "#5e548e" : score > -10 ? "#716a7e" : "#716a7e";
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[9px] uppercase text-[#716a7e]">
        <span>Vibe</span><span>???</span>
      </div>
      <div className="h-1.5 w-full border border-[#ddd6ea] bg-[#f8f7fc]">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────

function GameContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { truncatedAddress, account, selectedWallet } = useWallet();

  // Wallet guard — redirect to map if not connected
  useEffect(() => {
    if (!account) router.replace("/map");
  }, [account, router]);

  const archetypeId = params.get("archetype") ?? "alpha";
  const diffParam = params.get("difficulty") as Difficulty | null;
  const areaId    = params.get("area");
  const isThArea  = areaId === "superteamTH";

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

  const [girlSet] = useState<Girl[]>(() => generateGirlSet(diffParam ?? undefined, isThArea ? "th" : "default"));

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
  const [initialAura,    setInitialAura]    = useState(STARTING_AURA);
  const [awardStatus,    setAwardStatus]    = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [streak,         setStreak]         = useState(0);
  const [lastWinChance,  setLastWinChance]  = useState(0);
  const [ticker,         setTicker]         = useState<TickerEntry[]>([]);
  const [tickerCount,    setTickerCount]    = useState(100);

  const chatEndRef          = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);
  const pendingAwardRef     = useRef<string | null>(null);
  const sessionInitialized  = useRef(false);
  const MAX_MSGS            = 4;

  useEffect(() => { initSounds(); }, []);

  // Load the player's real AURA as the session starting balance.
  // getOrInitAura returns 200 and persists it for brand-new players.
  useEffect(() => {
    if (sessionInitialized.current) return;
    const addr = account?.address ? String(account.address) : null;
    if (!addr) return;
    const start = getOrInitAura(addr);
    setSessionAura(start);
    setInitialAura(start);
    sessionInitialized.current = true;
  }, [account]);
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
      if (!res.ok || !res.body) {
        setMessages([...newMessages, { role: "assistant", content: "...", score: 0 }]);
        if (newCount >= MAX_MSGS) setTimeout(() => setPhase("lock"), 600);
        return;
      }
      const reader = res.body.getReader();
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
    const walletAddr = account?.address ? String(account.address) : null;

    let aura = 0;
    let win  = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "resolve",
          archetypeId: currentGirl,
          girlName: girl.name,
          difficulty: girl.difficulty,
          messages: messages.map(({ role, content }) => ({ role, content })),
          closer,
          totalScore,
          playerWallet: walletAddr,
          streak,
          stats: charStats,
        }),
      });
      const data = await res.json() as {
        verdict: string;
        reaction: string;
        win: boolean;
        aura: number;
        winChance: number;
        token: string | null;
      };

      aura = data.aura ?? 0;
      win  = data.win  ?? false;

      setVerdict(data.verdict ?? "...");
      setReaction(data.reaction ?? "neutral");
      setAuraEarned(aura);
      setLastWinChance(data.winChance ?? 0);
      setSessionAura((prev) => prev + aura);

      if (win) setStreak((s) => s + 1);
      else if (closer !== "leave") setStreak(0);

      // On-chain AURA award — block next-round navigation until TX confirms
      if (data.token && walletAddr) {
        pendingAwardRef.current = data.token;
        void runAward(data.token);
      } else {
        setAwardStatus("ok");
      }

      // Supabase leaderboard sync (fire-and-forget)
      if (walletAddr && closer !== "leave") {
        void syncPlayerStats(walletAddr, sessionAura + aura, win, win ? streak + 1 : 0);
      }

      const addrLabel   = truncatedAddress ?? "ANON";
      const closerLabel = closer === "flirt" ? "FLIRT" : closer === "flex" ? "FLEX" : "LEAVE";
      pushTicker(`[${addrLabel}] tried to ${closerLabel} ${g.title}. She said: "${data.verdict}". ${aura > 0 ? `+${aura} AURA.` : "0 AURA. Devastating."}`);

      if (data.reaction === "impressed" || aura > 100) { sfx.roundWin(); void hapticWin(); }
      else if (aura === 0 && closer !== "leave") { sfx.matchLoss(); void hapticLoss(); }
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
    setAwardStatus("idle");
    const remaining = girlQueue.filter((g) => g !== currentGirl);
    if (remaining.length === 0) {
      const won = sessionAura > initialAura;
      router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${sessionAura - initialAura}&elims=0&mode=rizz`);
      return;
    }
    setGirlQueue(remaining);
    setCurrentGirl(remaining[0]);
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setSelectedCloser(null); setVerdict(""); setReaction("neutral"); setAuraEarned(0);
    setPhase("lobby");
  }

  async function runAward(token: string) {
    setAwardStatus("pending");
    try {
      let res = await fetch("/api/award-aura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.status === 402 && selectedWallet && account) {
        await initPlayerOnChain(selectedWallet, account);
        res = await fetch("/api/award-aura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
      if (res.ok) {
        setAwardStatus("ok");
        void hapticSuccess();
      } else {
        console.warn("[award-aura]", await res.text());
        setAwardStatus("error");
      }
    } catch (err) {
      console.error("[award-aura]", err);
      setAwardStatus("error");
    }
  }

  function startApproach(girlId: string) {
    const g = girlSet.find((gg) => gg.id === girlId)!;
    setSessionAura((prev) => prev - g.approachCost);
    setCurrentGirl(girlId);
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setPhase("chat");
    sfx.moveSelect();
    void hapticTap();
  }

  const girl       = girlSet.find((g) => g.id === currentGirl) ?? girlSet[0];
  const attempted  = new Set(results.map((r) => r.girlId));
  const streakMult = getStreakMultiplier(streak);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    const roundNum = attempted.size + 1;
    const allDone  = attempted.size === girlSet.length;

    return (
      <div className="flex min-h-svh flex-col bg-[#f8f7fc] text-[#5e548e] md:h-svh md:overflow-hidden">
        <Nav />
        <TickerBar entries={ticker} />

        <main className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">

          {/* Header */}
          <div className="mb-4 shrink-0">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-4 min-w-0">
                <button
                  onClick={() => router.push(`/map?archetype=${archetypeId}`)}
                  className="shrink-0 bg-[#5e548e] px-5 py-2 font-mono text-xs font-black uppercase tracking-widest text-white transition hover:opacity-80 touch-manipulation"
                  type="button"
                >
                  Back
                </button>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">
                    Proof of Alpha · Rizz Mode{isThArea && <span className="text-[#5e548e]"> · Superteam TH</span>}
                  </p>
                  <h1 className="text-3xl font-black uppercase leading-none sm:text-4xl">
                    {allDone ? "All Done" : `Round ${roundNum} of 3`}
                  </h1>
                </div>
              </div>
              <div className="flex shrink-0 items-end gap-2">
                {streak >= 2 && (
                  <div className="hidden border border-[#5e548e]/30 bg-[#5e548e]/5 px-3 py-1.5 sm:block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5e548e]">
                      {streak}× Streak · {streakMult}× Boost
                    </span>
                  </div>
                )}
                <div className="text-right border border-[#ddd6ea]/40 px-4 py-1.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#716a7e]">AURA</p>
                  <p className={`font-mono text-2xl font-black leading-none ${sessionAura >= initialAura ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                    {sessionAura}
                  </p>
                </div>
              </div>
            </div>

            {/* Round progress */}
            <div className="mt-3 flex gap-1.5">
              {girlSet.map((g) => (
                <div
                  key={g.id}
                  className="h-0.5 flex-1 transition-all duration-500"
                  style={{ backgroundColor: attempted.has(g.id) ? g.accentColor : "#170b2e" }}
                />
              ))}
            </div>
          </div>

          {/* Girl cards — one row on md+ */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            {girlSet.map((g, i) => {
              const done         = attempted.has(g.id);
              const result       = results.find((r) => r.girlId === g.id);
              const tier         = DIFF_STYLE[g.difficulty];
              const canAfford    = sessionAura >= g.approachCost;
              const flirtPreview = Math.round(g.flirtWin * streakMult);
              const flexPreview  = Math.round(g.flexWin * streakMult);

              return (
                <div
                  key={g.id}
                  className={`flex min-h-0 flex-col border border-[#ddd6ea]/40 bg-white ${done ? "opacity-40" : ""}`}
                >
                  {/* Portrait — stretches to fill the remaining height */}
                  <div className="relative min-h-40 flex-1 overflow-hidden border-b border-[#ddd6ea]/30 bg-[#f3f0fa]">
                    <Image
                      alt={g.name}
                      src={g.image}
                      fill
                      className="object-cover object-top grayscale transition duration-300 hover:grayscale-0"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#ffffff] via-white/10 to-transparent" />
                    <span className="absolute top-0 right-0 font-mono text-[10px] font-black uppercase tracking-[0.18em] border-b border-l border-[#5e548e]/50 bg-white px-3 py-1.5 text-[#5e548e]">
                      {tier.label}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-2">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">Round {i + 1}</p>
                      <p className="text-3xl font-black uppercase leading-none text-[#5e548e]">{g.name}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="shrink-0 px-4 pb-3 pt-2">
                    <p className="font-mono text-xs italic leading-5 text-[#716a7e] line-clamp-1">
                      &ldquo;{g.tagline}&rdquo;
                    </p>

                    {/* Economy row */}
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1 border border-[#ddd6ea]/30 px-2 py-1.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#716a7e]">Entry</p>
                        <p className="font-mono text-sm font-black text-[#716a7e]">−{g.approachCost}</p>
                      </div>
                      <div className="flex-1 border border-[#5e548e]/40 px-2 py-1.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#716a7e]">Flirt</p>
                        <p className="font-mono text-sm font-black text-[#5e548e]">
                          +{flirtPreview}{streakMult > 1 && <span className="ml-0.5 text-[10px] text-[#716a7e]">×{streakMult}</span>}
                        </p>
                      </div>
                      <div className="flex-1 border border-[#ddd6ea]/30 px-2 py-1.5 text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#716a7e]">Flex</p>
                        <p className="font-mono text-sm font-black text-[#231942]">
                          +{flexPreview}{streakMult > 1 && <span className="ml-0.5 text-[10px] text-[#716a7e]">×{streakMult}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Hints */}
                    <div className="mt-2 space-y-0.5">
                      {g.wins.slice(0, 2).map((w) => (
                        <p key={w} className="flex items-center gap-1.5 font-mono text-xs text-[#716a7e] truncate">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 bg-[#5e548e]" />
                          {w}
                        </p>
                      ))}
                      {g.fails.slice(0, 1).map((f) => (
                        <p key={f} className="flex items-center gap-1.5 font-mono text-xs text-[#716a7e] truncate">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 bg-[#f8f7fc] border border-[#ddd6ea]/50" />
                          {f}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Approach button / result */}
                  {done ? (
                    <div className="shrink-0 border-t border-[#ddd6ea]/30 py-3 text-center font-mono text-xs font-black uppercase tracking-widest text-[#716a7e]">
                      Done · {(result?.auraEarned ?? 0) > 0 ? `+${result?.auraEarned}` : "0"} AURA
                    </div>
                  ) : (
                    <button
                      disabled={!canAfford}
                      className="w-full shrink-0 border-t border-[#ddd6ea]/30 py-3 font-mono text-xs font-black uppercase tracking-widest transition-all touch-manipulation bg-[#5e548e] text-white hover:bg-[#eeeaf3] hover:text-[#231942] disabled:opacity-25 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#716a7e]"
                      onClick={() => startApproach(g.id)}
                      type="button"
                    >
                      {canAfford ? `Approach ${g.name} — ${g.approachCost} AURA` : `Need ${g.approachCost} AURA`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cash out */}
          {allDone && (
            <button
              className="mt-4 w-full shrink-0 border-2 border-[#5e548e] bg-[#5e548e] py-3 text-lg font-black uppercase text-white shadow-[6px_6px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
              onClick={() => {
                const won = sessionAura > initialAura;
                router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${sessionAura - initialAura}&elims=0&mode=rizz`);
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
      <div className="flex h-svh flex-col bg-[#f8f7fc] text-[#5e548e]">
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
              <p className="font-mono text-[9px] uppercase text-[#716a7e]">{girl.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden w-28 sm:block">
              <AttractionBar score={totalScore} />
            </div>
            <div className="border border-[#ddd6ea]/50 px-3 py-1.5 text-center min-w-13">
              <p className="font-mono text-[8px] uppercase text-[#716a7e]">Msgs</p>
              <p className="font-mono text-sm font-black">{msgCount}/{MAX_MSGS}</p>
            </div>
            <div className="border border-[#ddd6ea]/50 px-3 py-1.5 text-center min-w-13">
              <p className="font-mono text-[8px] uppercase text-[#716a7e]">AURA</p>
              <p className={`font-mono text-sm font-black ${sessionAura >= initialAura ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                {sessionAura}
              </p>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">
                {girl.name} is waiting.
              </p>
              <p className="text-sm italic text-[#716a7e]">"{girl.tagline}"</p>
              <p className="mt-3 font-mono text-[9px] text-[#170b2e] uppercase">
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
                    ? "border-[#5e548e] bg-[#5e548e]/10 text-[#5e548e]"
                    : "border-[#ddd6ea]/50 bg-white text-[#231942]"
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
            className="border-t border-[#ddd6ea]/50 flex"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              ref={inputRef}
              autoFocus
              className="flex-1 bg-transparent px-4 py-3.5 font-mono text-sm text-[#5e548e] placeholder-[#716a7e] outline-none"
              disabled={isLoading || msgCount >= MAX_MSGS}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={msgCount >= MAX_MSGS ? "Choose your closer" : `Message ${girl.name}…`}
              type="text"
              value={draft}
            />
            <button
              className="border-l border-[#ddd6ea]/50 px-5 py-3.5 font-mono text-xs font-black uppercase text-[#716a7e] transition hover:bg-[#5e548e] hover:text-white disabled:opacity-30 touch-manipulation"
              disabled={!draft.trim() || isLoading || msgCount >= MAX_MSGS}
              type="submit"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="border-t-2 border-[#ddd6ea]/40 bg-[#f3f0fa] p-4">
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">
              Chat over — pick your closer
            </p>
            {(() => {
              const flirtChance = calcWinChance("flirt", totalScore, girl.difficulty, charStats);
              const flexChance  = calcWinChance("flex",  totalScore, girl.difficulty, charStats);
              return (
                <div className="grid grid-cols-3 gap-2">
                  {/* Flirt */}
                  <button
                    className="border-2 border-[#5e548e] bg-[#5e548e]/5 px-2 py-4 text-center transition hover:bg-[#5e548e] hover:text-white touch-manipulation group"
                    onClick={() => resolveRound("flirt")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#716a7e] group-hover:text-[#231942]">Flirt</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#5e548e] group-hover:text-[#231942]">+{Math.round(girl.flirtWin * streakMult)}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-black" style={{ color: flirtChance >= 60 ? "#5e548e" : flirtChance >= 40 ? "#5e548e" : "#716a7e" }}>
                      {flirtChance}% WIN
                    </p>
                  </button>
                  {/* Flex */}
                  <button
                    className="border-2 border-[#5e548e] bg-[#5e548e]/5 px-2 py-4 text-center transition hover:bg-[#5e548e]/20 touch-manipulation"
                    onClick={() => resolveRound("flex")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#716a7e]">Flex</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#5e548e]">+{Math.round(girl.flexWin * streakMult)}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-black" style={{ color: flexChance >= 60 ? "#5e548e" : flexChance >= 40 ? "#5e548e" : "#716a7e" }}>
                      {flexChance}% WIN
                    </p>
                  </button>
                  {/* Leave */}
                  <button
                    className="border-2 border-[#ddd6ea]/40 bg-[#716a7e]/5 px-2 py-4 text-center transition hover:bg-[#716a7e]/15 touch-manipulation"
                    onClick={() => resolveRound("leave")}
                    type="button"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#716a7e]">Leave</p>
                    <p className="mt-1 font-mono text-lg font-black text-[#716a7e]">+{Math.round(girl.approachCost * 0.5)}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#716a7e]">Safe exit</p>
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
        <div className="relative flex h-svh flex-col overflow-hidden bg-[#f8f7fc]">
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
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7fc] via-[#f8f7fc]/70 to-[#f8f7fc]/20" />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col">
            <Nav />

            <div className="flex flex-1 flex-col items-center justify-end px-6 pb-12 text-center sm:justify-center sm:pb-0">

              {/* Status label */}
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#716a7e]">
                Not Interested
              </p>

              {/* Big headline */}
              <h1
                className="mt-2 font-black uppercase leading-[0.82] tracking-tight text-[#231942]"
                style={{ fontSize: "clamp(3rem, 12vw, 8rem)" }}
              >
                She
                <br />
                Left.
              </h1>

              {/* Her verdict */}
              {isLoading ? (
                <p className="mt-6 font-mono text-sm text-[#716a7e] animate-pulse">Waiting…</p>
              ) : (
                <div className="mt-6 max-w-md border-l-2 border-[#ddd6ea]/60 pl-4 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]/70">
                    {girl.name} said:
                  </p>
                  <p className="mt-1 text-base leading-7 font-semibold text-[#231942]">
                    &ldquo;{verdict || "..."}&rdquo;
                  </p>
                </div>
              )}

              {/* Stats row */}
              {!isLoading && (
                <div className="mt-6 flex gap-5 font-mono text-xs text-[#716a7e]">
                  <span>Odds: <span className="text-[#231942]">{lastWinChance}%</span></span>
                  <span>Score: <span className="text-[#231942]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
                  <span>AURA: <span className="text-[#716a7e]">+0</span></span>
                </div>
              )}

              {/* Next button */}
              {!isLoading && (
                <>
                  {awardStatus === "error" && (
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#716a7e]">
                      On-chain sync failed.{" "}
                      <button
                        type="button"
                        onClick={() => pendingAwardRef.current && void runAward(pendingAwardRef.current)}
                        className="text-[#5e548e] underline"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                  <button
                    disabled={awardStatus === "pending"}
                    className="mt-8 w-full max-w-sm border-2 border-white bg-white py-4 font-black uppercase tracking-widest text-[#f8f7fc] shadow-[6px_6px_0_rgba(0,0,0,0.5)] transition hover:bg-transparent hover:text-[#231942] touch-manipulation disabled:opacity-50 disabled:cursor-wait"
                    onClick={nextRound}
                    type="button"
                  >
                    {awardStatus === "pending"
                      ? "Confirming on-chain..."
                      : girlQueue.filter((g) => g !== currentGirl).length > 0
                        ? "Next Round"
                        : `Cash Out — ${sessionAura} AURA`}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      );
    }

    // ── WIN / LEAVE SCREEN ───────────────────────────────────────────────────
    return (
      <div className="flex h-svh flex-col bg-[#f8f7fc] text-[#5e548e]">
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
              <p className="font-mono text-[9px] uppercase text-[#716a7e]">{girl.title}</p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`w-full max-w-lg border-2 p-6 shadow-[8px_8px_0_#f3f0fa] mb-6 ${
            isWin ? "border-[#5e548e] bg-[#5e548e]/5" : "border-[#ddd6ea]"
          }`}>
            {isLoading ? (
              <p className="font-mono text-sm text-[#716a7e] animate-pulse">Waiting for her reaction…</p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">
                  {girl.name} says:
                </p>
                <p className="text-lg font-bold leading-7 text-[#5e548e]">"{verdict || "..."}"</p>
              </>
            )}
          </div>

          {/* AURA result */}
          {!isLoading && (
            <div className="mb-6">
              {isLeave && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#716a7e]">Safe exit</p>}
              {isWin   && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5e548e]">Win — {lastWinChance}% chance</p>}
              <p className={`text-6xl font-black tabular-nums ${auraEarned > 0 ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                {auraEarned > 0 ? `+${auraEarned}` : "0"}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-[#716a7e]">AURA</p>
              <p className="mt-3 font-mono text-sm text-[#716a7e]">
                Balance: <span className={`font-black ${sessionAura >= initialAura ? "text-[#5e548e]" : "text-[#716a7e]"}`}>{sessionAura}</span>
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="mb-6 flex gap-4 font-mono text-xs text-[#716a7e]">
              <span>Closer: <span className="uppercase text-[#5e548e]">{selectedCloser}</span></span>
              <span>Score: <span className="text-[#5e548e]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
              {!isLeave && <span>Odds: <span className="text-[#5e548e]">{lastWinChance}%</span></span>}
              {streak > 1 && <span>Streak: <span className="text-[#5e548e]">{streak}×</span></span>}
            </div>
          )}

          {!isLoading && (
            <>
              {awardStatus === "error" && (
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#716a7e]">
                  On-chain sync failed.{" "}
                  <button
                    type="button"
                    onClick={() => pendingAwardRef.current && void runAward(pendingAwardRef.current)}
                    className="text-[#5e548e] underline"
                  >
                    Retry
                  </button>
                </p>
              )}
              <button
                disabled={awardStatus === "pending"}
                className="w-full max-w-lg border-2 border-[#5e548e] bg-[#5e548e] py-4 font-black uppercase tracking-widest text-white shadow-[6px_6px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation disabled:opacity-50 disabled:cursor-wait"
                onClick={nextRound}
                type="button"
              >
                {awardStatus === "pending"
                  ? "Confirming on-chain..."
                  : girlQueue.filter((g) => g !== currentGirl).length > 0
                    ? "Next Round"
                    : `Cash Out — ${sessionAura} AURA`}
              </button>
            </>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f7fc]" />}>
      <GameContent />
    </Suspense>
  );
}
