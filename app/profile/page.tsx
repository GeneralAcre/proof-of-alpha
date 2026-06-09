"use client";

import { useState, useEffect } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";

const UNLOCKED = new Set(["npc", "wojak"]);

const BADGES = [
  { name: "First Win",        desc: "Win your first match" },
  { name: "Streak x5",        desc: "5 wins in a row" },
  { name: "Gigachad NFT",     desc: "Reach 2,500 σ to mint" },
  { name: "100 Eliminations", desc: "Eliminate 100 players" },
];

export default function ProfilePage() {
  const { account, truncatedAddress } = useWallet();
  const [sigma, setSigma] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { setSigma(Number(localStorage.getItem("poa_sigma") ?? "0") || 0); } catch {}
  }, []);

  const rank     = getCurrentRank(sigma);
  const nextRank = getNextRank(sigma);
  const progress = getRankProgress(sigma);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile?addr=${truncatedAddress ?? "demo"}`
    : "";

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── IDENTITY ── */}
        <section className="mb-6 flex flex-wrap items-center gap-5 border border-[#91897C] bg-[#2f2922] p-5 shadow-[6px_6px_0_#91897C]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#EEF083] bg-[#EEF083]/10 font-mono text-3xl font-black text-[#EEF083]">
            {account ? (truncatedAddress?.slice(0, 2).toUpperCase() ?? "?") : "?"}
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Wallet</p>
            <p className="font-mono text-lg font-black text-[#EEF083]">
              {account ? truncatedAddress : "Not connected"}
            </p>
          </div>
          <div className="border border-[#EEF083] bg-[#EEF083]/10 px-5 py-3 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Rank</p>
            <p className="text-2xl font-black uppercase text-[#EEF083]">{rank.name}</p>
          </div>
          {profileUrl && account && (
            <button
              className="border border-[#91897C] px-4 py-2 font-mono text-xs uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]"
              onClick={() => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              type="button"
            >
              {copied ? "Copied!" : "Copy Profile Link"}
            </button>
          )}
        </section>

        {/* ── SIGMA POINTS ── */}
        <section className="mb-6 border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
          <div className="mb-2 flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
            <span className="text-[#91897C]">Sigma Points</span>
            <span className="font-black text-[#EEF083]">
              {sigma.toLocaleString()} σ
              {nextRank && (
                <span className="font-normal text-[#91897C]"> / {rank.next?.toLocaleString()} to {nextRank.name}</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full border border-[#91897C] bg-[#241F19]">
            <div className="h-full bg-[#EEF083] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase text-[#91897C]">
            {["NPC","Beta","Alpha","Sigma","Gigachad"].map((r) => <span key={r}>{r}</span>)}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">

            {/* ── STATS ── */}
            <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Stats</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {[
                  { label: "Matches",       value: "—" },
                  { label: "Wins",          value: "—" },
                  { label: "Win Rate",      value: "—" },
                  { label: "Fav Archetype", value: "—" },
                  { label: "Eliminations",  value: "—" },
                  { label: "Best Streak",   value: "—" },
                  { label: "$TEST Stolen",  value: "—" },
                  { label: "Losses",        value: "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b border-r border-[#91897C] p-4 last:border-r-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C]">{label}</p>
                    <p className="mt-1 text-xl font-black text-[#91897C]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── MATCH HISTORY ── */}
            <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                  Recent Matches
                </p>
              </div>
              <div className="px-5 py-10 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No matches yet</p>
                <p className="mt-2 text-sm text-[#d8d4a1]">Play your first game to see history here.</p>
              </div>
            </section>
          </div>

          <div className="space-y-5">

            {/* ── ARCHETYPE COLLECTION ── */}
            <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                Collection
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ARCHETYPES.map((a) => {
                  const owned = UNLOCKED.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`border p-2 text-center ${owned ? "border-[#EEF083] bg-[#EEF083]/5" : "border-[#91897C] opacity-40"}`}
                    >
                      <p className="font-mono text-sm font-black text-[#EEF083]">{a.initials}</p>
                      <p className="mt-0.5 text-[10px] text-[#91897C]">
                        {owned ? "Owned" : `${a.unlockCost}σ`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── BADGES ── */}
            <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
                On-chain Badges
              </p>
              {BADGES.map(({ name, desc }) => (
                <div
                  key={name}
                  className="mb-2 flex items-center gap-3 border border-[#91897C] p-3 opacity-40 last:mb-0"
                >
                  <div className="h-6 w-6 shrink-0 border border-[#91897C]" />
                  <div>
                    <p className="text-xs font-black uppercase text-[#EEF083]">{name}</p>
                    <p className="text-[10px] text-[#91897C]">{desc}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
