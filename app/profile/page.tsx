"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank, getNextRank, getRankProgress } from "../lib/archetypes";
import { fetchPlayerAura } from "../lib/solana-client";
import { getOrInitAura, auraKey, saveAura } from "../lib/aura";
import { loadPlayerProfile, type PlayerRow } from "../lib/leaderboard";
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
  const [aura,        setAura]        = useState(0);
  const [auraLoading, setAuraLoading] = useState(false);
  const [records,     setRecords]     = useState<MatchRecord[]>([]);
  const [dbProfile,   setDbProfile]   = useState<PlayerRow | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [copiedAddr,  setCopiedAddr]  = useState(false);

  const fullAddress = account ? String(account.address) : null;

  useEffect(() => {
    const matchKey = fullAddress ? `poa_matches_${fullAddress}` : "poa_matches_anonymous";

    // Show cached value immediately (initialises to 200 for brand-new players)
    setAura(getOrInitAura(fullAddress));
    try {
      const raw = localStorage.getItem(matchKey);
      if (raw) setRecords(JSON.parse(raw) as MatchRecord[]);
    } catch {}

    // Fetch on-chain balance + Supabase profile as authoritative sources
    if (fullAddress) {
      setAuraLoading(true);
      Promise.all([
        fetchPlayerAura(new PublicKey(fullAddress)),
        loadPlayerProfile(fullAddress),
      ]).then(([state, profile]) => {
        if (state && state.balance > 0) {
          setAura(state.balance);
          saveAura(fullAddress, state.balance);
        }
        if (profile) setDbProfile(profile);
      }).finally(() => setAuraLoading(false));
    }
  }, [fullAddress]);

  const localStats = computeStats(records);

  // Supabase is the source of truth for aggregate counts; localStorage fills fav archetype
  const stats = {
    matches:     dbProfile?.matches_played ?? localStats.matches,
    wins:        dbProfile?.matches_won    ?? localStats.wins,
    losses:      (dbProfile?.matches_played ?? localStats.matches) - (dbProfile?.matches_won ?? localStats.wins),
    elims:       localStats.elims,
    favArchetype: localStats.favArchetype,
    bestStreak:  dbProfile?.best_streak   ?? localStats.bestStreak,
  };

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
    <div className="min-h-screen bg-[#f8f7fc] text-[#231942]">
      <Nav />
      <main className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-7 lg:px-10">
        <section className="relative mt-5 overflow-hidden rounded-2xl border border-[#e7e2ee] bg-white">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_18%_0%,rgba(109,40,217,0.10),transparent_60%)]" />
          <div className="relative h-36 border-b border-[#eeeaf3] bg-[linear-gradient(115deg,#f2eef9,#ffffff_60%,#f7f3fc)] sm:h-44">
            <div className="absolute right-5 top-5 grid grid-cols-3 divide-x divide-[#e7e2ee] overflow-hidden rounded-xl border border-[#e7e2ee] bg-white/90 sm:right-8">
              {[
                { label: "AURA", value: aura.toLocaleString() },
                { label: "MATCHES", value: String(stats.matches) },
                { label: "RANK", value: rank.name },
              ].map((item) => (
                <div key={item.label} className="min-w-[76px] px-3 py-2.5 sm:min-w-[104px] sm:px-4">
                  <p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#231942]/45">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-[#231942] sm:text-base">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="absolute bottom-[-38px] left-5 flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-white bg-[conic-gradient(from_35deg,#5e548e,#5e548e,#5e548e,#5e548e)] shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:bottom-[-48px] sm:left-8 sm:h-28 sm:w-28">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/30 font-mono text-lg font-black text-[#231942] sm:h-14 sm:w-14 sm:text-xl">{initials}</div>
            </div>
          </div>
          <div className="flex min-h-28 flex-wrap items-end justify-between gap-4 px-5 pb-5 pt-12 sm:px-8 sm:pb-6 sm:pl-40 sm:pt-5">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-[#231942]">{account ? (truncatedAddress ?? "Player") : "Your player profile"}</h1>
              <p className="mt-1 max-w-[min(70vw,620px)] truncate font-mono text-xs text-[#231942]/45">{fullAddress ?? "Connect your wallet to sync your on-chain stats"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fullAddress && <button onClick={copyAddress} type="button" className="rounded-lg border border-[#ddd6ea] px-3.5 py-2 text-xs font-semibold text-[#231942]/80 transition hover:border-white/30 hover:bg-[#f3f0f7]">{copiedAddr ? "Address copied" : "Copy address"}</button>}
              {account && <button onClick={copyProfileLink} type="button" className="rounded-lg bg-[#5e548e] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#5e548e]">{copied ? "Link copied" : "Share profile"}</button>}
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center gap-7 border-b border-[#e7e2ee] px-1">
          <span className="border-b-2 border-[#5e548e] px-1 pb-3 text-sm font-semibold text-[#231942]">Overview</span>
          <span className="px-1 pb-3 text-sm text-[#231942]/45">Match history</span>
          <span className="px-1 pb-3 text-sm text-[#231942]/45">Progress</span>
        </div>

        <section className="mt-6 rounded-2xl border border-[#e7e2ee] bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-sm font-semibold text-[#231942]">AURA progression</p><p className="mt-1 text-xs text-[#231942]/45">Your rank advances as your AURA grows.</p></div>
            <p className="font-mono text-sm"><span className="font-bold text-[#5e548e]">{aura.toLocaleString()} AURA</span>{auraLoading && <span className="ml-2 text-xs text-[#231942]/40">Syncing…</span>}{nextRank && !auraLoading && <span className="text-[#231942]/40"> / {rank.next?.toLocaleString()} to {nextRank.name}</span>}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eeeaf3]"><div className="h-full rounded-full bg-gradient-to-r from-[#5e548e] to-[#5e548e] transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#231942]/40 sm:text-[10px]">{["NPC","Beta","Alpha","Sigma","Gigachad"].map((r) => <span key={r}>{r}</span>)}</div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e2ee] bg-white">
          <div className="border-b border-[#e7e2ee] px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold tracking-wide text-[#231942]">Battle stats</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {([
              { label: "Matches played", value: stats.matches || "—" },
              { label: "Wins", value: stats.wins || "—" },
              { label: "Win rate", value: stats.matches ? `${Math.round((stats.wins / stats.matches) * 100)}%` : "—" },
              { label: "Favorite archetype", value: stats.favArchetype !== "—" ? stats.favArchetype.charAt(0).toUpperCase() + stats.favArchetype.slice(1) : "—" },
              { label: "Eliminations", value: stats.elims || "—" },
              { label: "Best streak", value: stats.bestStreak || "—" },
              { label: "Losses", value: stats.losses || "—" },
              { label: "Total AURA", value: aura ? `${aura.toLocaleString()}` : "—" },
            ] as const).map(({ label, value }) => (
              <div key={label} className="border-b border-r border-[#e7e2ee] p-4 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#231942]/40">{label}</p><p className="mt-2 text-xl font-bold text-[#231942] sm:text-2xl">{value}</p></div>
            ))}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e2ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#e7e2ee] px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold tracking-wide text-[#231942]">Recent matches</h2><span className="font-mono text-[10px] text-[#231942]/40">LAST {Math.min(records.length, 10)}</span></div>
          {records.length === 0 ? <div className="px-5 py-14 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#e7e2ee] bg-[#f8f7fc] text-lg text-[#5e548e]">?</div><p className="font-semibold text-[#231942]">No matches yet</p><p className="mt-1 text-sm text-[#231942]/45">Play your first battle to see your history here.</p></div> : records.slice(0, 10).map((r, i) => {
            const arch = ARCHETYPES.find((a) => a.id === r.archetype);
            const date = new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return <div key={i} className="flex items-center justify-between gap-3 border-b border-[#eeeaf3] px-5 py-4 last:border-b-0 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-md px-2 py-1 font-mono text-[9px] font-bold ${r.won ? "bg-emerald-400/10 text-emerald-300" : "bg-[#f3f0f7] text-[#231942]/50"}`}>{r.won ? "WIN" : "LOSS"}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#231942]">{arch?.name ?? r.archetype} <span className="font-normal text-[#231942]/40">· {r.mode}</span></p><p className="mt-1 text-xs text-[#231942]/40">{r.elims} eliminations · {date}</p></div></div><span className="shrink-0 font-mono text-sm font-semibold text-[#5e548e]">{r.earned >= 0 ? "+" : ""}{r.earned} AURA</span></div>;
          })}
        </section>
      </main>
    </div>
  );
}