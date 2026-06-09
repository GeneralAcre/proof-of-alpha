"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";

const UNLOCKED = new Set(["npc", "wojak"]);

export default function Dashboard() {
  const { account, truncatedAddress } = useWallet();
  const [sigma, setSigma] = useState(0);

  useEffect(() => {
    try { setSigma(Number(localStorage.getItem("poa_sigma") ?? "0") || 0); } catch {}
  }, []);

  if (!account) {
    return (
      <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
        <Nav />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
            Not connected
          </p>
          <h1 className="mb-4 text-5xl font-black uppercase">Connect first</h1>
          <p className="text-[#d8d4a1]">
            Use the <span className="font-black text-[#EEF083]">Connect Wallet</span> button in the navigation above.
          </p>
        </div>
      </div>
    );
  }

  const rank = getCurrentRank(sigma);
  const nextRank = getNextRank(sigma);
  const progress = getRankProgress(sigma);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── WALLET + RANK + SIGMA POINTS ── */}
        <section className="mb-6 border border-[#91897C] bg-[#2f2922] p-5 shadow-[6px_6px_0_#91897C] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
                Connected wallet
              </p>
              <p className="mt-1 font-mono text-xl font-black text-[#EEF083]">
                {truncatedAddress}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#91897C]">solana:devnet</p>
            </div>
            <div className="border border-[#EEF083] bg-[#EEF083]/10 px-5 py-3 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Rank</p>
              <p className="mt-1 text-2xl font-black uppercase text-[#EEF083]">{rank.name}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
              <span className="text-[#91897C]">Sigma Points</span>
              <span className="font-black text-[#EEF083]">
                {sigma.toLocaleString()} σ
                {nextRank && (
                  <span className="font-normal text-[#91897C]">
                    {" "}/ {rank.next?.toLocaleString()} to {nextRank.name}
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 w-full border border-[#91897C] bg-[#241F19]">
              <div
                className="h-full bg-[#EEF083] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[#91897C]">
              <span>{rank.name}</span>
              {nextRank && <span>{nextRank.name}</span>}
            </div>
          </div>
        </section>

        {/* ── QUICK STATS ── */}
        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Matches Played", value: "—" },
            { label: "Win Rate",       value: "—" },
            { label: "Eliminations",   value: "—" },
            { label: "Best Streak",    value: "—" },
          ].map(({ label, value }) => (
            <div key={label} className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#91897C]">{label}</p>
              <p className="mt-2 text-3xl font-black text-[#91897C]">{value}</p>
            </div>
          ))}
        </section>

        {/* ── ARCHETYPE COLLECTION ── */}
        <section className="mb-6 border border-[#91897C] bg-[#2f2922] p-5 shadow-[6px_6px_0_#91897C]">
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Archetype Collection
          </p>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {ARCHETYPES.map((a) => {
              const unlocked = UNLOCKED.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`border p-3 transition ${
                    unlocked ? "border-[#EEF083] bg-[#EEF083]/5" : "border-[#91897C] opacity-50"
                  }`}
                >
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center border font-mono text-sm font-black ${
                      unlocked
                        ? "border-[#EEF083] bg-[#EEF083]/10 text-[#EEF083]"
                        : "border-[#91897C] bg-[#241F19] text-[#91897C]"
                    }`}
                  >
                    {a.initials}
                  </div>
                  <p className="text-sm font-black uppercase">{a.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase text-[#91897C]">
                    {unlocked ? "Unlocked" : `${a.unlockCost.toLocaleString()} σ`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTAs ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            className="border-2 border-[#EEF083] bg-[#EEF083] p-6 text-center font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
            href="/mode-select?type=solo"
          >
            <span className="block text-3xl font-black">Play Solo</span>
            <span className="mt-1 block font-mono text-xs tracking-[0.16em] opacity-70">
              vs AI bots · instant start
            </span>
          </Link>
          <Link
            className="border-2 border-[#EEF083] p-6 text-center font-black uppercase text-[#EEF083] shadow-[6px_6px_0_#91897C] transition hover:bg-[#EEF083] hover:text-[#241F19]"
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
