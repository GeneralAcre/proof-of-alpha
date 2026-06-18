"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";

const PUBLIC_PATHS = ["/privacy-policy", "/terms"];

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { account, wallets, connect, isConnecting, status } = useWallet();
  const path = usePathname();

  if (account || PUBLIC_PATHS.includes(path)) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#000F08] text-[#E4D474]">

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
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.22em] text-[#a09ab8]">
          Wallet required to continue
        </p>

        {/* Divider */}
        <div className="mb-6 w-full border-t border-[#a09ab8]/20" />

        {/* Wallet list */}
        {wallets.length > 0 ? (
          <div className="w-full space-y-2">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">
              Select your wallet
            </p>
            {wallets.map((w) => (
              <button
                key={w.name}
                className="w-full border-2 border-[#E4D474] bg-[#E4D474] px-6 py-3.5 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] disabled:opacity-50 touch-manipulation"
                disabled={isConnecting}
                onClick={() => connect(w)}
                type="button"
              >
                {isConnecting ? "Connecting…" : w.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full border border-[#a09ab8]/30 bg-[#160c2c] px-5 py-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#a09ab8]">
              No wallet detected
            </p>
            <p className="mt-2 text-sm leading-6 text-[#ffffff]">
              Install a Solana wallet like Phantom or Backpack, then refresh this page.
            </p>
          </div>
        )}

        {status && (
          <p className="mt-4 font-mono text-[10px] text-[#a09ab8]">{status}</p>
        )}

        <p className="mt-6 font-mono text-[10px] text-[#ffffff]/40 leading-5">
          By connecting, you agree to our{" "}
          <Link href="/terms" className="whitespace-nowrap text-[#E4D474]/60 underline underline-offset-2 hover:text-[#E4D474] transition">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="whitespace-nowrap text-[#E4D474]/60 underline underline-offset-2 hover:text-[#E4D474] transition">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a09ab8]/40">
          Proof of Alpha · Solana
        </p>
      </div>
    </div>
  );
}
