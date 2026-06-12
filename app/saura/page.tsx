"use client";

import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { getBsolBalance } from "../lib/solblaze";

function UnlockRow({ active, title, desc }: { active: boolean; title: string; desc: string }) {
  return (
    <div
      className={`flex items-start gap-4 border p-4 ${
        active ? "border-[#9945FF]/30 bg-[#9945FF]/5" : "border-[#91897C]/20 opacity-40"
      }`}
    >
      <span className={`mt-0.5 h-3 w-3 shrink-0 ${active ? "bg-[#9945FF]" : "bg-[#91897C]/30"}`} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[#EEF083]">{title}</p>
        <p className="mt-1 font-mono text-[11px] leading-5 text-[#91897C]">{desc}</p>
      </div>
      <span className={`ml-auto shrink-0 font-mono text-[10px] font-black uppercase tracking-widest ${active ? "text-[#00FF9D]" : "text-[#91897C]"}`}>
        {active ? "Unlocked" : "Locked"}
      </span>
    </div>
  );
}

export default function SauraPage() {
  const { account } = useWallet();
  const addr = account ? String(account.address) : null;

  const [bsol,    setBsol]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!addr) return;
    void getBsolBalance(addr).then((bal) => { setBsol(bal); setChecked(true); });
  }, [addr]);

  async function handleRefresh() {
    if (!addr) return;
    setLoading(true);
    setChecked(false);
    try {
      const bal = await getBsolBalance(addr);
      setBsol(bal);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }

  const hasBSOL = bsol > 0;

  return (
    <div className="min-h-screen bg-[#0e0c09] text-[#EEF083]">
      <Nav />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
            SolBlaze · Liquid Staking
          </p>
          <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Staking</h1>
          <p className="mt-2 max-w-xl font-mono text-sm text-[#91897C]">
            Stake SOL on SolBlaze, hold bSOL in your wallet, and unlock exclusive map areas in
            Proof of Alpha — automatically, no extra transaction needed.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          <div className="border border-[#9945FF]/50 bg-[#9945FF]/5 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9945FF]/70">bSOL Balance</p>
            <p className="mt-2 font-mono text-4xl font-black text-[#9945FF]">
              {checked ? bsol.toFixed(4) : "—"}
            </p>
            <p className="mt-1 font-mono text-xs text-[#91897C]">Solana mainnet · SolBlaze pool</p>
          </div>

          <div className={`border p-6 ${hasBSOL ? "border-[#00FF9D]/40 bg-[#00FF9D]/5" : "border-[#91897C]/20 bg-[#241F19]"}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Map Access</p>
            <p className={`mt-2 font-mono text-4xl font-black uppercase ${hasBSOL ? "text-[#00FF9D]" : "text-[#91897C]"}`}>
              {hasBSOL ? "2 areas" : "0 areas"}
            </p>
            <p className="mt-1 font-mono text-xs text-[#91897C]">
              {hasBSOL ? "islandDAO + The Yacht Club unlocked" : "Hold bSOL to unlock areas"}
            </p>
          </div>

        </div>

        {/* Unlock list */}
        <div className="mb-8">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Areas unlocked by bSOL</p>
          <div className="space-y-2">
            <UnlockRow
              active={hasBSOL}
              title="islandDAO"
              desc="Exclusive area. AURA cannot buy access — bSOL holders only. Hard difficulty."
            />
            <UnlockRow
              active={hasBSOL}
              title="The Yacht Club"
              desc="Normally costs 300 AURA to unlock. Free for any bSOL holder."
            />
          </div>
        </div>

        {/* Refresh */}
        {addr && (
          <div className="mb-10 flex flex-wrap items-center gap-4">
            <button
              className="border-2 border-[#9945FF] bg-[#9945FF]/10 px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#9945FF] transition hover:bg-[#9945FF]/20 disabled:opacity-40 touch-manipulation"
              disabled={loading}
              onClick={handleRefresh}
              type="button"
            >
              {loading ? "Checking mainnet…" : "Refresh bSOL Balance"}
            </button>
            {checked && (
              <p className="font-mono text-xs text-[#91897C]">
                {hasBSOL
                  ? <span className="text-[#00FF9D]">bSOL detected — areas unlocked</span>
                  : "No bSOL found in this wallet"}
              </p>
            )}
          </div>
        )}

        <div className="mb-8 border-t border-[#91897C]/20" />

        {/* How it works */}
        <div className="mb-8">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">How it works</p>
          <div className="space-y-3 border border-[#91897C]/20 bg-[#241F19] p-6">
            {[
              "Stake SOL on SolBlaze — receive bSOL, a liquid staking token earning ~6% APY",
              "Connect your Solana wallet to Proof of Alpha",
              "Your bSOL balance is read from Solana mainnet on every session",
              "If balance > 0: islandDAO and The Yacht Club open automatically",
              "bSOL stays in your wallet — nothing is transferred or burned",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="mt-px font-mono text-[10px] font-black text-[#9945FF]/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-mono text-sm text-[#d8d4a1]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* APY banner */}
        <div className="flex items-center justify-between border border-[#9945FF]/30 bg-[#9945FF]/5 px-6 py-4">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[#9945FF]">SolBlaze Staking APY</p>
            <p className="mt-0.5 font-mono text-[11px] text-[#91897C]">
              Earn ~6% on your SOL while playing. bSOL auto-compounds — no action needed.
            </p>
          </div>
          <p className="font-mono text-3xl font-black text-[#9945FF]">~6%</p>
        </div>

      </main>
    </div>
  );
}
