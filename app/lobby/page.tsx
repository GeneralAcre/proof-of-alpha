"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank } from "../lib/archetypes";

const ROUND_MODIFIERS = ["Standard", "Greed Mode", "Chaos Mode", "Scarcity", "Final Stand"];

const BOTS = [
  { addr: "Bot_7xKm", archetype: "NPC",      rank: "Beta"  },
  { addr: "Bot_B2Qs", archetype: "Doomer",   rank: "NPC"   },
  { addr: "Bot_Vn4L", archetype: "Wojak",    rank: "Alpha" },
  { addr: "Bot_P8Hj", archetype: "Sigma",    rank: "Beta"  },
  { addr: "Bot_F3Dz", archetype: "Gigachad", rank: "Sigma" },
];

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `POA-${s}`;
}

type ChatMsg = { from: string; text: string; ts: number };

function LobbyContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { account, truncatedAddress } = useWallet();

  const mode        = params.get("mode") ?? "multiplayer";
  const archetypeId = params.get("archetype") ?? "npc";
  const roomParam   = params.get("room");
  const archetype   = ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];
  const myRank      = getCurrentRank(420);
  const isSolo      = mode === "solo";

  const [roomCode]                    = useState(() => roomParam ?? generateRoomCode());
  const [timeLeft, setTimeLeft]       = useState(60);
  const [isReady, setIsReady]         = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "System", text: "Lobby opened. Waiting for players...", ts: Date.now() },
  ]);
  const [draft, setDraft] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const modifier = ROUND_MODIFIERS[Math.floor(roomCode.charCodeAt(4) % ROUND_MODIFIERS.length)];

  useEffect(() => {
    if (isSolo || timeLeft <= 0 || isReady) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [isSolo, timeLeft, isReady]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { from: truncatedAddress ?? "You", text: draft.trim(), ts: Date.now() },
    ]);
    setDraft("");
  }

  const slots = [
    {
      filled: true,
      isHuman: true,
      addr: truncatedAddress ?? "You",
      archetype: archetype.name,
      rank: myRank.name,
    },
    ...BOTS.slice(0, 5).map((b) => ({
      filled: true,
      isHuman: false,
      addr: b.addr,
      archetype: b.archetype,
      rank: b.rank,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── HEADER: room code + timer ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-[#a09ab8] bg-[#2d1a4a] px-5 py-4 shadow-[6px_6px_0_#a09ab8]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">
              Room Code — share to invite
            </p>
            <p className="mt-1 font-mono text-3xl font-black tracking-widest text-[#E4D474]">
              {roomCode}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[#a09ab8]">
              {mode === "solo" ? "Solo · 0.5x points" : "Multiplayer · Full points"}
            </p>
          </div>
          {!isSolo && (
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">
                Starts in
              </p>
              <p
                className={`mt-1 font-mono text-5xl font-black ${
                  timeLeft <= 10 ? "timer-warn" : "text-[#E4D474]"
                }`}
              >
                {String(timeLeft).padStart(2, "0")}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">

            {/* ── PLAYER SLOTS ── */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
              <div className="border-b border-[#a09ab8] px-5 py-3">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
                  Players — {slots.length}/6
                </p>
              </div>
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 border-b border-[#a09ab8] px-5 py-3.5 last:border-b-0 ${
                    slot.isHuman ? "bg-[#E4D474]/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-mono text-xs text-[#a09ab8]">
                      {i + 1}
                    </span>
                    <div>
                      <p className={`font-mono text-sm font-black ${slot.isHuman ? "text-[#E4D474]" : "text-[#ffffff]"}`}>
                        {slot.addr}
                        {slot.isHuman && (
                          <span className="ml-2 font-mono text-xs font-normal text-[#a09ab8]">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-xs text-[#a09ab8]">{slot.archetype}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="border border-[#a09ab8] px-2 py-0.5 font-mono text-xs uppercase text-[#a09ab8]">
                      {slot.rank}
                    </span>
                    {!slot.isHuman && (
                      <span className="font-mono text-xs text-[#a09ab8]">AI</span>
                    )}
                  </div>
                </div>
              ))}
            </section>

            {/* ── ROUND 1 MODIFIER ── */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] p-5 shadow-[4px_4px_0_#a09ab8]">
              <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
                Round 1 Modifier
              </p>
              <p className="text-2xl font-black uppercase text-[#E4D474]">{modifier}</p>
              <p className="mt-1 text-sm text-[#ffffff]">
                {modifier === "Standard"    && "Normal rules. No adjustments."}
                {modifier === "Greed Mode"  && "All bets are doubled this round."}
                {modifier === "Chaos Mode"  && "Targets are randomized mid-round."}
                {modifier === "Scarcity"    && "Max bet capped at 25 $TEST."}
                {modifier === "Final Stand" && "Eliminated players can make one last bet."}
              </p>
            </section>

            {/* ── ACTION BUTTONS ── */}
            <div className="flex flex-wrap gap-3">
              {isSolo ? (
                <button
                  className="flex-1 border-2 border-[#E4D474] bg-[#E4D474] px-6 py-4 text-lg font-black uppercase text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
                  onClick={() => router.push(`/game?mode=${mode}&archetype=${archetypeId}&round=1&room=${roomCode}`)}
                  type="button"
                >
                  Start Game
                </button>
              ) : (
                <button
                  className={`flex-1 border-2 px-6 py-4 font-black uppercase text-lg transition ${
                    isReady
                      ? "cursor-default border-[#a09ab8] bg-[#24153E] text-[#a09ab8]"
                      : "border-[#E4D474] bg-[#E4D474] text-[#24153E] shadow-[4px_4px_0_#a09ab8] hover:bg-transparent hover:text-[#E4D474]"
                  }`}
                  disabled={isReady}
                  onClick={() => setIsReady(true)}
                  type="button"
                >
                  {isReady ? "Ready — waiting for others" : "Ready"}
                </button>
              )}
              <Link
                className="border-2 border-[#a09ab8] px-6 py-4 font-black uppercase text-[#a09ab8] transition hover:border-[#ffb1a1] hover:text-[#ffb1a1]"
                href="/mode-select"
              >
                Leave
              </Link>
            </div>
          </div>

          {/* ── CHAT BOX ── */}
          <section className="flex flex-col border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
            <div className="border-b border-[#a09ab8] px-4 py-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
                Lobby Chat
              </p>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[240px] max-h-[320px]"
              ref={chatRef}
            >
              {messages.map((msg) => (
                <div key={msg.ts} className="text-sm">
                  <span
                    className={`font-mono font-black ${
                      msg.from === "System" ? "text-[#a09ab8]" : "text-[#E4D474]"
                    }`}
                  >
                    {msg.from === "System" ? "" : `${msg.from}: `}
                  </span>
                  <span
                    className={msg.from === "System" ? "text-[#a09ab8] italic" : "text-[#ffffff]"}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <form
              className="border-t border-[#a09ab8] flex"
              onSubmit={sendMessage}
            >
              <input
                className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-[#E4D474] placeholder-[#a09ab8] outline-none"
                maxLength={120}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Say something..."
                type="text"
                value={draft}
              />
              <button
                className="border-l border-[#a09ab8] px-4 font-mono text-xs font-black uppercase text-[#a09ab8] transition hover:bg-[#E4D474] hover:text-[#24153E]"
                type="submit"
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#24153E]" />}>
      <LobbyContent />
    </Suspense>
  );
}
