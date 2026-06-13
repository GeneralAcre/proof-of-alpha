"use client";

import { useState, useEffect } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";
import type { MatchRecord } from "../end/page";

type Stats = {
  matches: number; wins: number; losses: number;
  elims: number; favArchetype: string; bestStreak: number;
};

function computeStats(records: MatchRecord[]): Stats {
  let wins = 0, streak = 0, bestStreak = 0, elims = 0;
  const archetypeCount: Record<string, number> = {};
  for (const r of records) {
    if (r.won) { wins++; streak++; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
    elims += r.elims;
    archetypeCount[r.archetype] = (archetypeCount[r.archetype] ?? 0) + 1;
  }
  const favArchetype = Object.entries(archetypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return { matches: records.length, wins, losses: records.length - wins, elims, favArchetype, bestStreak };
}

export default function ProfilePage() {
  const { account, truncatedAddress } = useWallet();
  const [aura,    setAura]    = useState(0);
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [copied,  setCopied]  = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const fullAddress = account ? String(account.address) : null;

  useEffect(() => {
    const auraKey = fullAddress ? `poa_aura_${fullAddress}` : "poa_aura_anonymous";
    const matchKey = fullAddress ? `poa_matches_${fullAddress}` : "poa_matches_anonymous";
    try { setAura(Number(localStorage.getItem(auraKey) ?? "0") || 0); } catch {}
    try {
      const raw = localStorage.getItem(matchKey);
      if (raw) setRecords(JSON.parse(raw) as MatchRecord[]);
    } catch {}
  }, [fullAddress]);

  const stats = computeStats(records);

  const rank     = getCurrentRank(aura);
  const nextRank = getNextRank(aura);
  const progress = getRankProgress(aura);

  const initials = fullAddress ? fullAddress.slice(0, 2).toUpperCase() : "?";

  function copyAddress() {
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
  }

  function copyProfileLink() {
    const url = `${window.location.origin}/profile?addr=${truncatedAddress ?? "demo"}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── IDENTITY ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] p-5 shadow-[6px_6px_0_#a09ab8]">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#E4D474] bg-[#E4D474]/10 font-mono text-3xl font-black text-[#E4D474]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Wallet</p>
              {fullAddress ? (
                <>
                  <p className="break-all font-mono text-sm font-bold leading-6 text-[#E4D474]">{fullAddress}</p>
                  <button className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8] transition hover:text-[#E4D474]" onClick={copyAddress} type="button">
                    {copiedAddr ? "✓ Copied" : "Copy address"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-[#a09ab8]">Not connected</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="border border-[#E4D474] bg-[#E4D474]/10 px-5 py-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Rank</p>
                <p className="text-2xl font-black uppercase text-[#E4D474]">{rank.name}</p>
              </div>
              {account && (
                <button className="border border-[#a09ab8] px-4 py-2 font-mono text-[10px] uppercase text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]" onClick={copyProfileLink} type="button">
                  {copied ? "Copied!" : "Copy Profile Link"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── AURA ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] p-5 shadow-[4px_4px_0_#a09ab8]">
          <div className="mb-2 flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
            <span className="text-[#a09ab8]">AURA</span>
            <span className="font-bold text-[#E4D474]">
              {aura.toLocaleString()} AURA
              {nextRank && (
                <span className="font-normal text-[#a09ab8]"> / {rank.next?.toLocaleString()} to {nextRank.name}</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full border border-[#a09ab8] bg-[#24153E]">
            <div className="h-full bg-[#E4D474] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase text-[#a09ab8]">
            {["NPC","Beta","Alpha","Sigma","Gigachad"].map((r) => <span key={r}>{r}</span>)}
          </div>
        </section>

        <div className="space-y-6">

            {/* ── STATS ── */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
              <div className="border-b border-[#a09ab8] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">Stats</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {([
                  { label: "Matches",       value: stats.matches || "—" },
                  { label: "Wins",          value: stats.wins    || "—" },
                  { label: "Win Rate",      value: stats.matches ? `${Math.round((stats.wins / stats.matches) * 100)}%` : "—" },
                  { label: "Fav Archetype", value: stats.favArchetype !== "—" ? stats.favArchetype.charAt(0).toUpperCase() + stats.favArchetype.slice(1) : "—" },
                  { label: "Eliminations",  value: stats.elims      || "—" },
                  { label: "Best Streak",   value: stats.bestStreak || "—" },
                  { label: "Losses",        value: stats.losses     || "—" },
                  { label: "AURA Total",    value: aura ? `${aura} AURA` : "—" },
                ] as const).map(({ label, value }, i) => (
                  <div key={i} className="border-b border-r border-[#a09ab8] p-4 last:border-r-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8]">{label}</p>
                    <p className="mt-1 text-xl font-bold text-[#E4D474]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── MATCH HISTORY ── */}
            <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
              <div className="border-b border-[#a09ab8] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#a09ab8]">Recent Matches</p>
              </div>
              {records.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">No matches yet</p>
                  <p className="mt-2 text-sm text-[#ffffff]">Play your first game to see history here.</p>
                </div>
              ) : (
                <div>
                  {records.slice(0, 10).map((r, i) => {
                    const arch = ARCHETYPES.find((a) => a.id === r.archetype);
                    const date = new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <div key={i} className="flex items-center justify-between border-b border-[#a09ab8]/40 px-5 py-3 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-12 shrink-0 font-mono text-xs font-black uppercase ${r.won ? "text-[#E4D474]" : "text-[#a09ab8]"}`}>
                            {r.won ? "WIN" : "LOSS"}
                          </span>
                          <div>
                            <p className="font-mono text-xs font-bold text-[#E4D474]">{arch?.name ?? r.archetype} · {r.mode}</p>
                            <p className="text-[10px] text-[#a09ab8]">{r.elims} elim{r.elims !== 1 ? "s" : ""} · {date}</p>
                          </div>
                        </div>
                        <span className={`font-mono text-sm font-black ${r.earned >= 0 ? "text-[#E4D474]" : "text-[#a09ab8]"}`}>
                          {r.earned >= 0 ? "+" : ""}{r.earned} AURA
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
        </div>
      </main>
    </div>
  );
}
