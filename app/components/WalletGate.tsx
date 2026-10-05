"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";

const PUBLIC_PATHS = ["/privacy-policy", "/terms"];

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { account, wallets, connect, isConnecting, status, displayName } = useWallet();
  const path = usePathname();

  if (account || PUBLIC_PATHS.includes(path)) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f7fc] text-[#5e548e]">

      {/* Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(228,212,116,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(228,212,116,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">

        {/* Logo */}
        <Image src="/logo.svg" alt="Proof of Alpha" width={48} height={48} className="mb-6 opacity-80" />

        {/* Title */}
        <h1 className="mb-2 text-5xl font-black uppercase leading-[0.85] tracking-tight">
          Proof<br />of Alpha
        </h1>
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.22em] text-[#716a7e]">
          Wallet required to continue
        </p>

        {/* Divider */}
        <div className="mb-6 w-full border-t border-[#ddd6ea]/20" />

        {/* Wallet list */}
        {wallets.length > 0 ? (
          <div className="w-full space-y-2">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#716a7e]">
              Select your wallet
            </p>
            {wallets.map((w) => (
              <button
                key={w.name}
                className="w-full border-2 border-[#5e548e] bg-[#5e548e] px-6 py-3.5 font-mono text-sm font-black uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] disabled:opacity-50 touch-manipulation"
                disabled={isConnecting}
                onClick={() => connect(w)}
                type="button"
              >
                {isConnecting ? "Connecting…" : displayName(w)}
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full border border-[#ddd6ea]/30 bg-[#f3f0fa] px-5 py-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#716a7e]">
              No wallet detected
            </p>
            <p className="mt-2 text-sm leading-6 text-[#231942]">
              On Saga or Seeker, open any Solana wallet app first, then return here. On desktop, install Phantom or Backpack and refresh.
            </p>
          </div>
        )}

        {status && (
          <p className="mt-4 font-mono text-[10px] text-[#716a7e]">{status}</p>
        )}

        <p className="mt-6 font-mono text-xs text-[#231942]/40 leading-5 text-center">
          By connecting, you agree to our{" "}
          <Link href="/terms" className="whitespace-nowrap text-[#5e548e]/60 underline underline-offset-2 hover:text-[#5e548e] transition">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="whitespace-nowrap text-[#5e548e]/60 underline underline-offset-2 hover:text-[#5e548e] transition">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]/40">
          Proof of Alpha · Solana
        </p>
      </div>
    </div>
  );
}
