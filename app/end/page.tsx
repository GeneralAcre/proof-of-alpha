"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";
import { sfx, initSounds } from "../lib/sounds";

function buildBreakdown(won: boolean, elims: number, mode: string) {
  const rows: { reason: string; points: number }[] = [];
  if (won) rows.push({ reason: "Match win", points: 50 });
  else     rows.push({ reason: "Match loss", points: -12 });
  if (elims > 0) rows.push({ reason: `${elims} elimination${elims !== 1 ? "s" : ""}`, points: elims * 8 });
  if (won) rows.push({ reason: "Survival bonus", points: 10 });
  if (mode === "solo") rows.push({ reason: "Solo mode penalty", points: -5 });
  return rows;
}

export type MatchRecord = {
  ts: number;         // unix ms
  won: boolean;
  archetype: string;
  elims: number;
  earned: number;
  mode: string;
};

function matchKey(address: string | null | undefined) {
  return address ? `poa_matches_${address}` : "poa_matches_anonymous";
}
function saveMatchRecord(address: string | null | undefined, record: MatchRecord) {
  try {
    const raw = localStorage.getItem(matchKey(address));
    const prev: MatchRecord[] = raw ? JSON.parse(raw) : [];
    prev.unshift(record);          // newest first
    localStorage.setItem(matchKey(address), JSON.stringify(prev.slice(0, 50)));
  } catch {}
}

function auraKey(address: string | null | undefined) {
  return address ? `poa_aura_${address}` : "poa_aura_anonymous";
}
function readPrevAura(address: string | null | undefined): number {
  try { return Number(localStorage.getItem(auraKey(address)) ?? "0") || 0; } catch { return 0; }
}
function saveAura(address: string | null | undefined, next: number) {
  try { localStorage.setItem(auraKey(address), String(next)); } catch {}
}

function EndContent() {
  const params      = useSearchParams();
  const { truncatedAddress, account } = useWallet();
  const walletAddr  = account ? String(account.address) : null;

  const archetypeId = params.get("archetype") ?? "npc";
  const won         = (params.get("won") ?? "false") === "true";
  const elims       = Number(params.get("elims") ?? "0");
  const mode        = params.get("mode") ?? "multiplayer";
  const archetype   = ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];

  const breakdown   = buildBreakdown(won, elims, mode);
  const totalEarned = breakdown.reduce((s, r) => s + r.points, 0);

  const [prevAura, setPrevAura] = useState(0);
  const [showRankUp, setShowRankUp] = useState(false);

  useEffect(() => { initSounds(); }, []);

  useEffect(() => {
    const prev = readPrevAura(walletAddr);
    setPrevAura(prev);
    saveAura(walletAddr, Math.max(0, prev + totalEarned));
    saveMatchRecord(walletAddr, {
      ts: Date.now(), won, archetype: archetypeId, elims, earned: totalEarned, mode,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalEarned]);

  const newAura   = Math.max(0, prevAura + totalEarned);
  const prevRank  = getCurrentRank(prevAura);
  const newRank   = getCurrentRank(newAura);
  const rankedUp  = newRank.name !== prevRank.name;
  const progress  = getRankProgress(newAura);

  useEffect(() => {
    if (rankedUp) {
      const id = setTimeout(() => { setShowRankUp(true); sfx.rankUp(); }, 1200);
      return () => clearTimeout(id);
    }
  }, [rankedUp]);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">

        {/* ── WINNER BANNER ── */}
        <section className={`mb-8 border-2 p-8 text-center shadow-[8px_8px_0_#91897C] ${won ? "border-[#EEF083] bg-[#EEF083]/5" : "border-[#91897C]"}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-[#EEF083] bg-[#EEF083]/10 font-mono text-3xl font-black text-[#EEF083]">
            {archetype.initials}
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
            {won ? "Match Winner" : "Match Result"}
          </p>
          <h1 className="mt-2 text-[clamp(2rem,8vw,5rem)] font-black uppercase leading-tight">
            {won ? "Proof of Alpha Achieved" : "It's Joever"}
          </h1>
          <p className="mt-2 font-mono text-sm text-[#91897C]">
            {truncatedAddress ?? "You"} · {archetype.name}
          </p>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">

          {/* ── SIGMA POINTS BREAKDOWN ── */}
          <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
            <div className="border-b border-[#91897C] px-5 py-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                AURA Earned
              </p>
            </div>
            {breakdown.map(({ reason, points }) => (
              <div
                key={reason}
                className="flex items-center justify-between border-b border-[#91897C] px-5 py-3 last:border-b-0"
              >
                <span className="text-sm text-[#d8d4a1]">{reason}</span>
                <span className={`font-mono text-sm font-black ${points >= 0 ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                  {points >= 0 ? "+" : ""}{points} AURA
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-[#EEF083] px-5 py-3">
              <span className="font-black uppercase text-[#EEF083]">Total</span>
              <span className={`font-mono text-lg font-black ${totalEarned >= 0 ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                {totalEarned >= 0 ? "+" : ""}{totalEarned} AURA
              </span>
            </div>
          </section>

          {/* ── RANK ── */}
          <section className="space-y-4">
            <div className={`border p-5 shadow-[4px_4px_0_#91897C] ${showRankUp ? "rank-flash border-[#EEF083]" : "border-[#91897C] bg-[#2f2922]"}`}>
              <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Rank {rankedUp && showRankUp ? "— NEW RANK!" : ""}
              </p>
              {rankedUp && showRankUp ? (
                <div className="py-2 text-center">
                  <p className="font-mono text-xs text-[#91897C]">{prevRank.name}</p>
                  <p className="text-4xl font-black uppercase text-[#EEF083]">{newRank.name}</p>
                </div>
              ) : (
                <p className="text-3xl font-black uppercase">{newRank.name}</p>
              )}
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between font-mono text-xs text-[#91897C]">
                  <span>{newAura.toLocaleString()} AURA</span>
                  {getNextRank(newAura) && (
                    <span>to {getNextRank(newAura)?.name}</span>
                  )}
                </div>
                <div className="h-2 w-full border border-[#91897C] bg-[#241F19]">
                  <div
                    className="h-full bg-[#EEF083] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {newAura >= 2500 && (
              <div className="border border-[#EEF083] bg-[#EEF083]/5 p-5 shadow-[4px_4px_0_#91897C]">
                <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                  Achievement Unlocked
                </p>
                <p className="text-xl font-black uppercase text-[#EEF083]">Gigachad NFT</p>
                <p className="mt-1 text-sm text-[#d8d4a1]">2,500 AURA threshold reached.</p>
                <button
                  className="mt-3 w-full border border-[#EEF083] bg-[#EEF083] py-3.5 font-black uppercase text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
                  type="button"
                >
                  Mint Gigachad NFT
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ── ACTIONS ── */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            className="flex-1 border-2 border-[#EEF083] bg-[#EEF083] px-6 py-4 text-center font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
            href="/map"
          >
            Play Again
          </Link>
          <button
            className="flex-1 border-2 border-[#91897C] px-6 py-4 font-black uppercase text-[#EEF083] transition hover:border-[#EEF083] touch-manipulation"
            onClick={() => {
              const text = `Just ${won ? "won" : "played"} a match as ${archetype.name} on Proof of Alpha! ${totalEarned >= 0 ? "+" : ""}${totalEarned} AURA earned. The only fully on-chain meme battle game.`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
            }}
            type="button"
          >
            Share on X
          </button>
          <Link
            className="border-2 border-[#91897C] px-6 py-4 font-black uppercase text-[#EEF083] transition hover:border-[#EEF083] touch-manipulation"
            href="/profile"
          >
            View Profile
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function EndPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <EndContent />
    </Suspense>
  );
}
