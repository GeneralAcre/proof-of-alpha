"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { loadGuilds, getGuildAura, type Guild } from "../lib/guilds";

type Tab = "points" | "streak" | "gangs";

export default function LeaderboardPage() {
  const { account, truncatedAddress } = useWallet();
  const addr = account ? String(account.address) : null;

  const [tab,        setTab]        = useState<Tab>("points");
  const [guilds,     setGuilds]     = useState<Guild[]>([]);
  const [myGuildId,  setMyGuildId]  = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const all = await loadGuilds();
      const sorted = all.sort((a, b) => getGuildAura(b) - getGuildAura(a));
      setGuilds(sorted);
      if (addr) {
        const myG = sorted.find((g) => g.members.includes(addr));
        setMyGuildId(myG?.id ?? null);
      }
    })();
  }, [addr]);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Header */}
        <h1 className="text-5xl font-black uppercase mb-8">Leaderboard</h1>

        {/* Tabs */}
        <div className="flex border-b border-[#91897C]/30 mb-6">
          {([
            { key: "points", label: "Players" },
            { key: "streak", label: "Streaks" },
            { key: "gangs",  label: "Gangs"   },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              className={`px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] border-b-2 transition -mb-px ${
                tab === key
                  ? "border-[#EEF083] text-[#EEF083]"
                  : "border-transparent text-[#91897C] hover:text-[#EEF083]"
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
          <div className="border border-[#91897C]/30 bg-[#2f2922]">
            {/* Column headers */}
            <div className="grid grid-cols-[36px_1fr_56px_80px] gap-4 px-4 py-2.5 border-b border-[#91897C]/20 font-mono text-[9px] uppercase tracking-[0.14em] text-[#91897C]">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Matches</span>
              <span className="text-right">{tab === "streak" ? "Best Streak" : "AURA"}</span>
            </div>

            {/* Empty state */}
            <div className="py-16 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No matches recorded yet</p>
              <p className="mt-2 text-sm text-[#d8d4a1]">Play a game to claim the top spot.</p>
            </div>

            {/* Your position */}
            {account && (
              <div className="border-t border-[#91897C]/30">
                <div className="px-4 py-2 bg-[#1a1710]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#91897C]">Your position</p>
                </div>
                <div className="grid grid-cols-[36px_1fr_56px_80px] items-center gap-4 px-4 py-3 bg-[#EEF083]/5">
                  <span className="font-mono text-xs text-[#91897C]">—</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#EEF083]/40 font-mono text-[9px] font-black text-[#EEF083]">
                      ?
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-black text-[#EEF083] truncate">{truncatedAddress}</p>
                      <p className="font-mono text-[9px] text-[#91897C]">
                        {myGuildId
                          ? `[${guilds.find((g) => g.id === myGuildId)?.tag}] ${guilds.find((g) => g.id === myGuildId)?.name}`
                          : "No gang"}
                      </p>
                    </div>
                  </div>
                  <span className="text-right font-mono text-xs text-[#91897C]">0</span>
                  <span className="text-right font-mono text-sm font-black text-[#91897C]">0</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Gangs ── */}
        {tab === "gangs" && (
          <div className="border border-[#91897C]/30 bg-[#2f2922]">
            <div className="grid grid-cols-[36px_1fr_56px_90px] gap-4 px-4 py-2.5 border-b border-[#91897C]/20 font-mono text-[9px] uppercase tracking-[0.14em] text-[#91897C]">
              <span>#</span>
              <span>Gang</span>
              <span className="text-right">Members</span>
              <span className="text-right">Total AURA</span>
            </div>

            {guilds.map((g, i) => {
              const isMe = myGuildId === g.id;
              const aura = getGuildAura(g);
              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-[36px_1fr_56px_90px] items-center gap-4 px-4 py-3 border-b border-[#91897C]/10 last:border-0 ${isMe ? "bg-[#EEF083]/5" : ""}`}
                >
                  <span className="font-mono text-xs font-black" style={{
                    color: i === 0 ? "#EEF083" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "#91897C"
                  }}>
                    {i + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] border px-1.5 py-px font-black shrink-0"
                        style={{ borderColor: isMe ? "#EEF083" : "#91897C", color: isMe ? "#EEF083" : "#91897C" }}>
                        [{g.tag}]
                      </span>
                      <Link
                        href={`/guilds/${g.id}`}
                        className="font-black uppercase text-sm truncate hover:underline"
                        style={{ color: isMe ? "#EEF083" : "#d8d4a1" }}
                      >
                        {g.name}
                      </Link>
                    </div>
                    <p className="font-mono text-[9px] text-[#91897C] truncate mt-0.5">"{g.motto}"</p>
                  </div>

                  <span className="text-right font-mono text-xs text-[#91897C]">{g.members.length}</span>
                  <span className="text-right font-mono text-sm font-black text-[#EEF083]">{aura.toLocaleString()}</span>
                </div>
              );
            })}

            <div className="border-t border-[#91897C]/20 px-4 py-3 text-center">
              <Link href="/guilds" className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#91897C] hover:text-[#EEF083] transition">
                {myGuildId ? "View your gang" : "Create or join a gang"}
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
