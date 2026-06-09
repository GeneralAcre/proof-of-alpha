"use client";

import { useState } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";

type Filter = "all" | "week" | "month";
type Tab = "points" | "streak";

export default function LeaderboardPage() {
  const { account, truncatedAddress } = useWallet();
  const [filter, setFilter] = useState<Filter>("all");
  const [tab, setTab]       = useState<Tab>("points");

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Global ranking
        </p>
        <h1 className="mb-6 text-4xl font-black uppercase sm:text-5xl">Leaderboard</h1>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["all","week","month"] as Filter[]).map((f) => (
              <button
                key={f}
                className={`border px-3 py-1.5 font-mono text-xs uppercase transition ${
                  filter === f
                    ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                    : "border-[#91897C] text-[#EEF083] hover:border-[#EEF083]"
                }`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f === "all" ? "All Time" : f === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["points","streak"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`border px-3 py-1.5 font-mono text-xs uppercase transition ${
                  tab === t
                    ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                    : "border-[#91897C] text-[#EEF083] hover:border-[#EEF083]"
                }`}
                onClick={() => setTab(t)}
                type="button"
              >
                {t === "points" ? "Sigma Points" : "Win Streak"}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        <div className="border border-[#91897C] bg-[#2f2922] shadow-[6px_6px_0_#91897C]">
          <div className="grid grid-cols-[32px_1fr_60px_60px_80px_80px] items-center gap-3 border-b border-[#91897C] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#91897C]">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">WR</span>
            <span className="text-right">Matches</span>
            <span className="hidden text-right sm:block">Streak</span>
            <span className="text-right">{tab === "streak" ? "Streak" : "σ Points"}</span>
          </div>

          <div className="px-5 py-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No matches recorded yet</p>
            <p className="mt-2 text-sm text-[#d8d4a1]">Be the first to play and claim the top spot.</p>
          </div>

          {/* Your position */}
          {account && (
            <>
              <div className="border-t-2 border-[#EEF083] px-4 py-1.5">
                <p className="font-mono text-[10px] uppercase text-[#91897C]">Your position</p>
              </div>
              <div className="grid grid-cols-[32px_1fr_60px_60px_80px_80px] items-center gap-3 bg-[#EEF083]/5 px-4 py-3">
                <span className="font-mono text-xs font-black text-[#91897C]">—</span>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center border border-[#EEF083] font-mono text-[10px] font-black text-[#EEF083]">
                    ?
                  </div>
                  <div>
                    <p className="font-mono text-xs font-black text-[#EEF083]">{truncatedAddress ?? "You"}</p>
                    <p className="font-mono text-[10px] text-[#91897C]">No matches yet</p>
                  </div>
                </div>
                <span className="text-right font-mono text-xs text-[#91897C]">—</span>
                <span className="text-right font-mono text-xs text-[#91897C]">0</span>
                <span className="hidden text-right font-mono text-xs text-[#91897C] sm:block">—</span>
                <span className="text-right font-mono text-sm font-black text-[#91897C]">0</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
