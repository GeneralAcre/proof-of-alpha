"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { fetchOpenRooms, type GameRoomState, PHASE } from "../lib/solana-client";

const MODIFIER_NAMES = ["Standard", "Greed Mode", "Chaos Mode", "Scarcity", "Final Stand"];
const PHASE_LABELS: Record<number, string> = {
  [PHASE.LOBBY]:   "Waiting",
  [PHASE.COMMIT]:  "In Round",
  [PHASE.REVEAL]:  "Revealing",
  [PHASE.RESOLVE]: "Resolving",
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `POA-${s}`;
}

function ModeSelectContent() {
  const params = useSearchParams();
  const initialType = params.get("type") === "solo" ? "solo" : "multiplayer";

  const [mode, setMode] = useState<"solo" | "multiplayer">(initialType);
  const [privateCode, setPrivateCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [liveRooms, setLiveRooms] = useState<GameRoomState[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (mode !== "multiplayer") return;
    setRoomsLoading(true);
    fetchOpenRooms()
      .then(setLiveRooms)
      .finally(() => setRoomsLoading(false));
  }, [mode]);

  function handleCreateRoom() {
    setPrivateCode(generateCode());
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinInput.trim()) return;
    if (joinInput.trim().length < 5) {
      setJoinError("Invalid room code.");
      return;
    }
    window.location.href = `/character-select?mode=multiplayer&room=${joinInput.trim().toUpperCase()}`;
  }

  const playHref =
    mode === "solo"
      ? "/character-select?mode=solo"
      : "/character-select?mode=multiplayer";

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Step 1 of 3
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase sm:text-5xl">Select Mode</h1>

        {/* ── MODE TOGGLE ── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {(["solo", "multiplayer"] as const).map((m) => {
            const selected = mode === m;
            const isSolo = m === "solo";
            return (
              <button
                key={m}
                className={`border-2 p-6 text-left transition ${
                  selected
                    ? "border-[#EEF083] bg-[#EEF083] text-[#241F19] shadow-[6px_6px_0_#91897C]"
                    : "border-[#91897C] bg-[#2f2922] text-[#EEF083] hover:border-[#EEF083]"
                }`}
                onClick={() => setMode(m)}
                type="button"
              >
                <p className="text-2xl font-black uppercase">{m}</p>
                <p
                  className={`mt-1 font-mono text-xs uppercase tracking-[0.14em] ${
                    selected ? "text-[#241F19]/70" : "text-[#91897C]"
                  }`}
                >
                  {isSolo ? "0.5x Points" : "Full Points"}
                </p>
                <ul
                  className={`mt-4 space-y-1.5 text-sm ${
                    selected ? "text-[#241F19]" : "text-[#d8d4a1]"
                  }`}
                >
                  {isSolo
                    ? [
                        "Instant matchmaking, no wait",
                        "You vs 4 AI opponents",
                        "0.5x Sigma Points reward",
                        "Good for practice",
                      ].map((t) => <li key={t} className="flex gap-2"><span className="shrink-0">—</span>{t}</li>)
                    : [
                        "Up to 5 human players",
                        "AI fills any empty slots",
                        "Full 1x Sigma Points",
                        "Ranked and recorded on-chain",
                      ].map((t) => <li key={t} className="flex gap-2"><span className="shrink-0">—</span>{t}</li>)}
                </ul>
              </button>
            );
          })}
        </div>

        {/* ── PRIMARY CTA ── */}
        <Link
          className="mb-10 block border-2 border-[#EEF083] bg-[#EEF083] px-6 py-4 text-center text-lg font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
          href={playHref}
        >
          {mode === "solo" ? "Play Solo Now" : "Find a Multiplayer Match"}
        </Link>

        {/* ── PRIVATE ROOM (multiplayer only) ── */}
        {mode === "multiplayer" && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">

            {/* Create private room */}
            <div className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Create Private Room
              </p>
              {privateCode ? (
                <>
                  <p className="mb-2 text-sm text-[#d8d4a1]">Share this code with friends:</p>
                  <p className="mb-4 border border-[#EEF083] bg-[#EEF083]/10 px-4 py-3 font-mono text-xl font-black text-[#EEF083] tracking-widest">
                    {privateCode}
                  </p>
                  <Link
                    className="block border border-[#EEF083] bg-[#EEF083] px-4 py-3 text-center text-sm font-black uppercase text-[#241F19] transition hover:bg-[#f5f6a5]"
                    href={`/character-select?mode=multiplayer&room=${privateCode}&type=private`}
                  >
                    Enter Room
                  </Link>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm leading-6 text-[#d8d4a1]">
                    Generate a code and share it with up to 5 friends. AI fills remaining slots.
                  </p>
                  <button
                    className="w-full border border-[#EEF083] bg-[#EEF083] px-4 py-3 text-sm font-black uppercase text-[#241F19] transition hover:bg-[#f5f6a5]"
                    onClick={handleCreateRoom}
                    type="button"
                  >
                    Generate Room Code
                  </button>
                </>
              )}
            </div>

            {/* Join by code */}
            <div className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Join by Code
              </p>
              <p className="mb-4 text-sm leading-6 text-[#d8d4a1]">
                Enter a room code shared by a friend.
              </p>
              <form onSubmit={handleJoin} className="grid gap-2">
                <input
                  className="border border-[#91897C] bg-[#241F19] px-4 py-3 font-mono text-sm uppercase tracking-widest text-[#EEF083] placeholder-[#91897C] outline-none focus:border-[#EEF083]"
                  maxLength={12}
                  onChange={(e) => { setJoinInput(e.target.value); setJoinError(""); }}
                  placeholder="POA-XXXX"
                  type="text"
                  value={joinInput}
                />
                {joinError && (
                  <p className="font-mono text-xs text-[#ffb1a1]">{joinError}</p>
                )}
                <button
                  className="border border-[#91897C] px-4 py-3 text-sm font-black uppercase text-[#EEF083] transition hover:bg-[#EEF083] hover:text-[#241F19]"
                  type="submit"
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── BROWSE PUBLIC ROOMS ── */}
        {mode === "multiplayer" && (
          <div className="border border-[#91897C] bg-[#2f2922] shadow-[6px_6px_0_#91897C]">
            <div className="flex items-center justify-between border-b border-[#91897C] px-5 py-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Active Games On-chain
              </p>
              <span className="live-dot inline-block h-1.5 w-1.5 bg-[#EEF083]" />
            </div>
            {roomsLoading ? (
              <div className="px-5 py-8 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C] animate-pulse">
                  Querying chain…
                </p>
              </div>
            ) : liveRooms.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No active games found</p>
                <p className="mt-1 text-sm text-[#d8d4a1]">Create a room above to be the first.</p>
              </div>
            ) : (
              liveRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[#91897C] px-5 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-black text-[#EEF083]">{room.roomCode}</span>
                    <span className="font-mono text-xs text-[#91897C]">
                      Round {room.round} · {room.playerCount}/6 players
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="border border-[#91897C] px-2 py-0.5 font-mono text-xs uppercase text-[#91897C]">
                      {MODIFIER_NAMES[room.modifier] ?? "Standard"}
                    </span>
                    <span className="font-mono text-xs text-[#91897C]">
                      {PHASE_LABELS[room.phase] ?? "Active"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ModeSelectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <ModeSelectContent />
    </Suspense>
  );
}
