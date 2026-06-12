"use client";

import Image from "next/image";
import { useWallet } from "./WalletProvider";

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { account, wallets, connect, isConnecting, status } = useWallet();

  if (account) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0906] text-[#EEF083]">

      {/* Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(238,240,131,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(238,240,131,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">

        {/* Logo */}
        <Image src="/logo.svg" alt="Proof of Alpha" width={48} height={48} className="mb-6 opacity-80" />

        {/* Title */}
        <h1 className="mb-2 text-5xl font-black uppercase leading-[0.85] tracking-tight">
          Proof<br />of Alpha
        </h1>
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.22em] text-[#91897C]">
          Wallet required to continue
        </p>

        {/* Divider */}
        <div className="mb-6 w-full border-t border-[#91897C]/20" />

        {/* Wallet list */}
        {wallets.length > 0 ? (
          <div className="w-full space-y-2">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">
              Select your wallet
            </p>
            {wallets.map((w) => (
              <button
                key={w.name}
                className="w-full border-2 border-[#EEF083] bg-[#EEF083] px-6 py-3.5 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] disabled:opacity-50 touch-manipulation"
                disabled={isConnecting}
                onClick={() => connect(w)}
                type="button"
              >
                {isConnecting ? "Connecting…" : w.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full border border-[#91897C]/30 bg-[#1a1710] px-5 py-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#91897C]">
              No wallet detected
            </p>
            <p className="mt-2 text-sm leading-6 text-[#d8d4a1]">
              Install a Solana wallet like Phantom or Backpack, then refresh this page.
            </p>
          </div>
        )}

        {status && (
          <p className="mt-4 font-mono text-[10px] text-[#91897C]">{status}</p>
        )}

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[#91897C]/40">
          Proof of Alpha · Solana devnet
        </p>
      </div>
    </div>
  );
}
