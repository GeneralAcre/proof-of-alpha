"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, type StatBlock } from "../lib/archetypes";
import { getCharacterLevel } from "../lib/upgrades";
import { getOrInitAura, STARTING_AURA } from "../lib/aura";
import { calcWinChance, getStreakMultiplier } from "../lib/game-logic";
import { sfx, initSounds } from "../lib/sounds";
import { hapticTap, hapticWin, hapticLoss } from "../lib/haptics";
import {
  getScenario,
  SCENARIO_DIFF_LABEL,
  SCENARIO_CATEGORY_LABEL,
  type Scenario,
  type ScenarioCloser,
} from "../lib/scenarios";

type Phase = "lobby" | "chat" | "lock" | "resolve";
type ChatMsg = { role: "user" | "assistant"; content: string; score?: number };

const DIFF_ACCENT: Record<string, string> = {
  easy:   "#5e548e",
  medium: "#716a7e",
  hard:   "#9945FF",
};

// ─── Handling bar ─────────────────────────────────────────────────────────────

function HandlingBar({ score }: { score: number }) {
  const pct   = Math.min(100, Math.max(0, ((score + 40) / 80) * 100));
  const color = score >= 0 ? "#5e548e" : "#716a7e";
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[9px] uppercase text-[#716a7e]">
        <span>Handling</span>
        <span>{score > 0 ? `+${score}` : score}</span>
      </div>
      <div className="h-1.5 w-full border border-[#ddd6ea] bg-[#f8f7fc]">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Coach tip ────────────────────────────────────────────────────────────────

type CoachTipData = { text: string; type: "info" | "warn" | "good" };

function getCoachTip(scenario: Scenario, messages: ChatMsg[]): CoachTipData | null {
  const userMsgs  = messages.filter((m) => m.role === "user").length;
  const aiMsgs    = messages.filter((m) => m.role === "assistant" && m.content !== "▋");
  const lastAI    = aiMsgs[aiMsgs.length - 1];
  const lastScore = lastAI?.score ?? null;
  if (lastScore === null) return null;
  if (lastScore <= -6) return { text: `She's pulling back. Avoid: ${scenario.pitfalls[userMsgs % scenario.pitfalls.length].toLowerCase()}.`, type: "warn" };
  if (lastScore < 0)   return { text: `That landed cold. Try: ${scenario.tips[userMsgs % scenario.tips.length].toLowerCase()}.`, type: "warn" };
  if (lastScore >= 7)  return { text: `She's warming up. Keep going: ${scenario.tips[(userMsgs + 1) % scenario.tips.length].toLowerCase()}.`, type: "good" };
  if (lastScore > 0)   return { text: `Decent. Also try: ${scenario.tips[userMsgs % scenario.tips.length].toLowerCase()}.`, type: "info" };
  return { text: `She's neutral. Avoid: ${scenario.pitfalls[(userMsgs - 1) % scenario.pitfalls.length].toLowerCase()}.`, type: "info" };
}

function CoachHint({ tip }: { tip: CoachTipData }) {
  const c = { info: { b: "#716a7e", t: "#231942" }, warn: { b: "#716a7e", t: "#716a7e" }, good: { b: "#5e548e", t: "#5e548e" } }[tip.type];
  return (
    <div className="mt-1 inline-flex items-start gap-1.5 border-l-2 px-2 py-1" style={{ borderLeftColor: c.b }}>
      <span className="shrink-0 font-mono text-[7px] uppercase tracking-[0.18em] mt-px text-[#716a7e]">Coach</span>
      <p className="font-mono text-[10px] leading-4" style={{ color: c.t }}>{tip.text}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function LifeContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { account } = useWallet();

  useEffect(() => {
    if (!account) router.replace("/scenarios");
  }, [account, router]);

  const scenarioId  = params.get("scenario") ?? "";
  const archetypeId = params.get("archetype") ?? "alpha";
  const scenario    = getScenario(scenarioId);

  const [charStats, setCharStats] = useState<StatBlock>(() => {
    const arch = ARCHETYPES.find((a) => a.id === archetypeId);
    return arch ? arch.levels[0] : { aggression: 4, defense: 3, bluff: 2, greed: 3 };
  });

  useEffect(() => {
    const addr  = account?.address ?? null;
    const level = getCharacterLevel(addr ? String(addr) : null, archetypeId);
    const arch  = ARCHETYPES.find((a) => a.id === archetypeId);
    if (arch) setCharStats(arch.levels[Math.max(0, level - 1)]);
  }, [archetypeId, account]);

  const [phase,          setPhase]          = useState<Phase>("lobby");
  const [messages,       setMessages]       = useState<ChatMsg[]>([]);
  const [draft,          setDraft]          = useState("");
  const [isLoading,      setIsLoading]      = useState(false);
  const [totalScore,     setTotalScore]     = useState(0);
  const [msgCount,       setMsgCount]       = useState(0);
  const [selectedCloser, setSelectedCloser] = useState<ScenarioCloser | null>(null);
  const [verdict,        setVerdict]        = useState("");
  const [auraEarned,     setAuraEarned]     = useState(0);
  const [lastWinChance,  setLastWinChance]  = useState(0);
  const [sessionAura,    setSessionAura]    = useState(STARTING_AURA);
  const [initialAura,    setInitialAura]    = useState(STARTING_AURA);
  const [streak,         setStreak]         = useState(0);

  const chatEndRef         = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const sessionInitialized = useRef(false);
  const MAX_MSGS           = 4;

  useEffect(() => { initSounds(); }, []);

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

  if (!scenario) {
    return (
      <div className="min-h-screen bg-[#f8f7fc] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-mono text-[#716a7e] text-sm mb-4">Scenario not found.</p>
          <button
            className="bg-[#5e548e] px-6 py-3 font-mono text-xs font-black uppercase tracking-widest text-white"
            onClick={() => router.push("/scenarios")}
            type="button"
          >
            Back to Field Manual
          </button>
        </div>
      </div>
    );
  }

  const accent     = DIFF_ACCENT[scenario.difficulty];
  const diffLabel  = SCENARIO_DIFF_LABEL[scenario.difficulty];
  const catLabel   = SCENARIO_CATEGORY_LABEL[scenario.category];
  const streakMult = getStreakMultiplier(streak);

  const startPractice = () => {
    if (sessionAura < scenario.approachCost) return;
    setSessionAura((prev) => prev - scenario.approachCost);
    setPhase("chat");
    sfx.moveSelect();
    void hapticTap();
  }

  const sendMessage = async () => {
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
      const res = await fetch("/api/life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "chat",
          scenarioId: scenario.id,
          difficulty: scenario.difficulty,
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) {
        setMessages([...newMessages, { role: "assistant", content: "...", score: 0 }]);
        if (newCount >= MAX_MSGS) setTimeout(() => setPhase("lock"), 600);
        return;
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const si = fullText.indexOf("[SCORE:");
        setMessages([...newMessages, { role: "assistant", content: (si >= 0 ? fullText.slice(0, si).trim() : fullText) + (si < 0 ? "▋" : ""), score: 0 }]);
      }
      const m     = fullText.match(/\[SCORE:\s*(-?\d+)\]/);
      const score = m ? Math.max(-10, Math.min(10, parseInt(m[1]))) : 0;
      const si    = fullText.indexOf("[SCORE:");
      const ft    = (si >= 0 ? fullText.slice(0, si).trim() : fullText.trim()) || "...";
      setMessages([...newMessages, { role: "assistant", content: ft, score }]);
      setTotalScore((s) => s + score);
      if (newCount >= MAX_MSGS) setTimeout(() => setPhase("lock"), 600);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "...", score: 0 }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const resolveRound = async (closer: ScenarioCloser) => {
    setSelectedCloser(closer);
    setPhase("resolve");
    setIsLoading(true);
    sfx.moveConfirm();
    const walletAddr = account?.address ? String(account.address) : null;
    try {
      const res = await fetch("/api/life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "resolve",
          scenarioId: scenario.id,
          difficulty: scenario.difficulty,
          messages: messages.map(({ role, content }) => ({ role, content })),
          closer, totalScore, streak, stats: charStats,
        }),
      });
      const data = await res.json() as { verdict: string; reaction: string; win: boolean; aura: number; winChance: number };
      const aura = data.aura ?? 0;
      const win  = data.win  ?? false;
      setVerdict(data.verdict ?? "...");
      setAuraEarned(aura);
      setLastWinChance(data.winChance ?? 0);
      setSessionAura((prev) => prev + aura);
      if (win) setStreak((s) => s + 1);
      else if (closer !== "sidestep") setStreak(0);
      if (walletAddr) localStorage.setItem(`poa_aura_${walletAddr}`, String(sessionAura + aura));
      if (win && aura > 50) { sfx.roundWin(); void hapticWin(); }
      else if (aura === 0 && closer !== "sidestep") { sfx.matchLoss(); void hapticLoss(); }
      else sfx.moveConfirm();
    } catch {
      setVerdict("I have to go.");
    } finally {
      setIsLoading(false);
    }
  }

  const tryAgain = () => {
    setPhase("lobby");
    setMessages([]); setDraft(""); setTotalScore(0); setMsgCount(0);
    setSelectedCloser(null); setVerdict(""); setAuraEarned(0);
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    const canAfford = sessionAura >= scenario.approachCost;
    return (
      <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e] flex flex-col">
        <Nav />

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/scenarios?archetype=${archetypeId}`)}
              className="mb-5 bg-[#5e548e] px-5 py-2 font-mono text-xs font-black uppercase tracking-widest text-white transition hover:opacity-80 touch-manipulation"
              type="button"
            >
              Back
            </button>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#716a7e]">
                  Field Manual · Real Life Training
                </p>
                <h1 className="mt-1 text-3xl font-black uppercase leading-tight sm:text-4xl lg:text-5xl">
                  {scenario.title}
                </h1>
                {streak >= 2 && (
                  <div className="mt-2 inline-flex items-center gap-2 border border-[#5e548e]/30 bg-[#5e548e]/5 px-3 py-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5e548e]">
                      {streak}× Streak · {streakMult}× Boost
                    </span>
                  </div>
                )}
              </div>

              <div className="shrink-0 border border-[#ddd6ea]/40 px-4 py-2.5 text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#716a7e]">AURA</p>
                <p className={`font-mono text-2xl font-black leading-none ${sessionAura >= initialAura ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                  {sessionAura}
                </p>
              </div>
            </div>
          </div>

          {/* ── Scenario card ───────────────────────────────────────────── */}
          <div className="relative border border-[#ddd6ea]/30 bg-white">
            {/* Accent strip */}
            <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: accent }} />

            <div className="p-5 sm:p-6">

              {/* Tags row */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span
                  className="border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ borderColor: accent + "55", color: accent }}
                >
                  {diffLabel}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#716a7e]">
                  {catLabel}
                </span>
              </div>

              {/* Situation briefing */}
              <div className="mb-6 border-l-2 border-[#5e548e]/30 pl-4">
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]">Situation</p>
                <p className="text-sm leading-7 text-[#231942]">{scenario.setup}</p>
              </div>

              {/* Tips & pitfalls */}
              <div className="mb-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.22em] text-[#5e548e]">What Works</p>
                  <ul className="space-y-2">
                    {scenario.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#5e548e]" />
                        <span className="font-mono text-xs leading-5 text-[#716a7e]">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.22em] text-[#716a7e]/60">Avoid</p>
                  <ul className="space-y-2">
                    {scenario.pitfalls.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 border border-[#ddd6ea]/40" />
                        <span className="font-mono text-xs leading-5 text-[#716a7e]">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Economy row */}
              <div className="grid grid-cols-3 gap-2 border-t border-[#ddd6ea]/20 pt-5">
                <div className="border border-[#ddd6ea]/25 px-3 py-3 text-center">
                  <p className="font-mono text-[8px] uppercase tracking-wide text-[#716a7e]">Entry</p>
                  <p className="mt-1 font-mono text-lg font-black text-[#716a7e]">−{scenario.approachCost}</p>
                </div>
                <div className="border px-3 py-3 text-center" style={{ borderColor: accent + "50" }}>
                  <p className="font-mono text-[8px] uppercase tracking-wide text-[#716a7e]">Own It</p>
                  <p className="mt-1 font-mono text-lg font-black" style={{ color: accent }}>
                    +{Math.round(scenario.ownItWin * streakMult)}
                    {streakMult > 1 && <span className="ml-1 text-[10px] text-[#716a7e]">×{streakMult}</span>}
                  </p>
                </div>
                <div className="border border-[#ddd6ea]/25 px-3 py-3 text-center">
                  <p className="font-mono text-[8px] uppercase tracking-wide text-[#716a7e]">Play It Cool</p>
                  <p className="mt-1 font-mono text-lg font-black text-[#231942]">
                    +{Math.round(scenario.coolWin * streakMult)}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              disabled={!canAfford}
              className="w-full border-t border-[#ddd6ea]/20 py-4 font-mono text-sm font-black uppercase tracking-widest transition touch-manipulation bg-[#5e548e] text-white hover:bg-white disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#716a7e] disabled:opacity-30"
              onClick={startPractice}
              type="button"
            >
              {canAfford
                ? `Start Practice — ${scenario.approachCost} AURA`
                : `Need ${scenario.approachCost} AURA`}
            </button>
          </div>

        </main>
      </div>
    );
  }

  // ── CHAT + LOCK ────────────────────────────────────────────────────────────
  if (phase === "chat" || phase === "lock") {
    const ownItChance = calcWinChance("flirt", totalScore, scenario.difficulty, charStats);
    const coolChance  = calcWinChance("flex",  totalScore, scenario.difficulty, charStats);

    return (
      <div className="flex h-svh flex-col bg-[#f8f7fc] text-[#5e548e]">
        <Nav />

        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3 gap-3"
          style={{ borderBottomColor: accent, borderBottomWidth: 2 }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black uppercase truncate" style={{ color: accent }}>{scenario.title}</p>
              <span
                className="shrink-0 border font-mono text-[8px] uppercase px-1.5 py-0.5"
                style={{ borderColor: accent, color: accent }}
              >
                {diffLabel}
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase text-[#716a7e]">{catLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden w-24 sm:block">
              <HandlingBar score={totalScore} />
            </div>
            <div className="border border-[#ddd6ea]/50 px-3 py-1.5 text-center">
              <p className="font-mono text-[8px] uppercase text-[#716a7e]">Msgs</p>
              <p className="font-mono text-sm font-black">{msgCount}/{MAX_MSGS}</p>
            </div>
            <div className="border border-[#ddd6ea]/50 px-3 py-1.5 text-center">
              <p className="font-mono text-[8px] uppercase text-[#716a7e]">AURA</p>
              <p className={`font-mono text-sm font-black ${sessionAura >= initialAura ? "text-[#5e548e]" : "text-[#716a7e]"}`}>
                {sessionAura}
              </p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="py-10 text-center space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">She's waiting.</p>
              <p className="text-sm italic text-[#716a7e] max-w-sm mx-auto leading-6">"{scenario.setup}"</p>
              <p className="font-mono text-[9px] text-[#170b2e] uppercase">
                4 messages · Own It +{Math.round(scenario.ownItWin * streakMult)} · Play It Cool +{Math.round(scenario.coolWin * streakMult)}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[9px] font-black"
                  style={{ borderColor: accent, color: accent }}
                >
                  HER
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

          {phase === "chat" && !isLoading && (() => {
            const tip = getCoachTip(scenario, messages);
            return tip ? <div className="flex justify-start pl-9"><CoachHint tip={tip} /></div> : null;
          })()}
          <div ref={chatEndRef} />
        </div>

        {/* Input / closers */}
        {phase === "chat" ? (
          <form className="border-t border-[#ddd6ea]/50 flex" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <input
              ref={inputRef}
              autoFocus
              className="flex-1 bg-transparent px-4 py-3.5 font-mono text-sm text-[#5e548e] placeholder-[#716a7e] outline-none"
              disabled={isLoading || msgCount >= MAX_MSGS}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={msgCount >= MAX_MSGS ? "Choose how you handle it" : "Type your response…"}
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
              How do you close it?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="border-2 border-[#5e548e] bg-[#5e548e]/5 px-2 py-4 text-center transition hover:bg-[#5e548e] hover:text-white touch-manipulation group"
                onClick={() => resolveRound("own-it")} type="button"
              >
                <p className="font-mono text-[7px] uppercase tracking-widest text-[#716a7e] group-hover:text-[#231942]">Own It</p>
                <p className="mt-1 font-mono text-lg font-black text-[#5e548e] group-hover:text-[#231942]">+{Math.round(scenario.ownItWin * streakMult)}</p>
                <p className="mt-0.5 font-mono text-[10px] font-black text-[#5e548e] group-hover:text-[#231942]">{ownItChance}% WIN</p>
              </button>
              <button
                className="border-2 border-[#5e548e] bg-[#5e548e]/5 px-2 py-4 text-center transition hover:bg-[#5e548e]/20 touch-manipulation"
                onClick={() => resolveRound("play-it-cool")} type="button"
              >
                <p className="font-mono text-[7px] uppercase tracking-widest text-[#716a7e]">Play It Cool</p>
                <p className="mt-1 font-mono text-lg font-black text-[#5e548e]">+{Math.round(scenario.coolWin * streakMult)}</p>
                <p className="mt-0.5 font-mono text-[10px] font-black text-[#5e548e]">{coolChance}% WIN</p>
              </button>
              <button
                className="border-2 border-[#ddd6ea]/40 bg-[#716a7e]/5 px-2 py-4 text-center transition hover:bg-[#716a7e]/15 touch-manipulation"
                onClick={() => resolveRound("sidestep")} type="button"
              >
                <p className="font-mono text-[7px] uppercase tracking-widest text-[#716a7e]">Sidestep</p>
                <p className="mt-1 font-mono text-lg font-black text-[#716a7e]">+{Math.round(scenario.approachCost * 0.5)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-[#716a7e]">Safe exit</p>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RESOLVE ───────────────────────────────────────────────────────────────
  if (phase === "resolve") {
    const isSidestep = selectedCloser === "sidestep";
    const isMiss     = !isSidestep && auraEarned === 0;
    const isWin      = auraEarned > 0 && !isSidestep;

    if (isMiss) {
      return (
        <div className="relative flex h-svh flex-col overflow-hidden bg-[#f8f7fc]">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7fc] via-[#f8f7fc]/80 to-[#f8f7fc]/40" />
          <div className="relative z-10 flex h-full flex-col">
            <Nav />
            <div className="flex flex-1 flex-col items-center justify-end px-6 pb-12 text-center sm:justify-center sm:pb-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#716a7e]">{scenario.title}</p>
              <h1 className="mt-2 font-black uppercase leading-[0.82] tracking-tight text-[#231942]" style={{ fontSize: "clamp(3rem, 12vw, 7rem)" }}>
                She<br />Closed.
              </h1>
              {isLoading ? (
                <p className="mt-6 font-mono text-sm text-[#716a7e] animate-pulse">Waiting…</p>
              ) : (
                <div className="mt-6 max-w-md border-l-2 border-[#ddd6ea]/60 pl-4 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]/70">She said:</p>
                  <p className="mt-1 text-base leading-7 font-semibold text-[#231942]">&ldquo;{verdict || "..."}&rdquo;</p>
                </div>
              )}
              {!isLoading && (
                <div className="mt-6 flex flex-wrap justify-center gap-5 font-mono text-xs text-[#716a7e]">
                  <span>Odds: <span className="text-[#231942]">{lastWinChance}%</span></span>
                  <span>Score: <span className="text-[#231942]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
                  <span>AURA: <span className="text-[#716a7e]">+0</span></span>
                </div>
              )}
              {!isLoading && (
                <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
                  <button className="w-full border-2 border-white bg-white py-4 font-black uppercase tracking-widest text-[#f8f7fc] transition hover:bg-transparent hover:text-[#231942] touch-manipulation" onClick={tryAgain} type="button">
                    Try Again
                  </button>
                  <button className="w-full border border-[#ddd6ea]/50 py-3 font-mono text-xs font-black uppercase tracking-widest text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e] touch-manipulation" onClick={() => router.push(`/scenarios?archetype=${archetypeId}`)} type="button">
                    Back to Field Manual
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-svh flex-col bg-[#f8f7fc] text-[#5e548e]">
        <Nav />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <div className="mb-6">
            <span className="inline-block border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ borderColor: accent + "60", color: accent }}>
              {scenario.title}
            </span>
          </div>

          <div className={`w-full max-w-lg border-2 p-6 shadow-[8px_8px_0_#f3f0fa] mb-6 ${isWin ? "border-[#5e548e] bg-[#5e548e]/5" : "border-[#ddd6ea]"}`}>
            {isLoading ? (
              <p className="font-mono text-sm text-[#716a7e] animate-pulse">Waiting for her reaction…</p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">She says:</p>
                <p className="text-lg font-bold leading-7 text-[#5e548e]">"{verdict || "..."}"</p>
              </>
            )}
          </div>

          {!isLoading && (
            <div className="mb-6">
              {isSidestep && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#716a7e]">Sidestepped</p>}
              {isWin      && <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5e548e]">Handled — {lastWinChance}% odds</p>}
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
            <div className="mb-6 flex flex-wrap justify-center gap-4 font-mono text-xs text-[#716a7e]">
              <span>Move: <span className="uppercase text-[#5e548e]">{selectedCloser}</span></span>
              <span>Score: <span className="text-[#5e548e]">{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
              {!isSidestep && <span>Odds: <span className="text-[#5e548e]">{lastWinChance}%</span></span>}
              {streak > 1  && <span>Streak: <span className="text-[#5e548e]">{streak}×</span></span>}
            </div>
          )}

          {!isLoading && (
            <div className="flex w-full max-w-lg flex-col gap-3">
              <button className="w-full border-2 border-[#5e548e] bg-[#5e548e] py-4 font-black uppercase tracking-widest text-white shadow-[6px_6px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation" onClick={tryAgain} type="button">
                Practice Again
              </button>
              <button className="w-full border border-[#ddd6ea]/50 py-3 font-mono text-xs font-black uppercase tracking-widest text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e] touch-manipulation" onClick={() => router.push(`/scenarios?archetype=${archetypeId}`)} type="button">
                Back to Field Manual
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default function LifePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f7fc]" />}>
      <LifeContent />
    </Suspense>
  );
}
