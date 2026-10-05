"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../../components/Nav";
import { useWallet } from "../../components/WalletProvider";
import { getCurrentRank, getNextRank, getRankProgress } from "../../lib/archetypes";
import { loadPlayerProfile, type PlayerRow } from "../../lib/leaderboard";
import { getPlayerGuild } from "../../lib/guilds";
import type { Guild } from "../../lib/guilds";

function truncAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function PlayerProfilePage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr: targetAddr } = use(params);
  const { account } = useWallet();
  const isOwn = account ? String(account.address) === targetAddr : false;

  const [player,  setPlayer]  = useState<PlayerRow | null>(null);
  const [guild,   setGuild]   = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [p, g] = await Promise.all([
        loadPlayerProfile(targetAddr),
        getPlayerGuild(targetAddr),
      ]);
      setPlayer(p);
      setGuild(g);
      setLoading(false);
    })();
  }, [targetAddr]);

  function copyAddress() {
    navigator.clipboard.writeText(targetAddr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const aura     = player?.aura ?? 0;
  const rank     = getCurrentRank(aura);
  const nextRank = getNextRank(aura);
  const progress = getRankProgress(aura);
  const winRate  = player && player.matches_played > 0
    ? Math.round((player.matches_won / player.matches_played) * 100)
    : 0;
  const initials = targetAddr.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">Player</p>
            <h1 className="mt-1 text-4xl font-black uppercase sm:text-5xl">
              {truncAddr(targetAddr)}
            </h1>
          </div>
          <Link
            href="/leaderboard"
            className="rounded-full shrink-0 border border-[#ddd6ea] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e]"
          >
            Back
          </Link>
        </div>

        {isOwn && (
          <div className="rounded-xl border border-[#5e548e]/30 bg-[#5e548e]/5 px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5e548e]">
              This is your profile
            </p>
            <Link
              href="/profile"
              className="rounded-full border border-[#5e548e] px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#5e548e] transition hover:bg-[#5e548e] hover:text-white"
            >
              Full Profile
            </Link>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#716a7e] animate-pulse">Loading…</p>
          </div>
        ) : (
          <>
            {/* Identity + AURA */}
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

              {/* Identity card */}
              <section className="border border-[#ddd6ea] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start gap-5">
                  <div className="rounded-lg flex h-20 w-20 shrink-0 items-center justify-center border border-[#5e548e] bg-[#5e548e]/10 font-mono text-4xl font-black text-[#5e548e]">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">Wallet</p>
                    <p className="break-all font-mono text-sm font-bold leading-6 text-[#5e548e]">{targetAddr}</p>
                    <button
                      className="rounded-full mt-2 border border-[#ddd6ea]/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e]"
                      onClick={copyAddress}
                      type="button"
                    >
                      {copied ? "✓ Copied" : "Copy Address"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Rank card */}
              <section className="border border-[#ddd6ea] bg-white p-6 shadow-sm flex flex-col justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">Rank</p>
                <p className="mt-2 text-5xl font-black uppercase text-[#5e548e]">{rank.name}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase text-[#716a7e]">
                    <span>{aura.toLocaleString()} AURA</span>
                    {nextRank && <span>/ {nextRank.name}</span>}
                  </div>
                  <div className="rounded-full h-1.5 w-full border border-[#ddd6ea] bg-[#f8f7fc]">
                    <div className="h-full bg-[#5e548e]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </section>
            </div>

            {/* Stats */}
            <section className="border border-[#ddd6ea] bg-white shadow-sm">
              <div className="border-b border-[#ddd6ea] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#716a7e]">Stats</p>
              </div>
              {!player ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">No matches recorded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#716a7e]/30">
                  {[
                    { label: "Matches",     value: player.matches_played || "—" },
                    { label: "Wins",        value: player.matches_won    || "—" },
                    { label: "Win Rate",    value: player.matches_played ? `${winRate}%` : "—" },
                    { label: "Best Streak", value: player.best_streak    || "—" },
                  ].map(({ label, value }, i) => (
                    <div key={i} className="p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#716a7e]">{label}</p>
                      <p className="mt-2 text-3xl font-black text-[#5e548e]">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Gang */}
            <section className="border border-[#ddd6ea] bg-white p-6 shadow-sm">
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#716a7e]">Gang</p>
              {guild ? (
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl border border-[#5e548e] px-2 py-0.5 font-mono text-xs font-black text-[#5e548e]">
                        [{guild.tag}]
                      </span>
                      <p className="text-2xl font-black uppercase">{guild.name}</p>
                    </div>
                    {guild.motto && (
                      <p className="mt-1 font-mono text-sm italic text-[#716a7e]">"{guild.motto}"</p>
                    )}
                    <p className="mt-2 font-mono text-xs text-[#716a7e]">
                      <span className="font-black text-[#5e548e]">{guild.members.length}</span> members
                    </p>
                  </div>
                  <Link
                    href={`/guilds/${guild.id}`}
                    className="rounded-full shrink-0 border border-[#5e548e] bg-[#5e548e] px-6 py-3 font-mono text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-transparent hover:text-[#5e548e]"
                  >
                    View Gang
                  </Link>
                </div>
              ) : (
                <p className="font-mono text-sm text-[#716a7e]">Not in a gang</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
