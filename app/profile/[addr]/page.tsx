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
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Player</p>
            <h1 className="mt-1 text-4xl font-black uppercase sm:text-5xl">
              {truncAddr(targetAddr)}
            </h1>
          </div>
          <Link
            href="/leaderboard"
            className="shrink-0 border border-[#a09ab8] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
          >
            Back
          </Link>
        </div>

        {isOwn && (
          <div className="border border-[#E4D474]/30 bg-[#E4D474]/5 px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#E4D474]">
              This is your profile
            </p>
            <Link
              href="/profile"
              className="border border-[#E4D474] px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#E4D474] transition hover:bg-[#E4D474] hover:text-[#24153E]"
            >
              Full Profile
            </Link>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#a09ab8] animate-pulse">Loading…</p>
          </div>
        ) : (
          <>
            {/* Identity + AURA */}
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

              {/* Identity card */}
              <section className="border border-[#a09ab8] bg-[#2d1a4a] p-6 shadow-[6px_6px_0_#a09ab8]">
                <div className="flex flex-wrap items-start gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-[#E4D474] bg-[#E4D474]/10 font-mono text-4xl font-black text-[#E4D474]">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Wallet</p>
                    <p className="break-all font-mono text-sm font-bold leading-6 text-[#E4D474]">{targetAddr}</p>
                    <button
                      className="mt-2 border border-[#a09ab8]/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
                      onClick={copyAddress}
                      type="button"
                    >
                      {copied ? "✓ Copied" : "Copy Address"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Rank card */}
              <section className="border border-[#a09ab8] bg-[#2d1a4a] p-6 shadow-[6px_6px_0_#a09ab8] flex flex-col justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Rank</p>
                <p className="mt-2 text-5xl font-black uppercase text-[#E4D474]">{rank.name}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase text-[#a09ab8]">
                    <span>{aura.toLocaleString()} AURA</span>
                    {nextRank && <span>→ {nextRank.name}</span>}
                  </div>
                  <div className="h-1.5 w-full border border-[#a09ab8] bg-[#24153E]">
                    <div className="h-full bg-[#E4D474]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </section>
            </div>

            {/* Stats */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
              <div className="border-b border-[#a09ab8] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">Stats</p>
              </div>
              {!player ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">No matches recorded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#a09ab8]/30">
                  {[
                    { label: "Matches",     value: player.matches_played || "—" },
                    { label: "Wins",        value: player.matches_won    || "—" },
                    { label: "Win Rate",    value: player.matches_played ? `${winRate}%` : "—" },
                    { label: "Best Streak", value: player.best_streak    || "—" },
                  ].map(({ label, value }, i) => (
                    <div key={i} className="p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8]">{label}</p>
                      <p className="mt-2 text-3xl font-black text-[#E4D474]">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Gang */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] p-6 shadow-[4px_4px_0_#a09ab8]">
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">Gang</p>
              {guild ? (
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-[#E4D474] px-2 py-0.5 font-mono text-xs font-black text-[#E4D474]">
                        [{guild.tag}]
                      </span>
                      <p className="text-2xl font-black uppercase">{guild.name}</p>
                    </div>
                    {guild.motto && (
                      <p className="mt-1 font-mono text-sm italic text-[#a09ab8]">"{guild.motto}"</p>
                    )}
                    <p className="mt-2 font-mono text-xs text-[#a09ab8]">
                      <span className="font-black text-[#E4D474]">{guild.members.length}</span> members
                    </p>
                  </div>
                  <Link
                    href={`/guilds/${guild.id}`}
                    className="shrink-0 border-2 border-[#E4D474] bg-[#E4D474] px-6 py-3 font-mono text-xs font-black uppercase tracking-widest text-[#24153E] shadow-[3px_3px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
                  >
                    View Gang
                  </Link>
                </div>
              ) : (
                <p className="font-mono text-sm text-[#a09ab8]">Not in a gang</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
