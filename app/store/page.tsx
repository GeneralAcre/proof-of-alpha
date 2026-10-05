"use client";

import { useState, useEffect } from "react";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { sendSolPayment, isTreasuryConfigured } from "../lib/sol-transfer";

type Pack = {
  id: string;
  name: string;
  aura: number;
  sol: number;
  badge?: string;
  desc: string;
};

const PACKS: Pack[] = [
  {
    id: "starter",
    name: "Starter Pack",
    aura: 300,
    sol: 0.01,
    desc: "Enough to approach a few girls and get a feel for the game.",
  },
  {
    id: "grinder",
    name: "Grinder Pack",
    aura: 1_000,
    sol: 0.025,
    desc: "Grind multiple sessions. Hit Rare girls without stressing the balance.",
  },
  {
    id: "chad",
    name: "Chad Pack",
    aura: 3_000,
    sol: 0.05,
    badge: "BEST VALUE",
    desc: "Approach Legendary girls repeatedly. Built for serious players.",
  },
  {
    id: "gigachad",
    name: "Gigachad Pack",
    aura: 10_000,
    sol: 0.10,
    desc: "Max fuel. Dominate leaderboards and unlock everything.",
  },
];

type BuyState = "idle" | "signing" | "confirming" | "done" | "error";

function auraKey(address: string | null | undefined) {
  return address ? `poa_aura_${address}` : "poa_aura_anonymous";
}

export default function StorePage() {
  const { account, selectedWallet } = useWallet();
  const walletAddr = account ? String(account.address) : null;
  const treasuryOk = isTreasuryConfigured();

  const [balance, setBalance] = useState(0);
  const [buyState, setBuyState] = useState<Record<string, BuyState>>({});
  const [txSigs, setTxSigs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(auraKey(walletAddr));
      setBalance(Number(raw ?? "0") || 0);
    } catch {}
  }, [walletAddr]);

  async function handleBuy(pack: Pack) {
    if (!account || !selectedWallet || !walletAddr) return;

    setBuyState((s) => ({ ...s, [pack.id]: "signing" }));
    setErrors((e) => ({ ...e, [pack.id]: "" }));

    try {
      setBuyState((s) => ({ ...s, [pack.id]: "confirming" }));
      const sig = await sendSolPayment(selectedWallet, account, pack.sol);

      // Server verifies the on-chain payment before awarding AURA
      const res = await fetch("/api/store-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerWallet: walletAddr, packId: pack.id, txSignature: sig }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Server rejected purchase");
      }

      const { aura } = await res.json() as { aura: number };
      const next = balance + aura;
      try { localStorage.setItem(auraKey(walletAddr), String(next)); } catch {}
      setBalance(next);
      setTxSigs((t) => ({ ...t, [pack.id]: sig }));
      setBuyState((s) => ({ ...s, [pack.id]: "done" }));
      setTimeout(() => setBuyState((s) => ({ ...s, [pack.id]: "idle" })), 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setErrors((e) => ({ ...e, [pack.id]: msg }));
      setBuyState((s) => ({ ...s, [pack.id]: "error" }));
      setTimeout(() => setBuyState((s) => ({ ...s, [pack.id]: "idle" })), 5000);
    }
  }

  function buttonLabel(pack: Pack): string {
    const state = buyState[pack.id] ?? "idle";
    if (state === "signing")    return "Approve in wallet...";
    if (state === "confirming") return "Confirming...";
    if (state === "done")       return `+${pack.aura.toLocaleString()} AURA added!`;
    if (state === "error")      return "Failed — try again";
    if (!account)               return "Connect Wallet";
    if (!treasuryOk)            return "Not Configured";
    return `Buy — ${pack.sol} SOL`;
  }

  function buttonStyle(pack: Pack): string {
    const state = buyState[pack.id] ?? "idle";
    if (state === "done")
      return "border-[#5e548e] bg-[#5e548e]/10 text-[#5e548e] cursor-default";
    if (state === "error")
      return "border-red-500 text-red-400 cursor-default";
    if (!account || !treasuryOk || (state !== "idle"))
      return "border-[#ddd6ea]/40 text-[#716a7e]/40 cursor-not-allowed";
    return "border-[#5e548e] bg-[#5e548e] text-white hover:bg-transparent hover:text-[#5e548e]";
  }

  const isActive = (pack: Pack) => {
    const s = buyState[pack.id] ?? "idle";
    return s === "signing" || s === "confirming";
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">
          AURA Store
        </p>
        <h1 className="mb-2 text-4xl font-black uppercase sm:text-5xl">Buy AURA</h1>
        <p className="mb-8 font-mono text-sm text-[#716a7e]">
          AURA is spent every time you approach a girl. Buy more to keep playing.
          Payments are real SOL transactions — confirmed on-chain.
        </p>

        {/* Treasury warning */}
        {!treasuryOk && (
          <div className="mb-6 border border-[#ddd6ea]/40 bg-[#716a7e]/5 px-5 py-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#716a7e]">
              Store temporarily unavailable
            </p>
            <p className="mt-1 text-xs text-[#716a7e]/80">
              AURA purchases are not available right now. Please check back soon or contact us at proofonchainalpha@gmail.com.
            </p>
          </div>
        )}

        {/* Balance */}
        <div className="mb-8 flex items-center justify-between border border-[#ddd6ea] bg-white px-5 py-4 shadow-[4px_4px_0_#716a7e]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">Your Balance</p>
            <p className="text-3xl font-black text-[#5e548e]">
              {balance.toLocaleString()} <span className="font-mono text-lg">AURA</span>
            </p>
          </div>
          {!account && (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#716a7e]">
              Connect wallet to buy
            </p>
          )}
        </div>

        {/* Packs grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => {
            const state = buyState[pack.id] ?? "idle";
            const sig = txSigs[pack.id];
            const err = errors[pack.id];
            return (
              <div
                key={pack.id}
                className={`relative flex flex-col border bg-white p-5 shadow-[4px_4px_0_#716a7e] transition ${
                  pack.badge ? "border-[#5e548e]" : "border-[#ddd6ea]"
                }`}
              >
                {pack.badge && (
                  <div className="absolute right-3 top-3 bg-[#5e548e] px-2 py-0.5">
                    <span className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#231942]">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#716a7e]">
                  {pack.name}
                </p>
                <p className="mb-1 text-3xl font-black text-[#5e548e]">
                  {pack.aura.toLocaleString()}
                </p>
                <p className="mb-3 font-mono text-xs text-[#716a7e]">AURA</p>

                <p className="mb-4 flex-1 text-xs leading-5 text-[#231942]">{pack.desc}</p>

                <div className="mb-3 border-t border-[#ddd6ea]/40 pt-3">
                  <p className="font-mono text-sm font-black text-[#5e548e]">{pack.sol} SOL</p>
                  <p className="font-mono text-[10px] text-[#716a7e]">Solana</p>
                </div>

                <button
                  className={`w-full border-2 py-3.5 font-mono text-[11px] font-black uppercase tracking-widest transition touch-manipulation ${buttonStyle(pack)}`}
                  disabled={!account || !treasuryOk || isActive(pack) || state === "done"}
                  onClick={() => handleBuy(pack)}
                  type="button"
                >
                  {isActive(pack) && (
                    <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                  )}
                  {buttonLabel(pack)}
                </button>

                {/* Tx confirmation link */}
                {state === "done" && sig && (
                  <a
                    href={`https://explorer.solana.com/tx/${sig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#716a7e] underline transition hover:text-[#5e548e]"
                  >
                    View on Explorer
                  </a>
                )}

                {/* Error message */}
                {state === "error" && err && (
                  <p className="mt-2 text-[10px] leading-4 text-red-400">{err}</p>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
