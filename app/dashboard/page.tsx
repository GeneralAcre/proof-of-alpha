"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";
import { getUnlocked } from "../lib/unlocks";

export default function Dashboard() {
  const { account, truncatedAddress } = useWallet();
  const [sigma, setSigma] = useState(0);
  const [stats, setStats] = useState({ matches: 0, winRate: "—", elims: 0, bestStreak: 0 });
  const [unlockedSet, setUnlocked] = useState<Set<string>>(new Set(["alpha", "beta"]));

  const walletAddr = account ? String(account.address) : null;

  useEffect(() => {
    const auraKey = walletAddr ? `poa_aura_${walletAddr}` : "poa_aura_anonymous";
    const matchKey = walletAddr ? `poa_matches_${walletAddr}` : "poa_matches_anonymous";
    try { setSigma(Number(localStorage.getItem(auraKey) ?? "0") || 0); } catch {}
    setUnlocked(getUnlocked(walletAddr));
    try {
      const raw = localStorage.getItem(matchKey);
      if (raw) {
        const records = JSON.parse(raw) as Array<{ won: boolean; elims: number }>;
        const wins = records.filter((r) => r.won).length;
        const elims = records.reduce((s, r) => s + r.elims, 0);
        let streak = 0, best = 0;
        for (const r of records) {
          if (r.won) { streak++; best = Math.max(best, streak); } else streak = 0;
        }
        setStats({
          matches: records.length,
          winRate: records.length ? `${Math.round((wins / records.length) * 100)}%` : "—",
          elims,
          bestStreak: best,
        });
      }
    } catch {}
  }, [walletAddr]);

  if (!account) {
    return (
      <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
        <Nav />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">
            Not connected
          </p>
          <h1 className="mb-4 text-5xl font-black uppercase">Connect first</h1>
          <p className="text-[#231942]">
            Use the <span className="font-black text-[#5e548e]">Connect Wallet</span> button in the navigation above.
          </p>
        </div>
      </div>
    );
  }

  const rank = getCurrentRank(sigma);
  const nextRank = getNextRank(sigma);
  const progress = getRankProgress(sigma);

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── WALLET + RANK + SIGMA POINTS ── */}
        <section className="mb-6 border border-[#ddd6ea] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">
                Connected wallet
              </p>
              <p className="mt-1 font-mono text-xl font-black text-[#5e548e]">
                {truncatedAddress}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#716a7e]">solana:mainnet</p>
            </div>
            <div className="rounded-xl border border-[#5e548e] bg-[#5e548e]/10 px-5 py-3 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">Rank</p>
              <p className="mt-1 text-2xl font-black uppercase text-[#5e548e]">{rank.name}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
              <span className="text-[#716a7e]">AURA</span>
              <span className="font-black text-[#5e548e]">
                {sigma.toLocaleString()}
                {nextRank && (
                  <span className="font-normal text-[#716a7e]">
                    {" "}/ {rank.next?.toLocaleString()} to {nextRank.name}
                  </span>
                )}
              </span>
            </div>
            <div className="rounded-full h-2 w-full border border-[#ddd6ea] bg-[#f8f7fc]">
              <div
                className="h-full bg-[#5e548e] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[#716a7e]">
              <span>{rank.name}</span>
              {nextRank && <span>{nextRank.name}</span>}
            </div>
          </div>
        </section>

        {/* ── QUICK STATS ── */}
        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Matches Played", value: stats.matches || "—" },
            { label: "Win Rate",       value: stats.winRate },
            { label: "Eliminations",   value: stats.elims || "—" },
            { label: "Best Streak",    value: stats.bestStreak || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[#ddd6ea] bg-white p-4 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#716a7e]">{label}</p>
              <p className="mt-2 text-3xl font-black text-[#716a7e]">{value}</p>
            </div>
          ))}
        </section>

        {/* ── ARCHETYPE COLLECTION ── */}
        <section className="mb-6 border border-[#ddd6ea] bg-white p-5 shadow-sm">
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">
            Archetype Collection
          </p>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {ARCHETYPES.map((a) => {
              const isOwned = unlockedSet.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 transition ${
                    isOwned ? "border-[#5e548e] bg-[#5e548e]/5" : "border-[#ddd6ea] opacity-50"
                  }`}
                >
                  <div
                    className={`rounded-lg mb-2 flex h-10 w-10 items-center justify-center border font-mono text-sm font-black ${
                      isOwned
                        ? "border-[#5e548e] bg-[#5e548e]/10 text-[#5e548e]"
                        : "border-[#ddd6ea] bg-[#f8f7fc] text-[#716a7e]"
                    }`}
                  >
                    {a.initials}
                  </div>
                  <p className="text-sm font-black uppercase">{a.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase text-[#716a7e]">
                    {isOwned ? "Unlocked" : `${a.unlockCost.toLocaleString()} AURA`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTAs ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            className="rounded-xl border border-[#5e548e] bg-[#5e548e] p-6 text-center font-black uppercase text-white shadow-sm transition hover:bg-transparent hover:text-[#5e548e]"
            href="/mode-select?type=solo"
          >
            <span className="block text-3xl font-black">Play Solo</span>
            <span className="mt-1 block font-mono text-xs tracking-[0.16em] opacity-70">
              vs AI bots · instant start
            </span>
          </Link>
          <Link
            className="rounded-xl border border-[#5e548e] p-6 text-center font-black uppercase text-[#5e548e] shadow-sm transition hover:bg-[#5e548e] hover:text-white"
            href="/mode-select?type=multiplayer"
          >
            <span className="block text-3xl font-black">Play Multiplayer</span>
            <span className="mt-1 block font-mono text-xs tracking-[0.16em] opacity-70">
              full points · ranked
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
