"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "./WalletProvider";

export function Nav() {
  const { account, truncatedAddress, disconnect, wallets, connect, isConnecting, status, displayName } = useWallet();
  const [walletOpen, setWalletOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]     = useState(false);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { if (account) setWalletOpen(false); }, [account]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
    }
    if (walletOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [walletOpen]);

  return (
    <nav className="sticky top-0 z-20 border-b border-[#a09ab8]/30 bg-[#24153E]">

      {/* ── Main bar ── */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/">
          <Image src="/logo.svg" alt="Proof of Alpha" width={40} height={40} />
        </Link>

        {/* Desktop centre links */}
        <div className="hidden items-center gap-7 sm:flex">
          <Link
            href="/profile"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
          >
            Profile
          </Link>
          <Link
            href="/saura"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9945FF] transition hover:text-[#b47aff]"
          >
            Staking
          </Link>
          <Link
            href="/leaderboard"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
          >
            Leaderboard
          </Link>
          <Link
            href="/guilds"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
          >
            Gangs
          </Link>
          <Link
            href="/store"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#E4D474] transition hover:text-[#ece880]"
          >
            Store
          </Link>
        </div>

        {/* Right — wallet + mobile menu toggle */}
        <div className="flex items-center gap-2">

          {account ? (
            /* Connected state */
            <>
              <span className="hidden border border-[#a09ab8]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#a09ab8] sm:block">
                {truncatedAddress}
              </span>
              <button
                className="border border-[#a09ab8]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#a09ab8] transition hover:border-red-400 hover:text-red-400 touch-manipulation"
                onClick={disconnect}
                type="button"
              >
                Disconnect
              </button>
            </>
          ) : (
            /* Disconnected — connect dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                className="border-2 border-[#E4D474] bg-[#E4D474] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#24153E] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
                onClick={() => setWalletOpen((v) => !v)}
                type="button"
              >
                Connect
              </button>

              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[#a09ab8] bg-[#24153E] shadow-[6px_6px_0_#170b2e]">
                  <div className="border-b border-[#a09ab8]/40 px-4 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">
                      Select wallet
                    </p>
                  </div>
                  <div className="p-3">
                    {wallets.length > 0 ? (
                      <div className="grid gap-2">
                        {wallets.map((w) => (
                          <button
                            key={w.name}
                            className="w-full border border-[#E4D474] bg-[#E4D474] px-4 py-2.5 text-left font-mono text-xs font-black uppercase tracking-[0.12em] text-[#24153E] transition hover:bg-[#ece880] disabled:opacity-50"
                            disabled={isConnecting}
                            onClick={() => connect(w)}
                            type="button"
                          >
                            {displayName(w)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-5 text-[#ffffff]">
                        No wallet detected. Install a Solana wallet and refresh.
                      </p>
                    )}
                    {status && (
                      <p className="mt-3 font-mono text-[10px] text-[#a09ab8]">{status}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="ml-1 flex h-8 w-8 flex-col items-center justify-center gap-1.5 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
            aria-label="Menu"
          >
            <span className={`block h-px w-5 bg-[#a09ab8] transition-all ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[#a09ab8] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#a09ab8] transition-all ${menuOpen ? "translate-y-[-3.5px] -rotate-45" : ""}`} />
          </button>

        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="border-t border-[#a09ab8]/30 bg-[#24153E] px-4 pb-4 pt-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/profile"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/saura"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#9945FF] transition hover:text-[#b47aff]"
              onClick={() => setMenuOpen(false)}
            >
              Staking
            </Link>
            <Link
              href="/leaderboard"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/guilds"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#a09ab8] transition hover:text-[#E4D474]"
              onClick={() => setMenuOpen(false)}
            >
              Gangs
            </Link>
            <Link
              href="/store"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#E4D474] transition hover:text-[#ece880]"
              onClick={() => setMenuOpen(false)}
            >
              Store
            </Link>
            {account && (
              <span className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#a09ab8]">
                {truncatedAddress}
              </span>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}
