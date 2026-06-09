"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES } from "../lib/archetypes";
import { getUnlocked } from "../lib/unlocks";
import { useWallet } from "../components/WalletProvider";

const MODIFIERS = ["Standard", "Greed Mode", "Chaos Mode", "Scarcity", "Final Stand"];
const MODIFIER_DESC: Record<string, string> = {
  "Standard":    "Normal rules apply.",
  "Greed Mode":  "All successful bets are doubled this round.",
  "Chaos Mode":  "Targets are shuffled randomly mid-round.",
  "Scarcity":    "Max bet capped at 25 $TEST for all players.",
  "Final Stand": "Eliminated players can make one final bet.",
};

type PlayerResult = { id: string; addr: string; arch: string; initials: string; balance: number; roundWins: number; delta: number; alive: boolean };
type ChatMsg = { from: string; text: string };

const FALLBACK_RESULTS: PlayerResult[] = [];

function loadResults(): PlayerResult[] {
  try {
    const saved = sessionStorage.getItem("poa_game_state");
    if (saved) {
      const state = JSON.parse(saved) as { players: PlayerResult[] };
      return state.players;
    }
  } catch {}
  return FALLBACK_RESULTS;
}

function LockerRoomContent() {
  const params   = useSearchParams();
  const { account } = useWallet();
  const round    = Number(params.get("round") ?? 1);
  const archetypeId = params.get("archetype") ?? "sigma";
  const mode     = params.get("mode") ?? "multiplayer";

  const nextModifier = MODIFIERS[(round) % MODIFIERS.length];
  const nextModifierDesc = MODIFIER_DESC[nextModifier];

  const results = loadResults();

  const [switchTimer, setSwitchTimer] = useState(30);
  const [selectedArch, setSelectedArch] = useState(archetypeId);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "System", text: "Round ended. 30 seconds to switch archetype." },
  ]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (switchTimer <= 0) return;
    const id = setTimeout(() => setSwitchTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [switchTimer]);

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((m) => [...m, { from: "You", text: draft.trim() }]);
    setDraft("");
  }

  const roundWinner = results.length > 0
    ? results.reduce((best, p) => p.roundWins > best.roundWins ? p : best)
    : null;
  const mvp = results.filter((p) => p.alive).length > 0
    ? results.filter((p) => p.alive).reduce((best, p) => p.delta > best.delta ? p : best)
    : null;

  const walletAddr = account ? String(account.address) : null;
  const UNLOCKED = getUnlocked(walletAddr);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── ROUND RESULT HEADER ── */}
        <div className="mb-6 border border-[#EEF083] bg-[#EEF083]/5 p-5 shadow-[6px_6px_0_#91897C]">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Round {round} Complete
          </p>
          <p className="mt-1 text-3xl font-black uppercase text-[#EEF083]">
            {roundWinner
              ? roundWinner.id === "you" ? "You Won This Round" : `${roundWinner.addr} Won the Round`
              : "Round Complete"}
          </p>
          <p className="mt-1 text-sm text-[#d8d4a1]">
            Biggest steal this round. Head start bonus applied.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">

            {/* ── FULL SCOREBOARD ── */}
            <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                  Scoreboard
                </p>
              </div>
              {[...results].sort((a, b) => b.balance - a.balance).map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#91897C] px-5 py-3.5 last:border-b-0 ${
                    p.id === "you" ? "bg-[#EEF083]/5" : ""
                  } ${!p.alive ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-[#91897C] font-mono text-xs font-black text-[#EEF083]">
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#EEF083]">
                        {p.id === "you" ? "You" : p.addr}
                        {!p.alive && <span className="ml-2 font-mono text-xs font-normal text-[#91897C]">eliminated</span>}
                      </p>
                      <p className="font-mono text-xs text-[#91897C]">{p.arch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className={`h-2 w-2 border ${i < p.roundWins ? "border-[#EEF083] bg-[#EEF083]" : "border-[#91897C]"}`} />
                      ))}
                    </div>
                    <span className={`font-mono text-sm font-black ${p.delta > 0 ? "text-[#EEF083]" : "text-[#ffb1a1]"}`}>
                      {p.delta > 0 ? "+" : ""}{p.delta} $T
                    </span>
                    <span className="font-mono text-sm font-black text-[#EEF083]">
                      {p.balance} $TEST
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* ── MVP ── */}
            {mvp && (
              <section className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
                <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                  MVP of the Round
                </p>
                <p className="text-2xl font-black uppercase text-[#EEF083]">
                  {mvp.id === "you" ? "You" : mvp.addr}
                </p>
                <p className="mt-0.5 font-mono text-xs text-[#91897C]">
                  {mvp.arch} · +{mvp.delta} $TEST gained
                </p>
              </section>
            )}

            {/* ── NEXT ROUND MODIFIER ── */}
            <section className="border border-[#EEF083] bg-[#EEF083]/5 p-5 shadow-[6px_6px_0_#91897C]">
              <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Next Round Modifier
              </p>
              <p className="text-3xl font-black uppercase text-[#EEF083]">{nextModifier}</p>
              <p className="mt-2 text-sm leading-6 text-[#d8d4a1]">{nextModifierDesc}</p>
            </section>

            {/* ── SWITCH ARCHETYPE ── */}
            <section className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                  Switch Archetype
                </p>
                <span className={`font-mono text-lg font-black ${switchTimer <= 5 ? "timer-warn" : "text-[#EEF083]"}`}>
                  {String(switchTimer).padStart(2, "0")}s
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ARCHETYPES.map((a) => {
                  const unlocked = UNLOCKED.has(a.id);
                  const isSelected = selectedArch === a.id;
                  return (
                    <button
                      key={a.id}
                      className={`border p-2 text-left transition ${
                        !unlocked
                          ? "cursor-not-allowed border-[#91897C]/30 opacity-30"
                          : isSelected
                          ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                          : "border-[#91897C] text-[#EEF083] hover:border-[#EEF083]"
                      }`}
                      disabled={!unlocked || switchTimer === 0}
                      onClick={() => setSelectedArch(a.id)}
                      type="button"
                    >
                      <p className="font-mono text-xs font-black uppercase">{a.initials}</p>
                      <p className="mt-0.5 text-[10px] leading-tight">{a.name}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── CONTINUE ── */}
            <Link
              className="block border-2 border-[#EEF083] bg-[#EEF083] px-6 py-4 text-center text-lg font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
              href={`/game?mode=${mode}&archetype=${selectedArch}&round=${round + 1}`}
            >
              Enter Round {round + 1}
            </Link>
          </div>

          {/* ── CHAT ── */}
          <div className="flex flex-col border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
            <div className="border-b border-[#91897C] px-4 py-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Chat
              </p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4 min-h-50 max-h-90">
              {messages.map((m, i) => (
                <p key={i} className="text-sm">
                  <span className={`font-mono font-black ${m.from === "System" ? "text-[#91897C]" : "text-[#EEF083]"}`}>
                    {m.from !== "System" && `${m.from}: `}
                  </span>
                  <span className={m.from === "System" ? "italic text-[#91897C]" : "text-[#d8d4a1]"}>
                    {m.text}
                  </span>
                </p>
              ))}
            </div>
            <form className="flex border-t border-[#91897C]" onSubmit={sendChat}>
              <input
                className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-[#EEF083] placeholder-[#91897C] outline-none"
                maxLength={120}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="GG..."
                type="text"
                value={draft}
              />
              <button
                className="border-l border-[#91897C] px-4 font-mono text-xs font-black uppercase text-[#91897C] transition hover:bg-[#EEF083] hover:text-[#241F19]"
                type="submit"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LockerRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <LockerRoomContent />
    </Suspense>
  );
}
