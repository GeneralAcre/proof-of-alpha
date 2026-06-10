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
    if (!account || !selectedWallet) return;

    setBuyState((s) => ({ ...s, [pack.id]: "signing" }));
    setErrors((e) => ({ ...e, [pack.id]: "" }));

    try {
      setBuyState((s) => ({ ...s, [pack.id]: "confirming" }));
      const sig = await sendSolPayment(selectedWallet, account, pack.sol);

      // Award AURA locally after confirmed on-chain payment
      const next = balance + pack.aura;
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
      return "border-[#EEF083] bg-[#EEF083]/10 text-[#EEF083] cursor-default";
    if (state === "error")
      return "border-red-500 text-red-400 cursor-default";
    if (!account || !treasuryOk || (state !== "idle"))
      return "border-[#91897C]/40 text-[#91897C]/40 cursor-not-allowed";
    return "border-[#EEF083] bg-[#EEF083] text-[#241F19] hover:bg-transparent hover:text-[#EEF083]";
  }

  const isActive = (pack: Pack) => {
    const s = buyState[pack.id] ?? "idle";
    return s === "signing" || s === "confirming";
  };

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          AURA Store
        </p>
        <h1 className="mb-2 text-4xl font-black uppercase sm:text-5xl">Buy AURA</h1>
        <p className="mb-8 font-mono text-sm text-[#91897C]">
          AURA is spent every time you approach a girl. Buy more to keep playing.
          Payments are real devnet SOL transactions — confirmed on-chain.
        </p>

        {/* Treasury warning */}
        {!treasuryOk && (
          <div className="mb-6 border border-red-500/60 bg-red-500/10 px-5 py-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-red-400">
              Treasury not configured
            </p>
            <p className="mt-1 text-xs text-red-400/80">
              Add your wallet address to <code className="font-mono">.env.local</code> as{" "}
              <code className="font-mono">NEXT_PUBLIC_TREASURY=&lt;your-wallet&gt;</code> then restart the dev server.
            </p>
          </div>
        )}

        {/* Balance */}
        <div className="mb-8 flex items-center justify-between border border-[#91897C] bg-[#2f2922] px-5 py-4 shadow-[4px_4px_0_#91897C]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Your Balance</p>
            <p className="text-3xl font-black text-[#EEF083]">
              {balance.toLocaleString()} <span className="font-mono text-lg">AURA</span>
            </p>
          </div>
          {!account && (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#91897C]">
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
                className={`relative flex flex-col border bg-[#2f2922] p-5 shadow-[4px_4px_0_#91897C] transition ${
                  pack.badge ? "border-[#EEF083]" : "border-[#91897C]"
                }`}
              >
                {pack.badge && (
                  <div className="absolute right-3 top-3 bg-[#EEF083] px-2 py-0.5">
                    <span className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#241F19]">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
                  {pack.name}
                </p>
                <p className="mb-1 text-3xl font-black text-[#EEF083]">
                  {pack.aura.toLocaleString()}
                </p>
                <p className="mb-3 font-mono text-xs text-[#91897C]">AURA</p>

                <p className="mb-4 flex-1 text-xs leading-5 text-[#d8d4a1]">{pack.desc}</p>

                <div className="mb-3 border-t border-[#91897C]/40 pt-3">
                  <p className="font-mono text-sm font-black text-[#EEF083]">{pack.sol} SOL</p>
                  <p className="font-mono text-[10px] text-[#91897C]">Solana devnet</p>
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
                    href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#91897C] underline transition hover:text-[#EEF083]"
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
