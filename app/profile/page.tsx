"use client";

import { useState, useEffect } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";
import { getUnlocked, saveUnlock } from "../lib/unlocks";
import { sfx, initSounds } from "../lib/sounds";
import type { MatchRecord } from "../end/page";

const BADGES = [
  { name: "First Win",        desc: "Win your first match" },
  { name: "Streak x5",        desc: "5 wins in a row" },
  { name: "Gigachad NFT",     desc: "Reach 2,500 AURA to mint" },
  { name: "100 Eliminations", desc: "Eliminate 100 players" },
];

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
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(["alpha", "beta"]));

  const fullAddress = account ? String(account.address) : null;

  useEffect(() => { initSounds(); }, []);

  useEffect(() => {
    const auraKey = fullAddress ? `poa_aura_${fullAddress}` : "poa_aura_anonymous";
    const matchKey = fullAddress ? `poa_matches_${fullAddress}` : "poa_matches_anonymous";
    try { setAura(Number(localStorage.getItem(auraKey) ?? "0") || 0); } catch {}
    try {
      const raw = localStorage.getItem(matchKey);
      if (raw) setRecords(JSON.parse(raw) as MatchRecord[]);
    } catch {}
    setUnlocked(getUnlocked(fullAddress));
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

  function handleUnlock(archetypeId: string, cost: number) {
    if (aura < cost) return;
    const newAura = aura - cost;
    const auraKey = fullAddress ? `poa_aura_${fullAddress}` : "poa_aura_anonymous";
    try { localStorage.setItem(auraKey, String(newAura)); } catch {}
    setAura(newAura);
    // save unlock
    saveUnlock(fullAddress, archetypeId);
    setUnlocked(getUnlocked(fullAddress));
    sfx.unlock();
  }

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── IDENTITY ── */}
        <section className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[6px_6px_0_#91897C]">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#EEF083] bg-[#EEF083]/10 font-mono text-3xl font-black text-[#EEF083]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Wallet</p>
              {fullAddress ? (
                <>
                  <p className="break-all font-mono text-sm font-bold leading-6 text-[#EEF083]">{fullAddress}</p>
                  <button className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C] transition hover:text-[#EEF083]" onClick={copyAddress} type="button">
                    {copiedAddr ? "✓ Copied" : "Copy address"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-[#91897C]">Not connected</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="border border-[#EEF083] bg-[#EEF083]/10 px-5 py-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Rank</p>
                <p className="text-2xl font-black uppercase text-[#EEF083]">{rank.name}</p>
              </div>
              {account && (
                <button className="border border-[#91897C] px-4 py-2 font-mono text-[10px] uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]" onClick={copyProfileLink} type="button">
                  {copied ? "Copied!" : "Copy Profile Link"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── AURA ── */}
        <section className="border border-[#91897C] bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C]">
          <div className="mb-2 flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
            <span className="text-[#91897C]">AURA</span>
            <span className="font-bold text-[#EEF083]">
              {aura.toLocaleString()} AURA
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

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-6">

            {/* ── STATS ── */}
            <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">Stats</p>
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
                  <div key={i} className="border-b border-r border-[#91897C] p-4 last:border-r-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C]">{label}</p>
                    <p className="mt-1 text-xl font-bold text-[#EEF083]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── MATCH HISTORY ── */}
            <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
              <div className="border-b border-[#91897C] px-5 py-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">Recent Matches</p>
              </div>
              {records.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No matches yet</p>
                  <p className="mt-2 text-sm text-[#d8d4a1]">Play your first game to see history here.</p>
                </div>
              ) : (
                <div>
                  {records.slice(0, 10).map((r, i) => {
                    const arch = ARCHETYPES.find((a) => a.id === r.archetype);
                    const date = new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <div key={i} className="flex items-center justify-between border-b border-[#91897C]/40 px-5 py-3 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-12 shrink-0 font-mono text-xs font-black uppercase ${r.won ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                            {r.won ? "WIN" : "LOSS"}
                          </span>
                          <div>
                            <p className="font-mono text-xs font-bold text-[#EEF083]">{arch?.name ?? r.archetype} · {r.mode}</p>
                            <p className="text-[10px] text-[#91897C]">{r.elims} elim{r.elims !== 1 ? "s" : ""} · {date}</p>
                          </div>
                        </div>
                        <span className={`font-mono text-sm font-black ${r.earned >= 0 ? "text-[#EEF083]" : "text-[#91897C]"}`}>
                          {r.earned >= 0 ? "+" : ""}{r.earned} AURA
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">

            {/* ── ARCHETYPE COLLECTION ── */}
            <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">Collection</p>
              <div className="grid grid-cols-3 gap-2">
                {ARCHETYPES.map((a) => {
                  const owned = unlocked.has(a.id);
                  const canAfford = aura >= a.unlockCost;
                  return (
                    <div
                      key={a.id}
                      className={`border p-2 text-center transition ${owned ? "border-[#EEF083] bg-[#EEF083]/5" : "border-[#91897C]"}`}
                    >
                      <p className="font-mono text-sm font-bold text-[#EEF083]">{a.initials}</p>
                      {owned ? (
                        <p className="mt-0.5 text-[10px] text-[#91897C]">Owned</p>
                      ) : (
                        <>
                          <p className="mt-0.5 text-[10px] text-[#91897C]">{a.unlockCost.toLocaleString()} AURA</p>
                          <button
                            className={`mt-1.5 w-full border px-1 py-1.5 font-mono text-[10px] uppercase transition touch-manipulation ${
                              canAfford
                                ? "border-[#EEF083] text-[#EEF083] hover:bg-[#EEF083] hover:text-[#241F19]"
                                : "border-[#91897C]/40 text-[#91897C]/40 cursor-not-allowed"
                            }`}
                            disabled={!canAfford}
                            onClick={() => handleUnlock(a.id, a.unlockCost)}
                            type="button"
                          >
                            {canAfford ? "Unlock" : "Need AURA"}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── BADGES ── */}
            <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#91897C]">On-chain Badges</p>
              {BADGES.map(({ name, desc }) => (
                <div key={name} className="mb-2 flex items-center gap-3 border border-[#91897C] p-3 opacity-40 last:mb-0">
                  <div className="h-6 w-6 shrink-0 border border-[#91897C]" />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#EEF083]">{name}</p>
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
