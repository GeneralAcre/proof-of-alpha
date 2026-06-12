"use client";

import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { getBsolBalance } from "../lib/solblaze";

function UnlockRow({ active, title, desc }: { active: boolean; title: string; desc: string }) {
  return (
    <div className={`flex items-start gap-4 border p-4 transition ${
      active
        ? "border-white/10 bg-white/5"
        : "border-white/5 bg-[#160c2c] opacity-50"
    }`}>
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${active ? "bg-[#E4D474]" : "bg-[#a09ab8]/40"}`} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-white">{title}</p>
        <p className="mt-1 font-mono text-[11px] leading-5 text-[#a09ab8]">{desc}</p>
      </div>
      <span className={`ml-auto shrink-0 font-mono text-[10px] font-black uppercase tracking-widest ${
        active ? "text-[#E4D474]" : "text-[#a09ab8]"
      }`}>
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
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">
            SolBlaze · Liquid Staking
          </p>
          <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Staking</h1>
          <p className="mt-2 max-w-xl font-mono text-sm text-[#a09ab8]">
            Stake SOL on SolBlaze, hold bSOL in your wallet, and unlock exclusive map areas in
            Proof of Alpha — automatically, no extra transaction needed.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          <div className="border border-white/10 bg-[#2d1a4a] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">bSOL Balance</p>
            <p className="mt-2 font-mono text-4xl font-black text-white">
              {checked ? bsol.toFixed(4) : "—"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="border border-[#9945FF]/40 bg-[#9945FF]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#9945FF]">bSOL</span>
              <p className="font-mono text-xs text-[#a09ab8]">Solana mainnet · SolBlaze</p>
            </div>
          </div>

          <div className={`border p-6 transition ${
            hasBSOL
              ? "border-[#E4D474]/30 bg-[#2d1a4a]"
              : "border-white/6 bg-[#160c2c]"
          }`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Map Access</p>
            <p className={`mt-2 font-mono text-4xl font-black uppercase ${hasBSOL ? "text-[#E4D474]" : "text-[#a09ab8]"}`}>
              {hasBSOL ? "2 areas" : "0 areas"}
            </p>
            <p className="mt-2 font-mono text-xs text-[#a09ab8]">
              {hasBSOL ? "islandDAO + The Yacht Club unlocked" : "Hold bSOL to unlock areas"}
            </p>
          </div>

        </div>

        {/* Unlock list */}
        <div className="mb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Areas unlocked by bSOL</p>
          <div className="space-y-2">
            <UnlockRow
              active={hasBSOL}
              title="islandDAO"
              desc="Exclusive area. AURA cannot buy access — bSOL holders only. Alpha difficulty."
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
              className="border border-[#E4D474] bg-[#E4D474]/10 px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#E4D474] transition hover:bg-[#E4D474]/20 disabled:opacity-40 touch-manipulation"
              disabled={loading}
              onClick={handleRefresh}
              type="button"
            >
              {loading ? "Checking mainnet…" : "Refresh bSOL Balance"}
            </button>
            {checked && (
              <p className="font-mono text-xs text-[#a09ab8]">
                {hasBSOL
                  ? <span className="text-[#E4D474]">bSOL detected — areas unlocked</span>
                  : "No bSOL found in this wallet"}
              </p>
            )}
          </div>
        )}

        <div className="mb-8 border-t border-white/6" />

        {/* How it works */}
        <div className="mb-8">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">How it works</p>
          <div className="space-y-0 border border-white/7 bg-[#160c2c] divide-y divide-white/5">
            {[
              "Stake SOL on SolBlaze — receive bSOL, a liquid staking token earning ~6% APY",
              "Connect your Solana wallet to Proof of Alpha",
              "Your bSOL balance is read from Solana mainnet on every session",
              "If balance > 0: islandDAO and The Yacht Club open automatically",
              "bSOL stays in your wallet — nothing is transferred or burned",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-px font-mono text-[10px] font-black text-[#E4D474]/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-mono text-sm text-[#ffffff]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* APY banner */}
        <div className="flex items-center justify-between border border-white/10 bg-[#2d1a4a] px-6 py-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="border border-[#9945FF]/40 bg-[#9945FF]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#9945FF]">SolBlaze</span>
              <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-white">Staking APY</p>
            </div>
            <p className="font-mono text-[11px] text-[#a09ab8]">
              Earn ~6% on your SOL while playing. bSOL auto-compounds — no action needed.
            </p>
          </div>
          <p className="font-mono text-3xl font-black text-[#E4D474] ml-6 shrink-0">~6%</p>
        </div>

      </main>
    </div>
  );
}
