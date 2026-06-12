"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { loadGuilds, getGuildAura, type Guild } from "../lib/guilds";
import { loadLeaderboard, type PlayerRow } from "../lib/leaderboard";
import { supabaseReady } from "../lib/supabase";

type Tab = "points" | "streak" | "gangs";

function truncAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function LeaderboardPage() {
  const { account, truncatedAddress } = useWallet();
  const addr = account ? String(account.address) : null;

  const [tab,     setTab]     = useState<Tab>("points");
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [guilds,  setGuilds]  = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [allPlayers, allGuilds] = await Promise.all([
        loadLeaderboard("aura"),
        loadGuilds(),
      ]);
      setPlayers(allPlayers);
      setGuilds(allGuilds.sort((a, b) => getGuildAura(b) - getGuildAura(a)));
      setLoading(false);
    })();
  }, []);

  // Re-sort players when tab changes
  const sortedPlayers = tab === "streak"
    ? [...players].sort((a, b) => b.best_streak - a.best_streak)
    : [...players].sort((a, b) => b.aura - a.aura);

  const myRank    = sortedPlayers.findIndex((p) => p.address === addr);
  const myRow     = sortedPlayers.find((p) => p.address === addr);
  const myGuild   = guilds.find((g) => g.members.includes(addr ?? ""));

  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Proof of Alpha</p>
            <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Leaderboard</h1>
          </div>
          {supabaseReady && (
            <div className="shrink-0 flex items-center gap-2 border border-[#a09ab8]/30 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#E4D474] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a09ab8]">Live</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#a09ab8]/30 mb-6">
          {([
            { key: "points", label: "Players"  },
            { key: "streak", label: "Streaks"  },
            { key: "gangs",  label: "Gangs"    },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              className={`px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] border-b-2 transition -mb-px ${
                tab === key
                  ? "border-[#E4D474] text-[#E4D474]"
                  : "border-transparent text-[#a09ab8] hover:text-[#E4D474]"
              }`}
              onClick={() => setTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Players / Streaks ── */}
        {tab !== "gangs" && (
          <div className="border border-[#a09ab8]/30 bg-[#2d1a4a]">

            {/* Column headers */}
            <div className="grid grid-cols-[36px_1fr_64px_80px] gap-4 px-4 py-2.5 border-b border-[#a09ab8]/20 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Matches</span>
              <span className="text-right">{tab === "streak" ? "Best Streak" : "AURA"}</span>
            </div>

            {loading && (
              <div className="py-14 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-[#a09ab8] animate-pulse">Loading…</p>
              </div>
            )}

            {!loading && sortedPlayers.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">No matches recorded yet</p>
                <p className="mt-2 text-sm text-[#ffffff]">Play a game to claim the top spot.</p>
              </div>
            )}

            {!loading && sortedPlayers.map((p, i) => {
              const isMe = p.address === addr;
              return (
                <div
                  key={p.address}
                  className={`grid grid-cols-[36px_1fr_64px_80px] items-center gap-4 px-4 py-3 border-b border-[#a09ab8]/10 last:border-0 ${isMe ? "bg-[#E4D474]/5" : ""}`}
                >
                  <span className="font-mono text-sm font-black" style={{
                    color: i === 0 ? "#E4D474" : i === 1 ? "#aaa" : i === 2 ? "#a09ab8" : "#a09ab8"
                  }}>
                    {i + 1}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[9px] font-black"
                      style={{ borderColor: isMe ? "#E4D474" : "#a09ab8", color: isMe ? "#E4D474" : "#a09ab8" }}>
                      {p.address.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-black truncate" style={{ color: isMe ? "#E4D474" : "#ffffff" }}>
                        {isMe ? truncatedAddress : truncAddr(p.address)}
                        {isMe && <span className="ml-1.5 font-mono text-[8px] border border-[#E4D474]/40 px-1">YOU</span>}
                      </p>
                      {(() => {
                        const g = guilds.find((g) => g.members.includes(p.address));
                        return g ? (
                          <p className="font-mono text-[9px] text-[#a09ab8] truncate">[{g.tag}] {g.name}</p>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <span className="text-right font-mono text-sm text-[#a09ab8]">{p.matches_played}</span>
                  <span className="text-right font-mono text-sm font-black text-[#E4D474]">
                    {tab === "streak" ? `${p.best_streak}×` : p.aura.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {/* Your row pinned at bottom if you're not in top 50 */}
            {!loading && addr && myRank === -1 && (
              <div className="border-t border-[#a09ab8]/30">
                <div className="px-4 py-2 bg-[#160c2c]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a09ab8]">Your position</p>
                </div>
                <div className="grid grid-cols-[36px_1fr_64px_80px] items-center gap-4 px-4 py-3 bg-[#E4D474]/5">
                  <span className="font-mono text-xs text-[#a09ab8]">—</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E4D474]/40 font-mono text-[9px] font-black text-[#E4D474]">
                      {addr.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-black text-[#E4D474] truncate">{truncatedAddress}</p>
                      {myGuild && <p className="font-mono text-[9px] text-[#a09ab8]">[{myGuild.tag}] {myGuild.name}</p>}
                    </div>
                  </div>
                  <span className="text-right font-mono text-sm text-[#a09ab8]">{myRow?.matches_played ?? 0}</span>
                  <span className="text-right font-mono text-sm font-black text-[#a09ab8]">
                    {tab === "streak" ? `${myRow?.best_streak ?? 0}×` : (myRow?.aura ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Gangs ── */}
        {tab === "gangs" && (
          <div className="border border-[#a09ab8]/30 bg-[#2d1a4a]">
            <div className="grid grid-cols-[36px_1fr_64px_90px] gap-4 px-4 py-2.5 border-b border-[#a09ab8]/20 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]">
              <span>#</span>
              <span>Gang</span>
              <span className="text-right">Members</span>
              <span className="text-right">Total AURA</span>
            </div>

            {guilds.map((g, i) => {
              const isMe = myGuild?.id === g.id;
              const aura = getGuildAura(g);
              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-[36px_1fr_64px_90px] items-center gap-4 px-4 py-3 border-b border-[#a09ab8]/10 last:border-0 ${isMe ? "bg-[#E4D474]/5" : ""}`}
                >
                  <span className="font-mono text-sm font-black" style={{
                    color: i === 0 ? "#E4D474" : i === 1 ? "#aaa" : i === 2 ? "#a09ab8" : "#a09ab8"
                  }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-black border px-1.5 py-px shrink-0"
                        style={{ borderColor: isMe ? "#E4D474" : "#a09ab8", color: isMe ? "#E4D474" : "#a09ab8" }}>
                        [{g.tag}]
                      </span>
                      <Link
                        href={`/guilds/${g.id}`}
                        className="font-black uppercase text-sm truncate hover:underline"
                        style={{ color: isMe ? "#E4D474" : "#ffffff" }}
                      >
                        {g.name}
                      </Link>
                      {isMe && <span className="font-mono text-[8px] text-[#E4D474] border border-[#E4D474]/40 px-1 shrink-0">YOU</span>}
                    </div>
                    <p className="font-mono text-[9px] text-[#a09ab8] truncate mt-0.5">"{g.motto}"</p>
                  </div>
                  <span className="text-right font-mono text-sm text-[#a09ab8]">{g.members.length}</span>
                  <span className="text-right font-mono text-sm font-black text-[#E4D474]">{aura.toLocaleString()}</span>
                </div>
              );
            })}

            <div className="border-t border-[#a09ab8]/20 px-4 py-3 text-center">
              <Link href="/guilds" className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a09ab8] hover:text-[#E4D474] transition">
                {myGuild ? "View your gang" : "Create or join a gang"}
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
