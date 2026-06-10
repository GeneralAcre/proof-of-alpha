"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
    <nav className="sticky top-0 z-20 border-b border-[#91897C]/30 bg-[#241F19]">

      {/* ── Main bar ── */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="font-mono text-sm font-black uppercase tracking-[0.22em] text-[#EEF083]"
        >
          Proof of Alpha
        </Link>

        {/* Desktop centre links */}
        <div className="hidden items-center gap-7 sm:flex">
          <Link
            href="/how-to-play"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]"
          >
            How to Play
          </Link>
          <Link
            href="/leaderboard"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]"
          >
            Leaderboard
          </Link>
          <Link
            href="/store"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#EEF083] transition hover:text-[#f5f6a5]"
          >
            Store
          </Link>
        </div>

        {/* Right — wallet + mobile menu toggle */}
        <div className="flex items-center gap-2">

          {account ? (
            /* Connected state */
            <>
              <Link
                href="/profile"
                className="hidden border border-[#91897C]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] sm:block"
              >
                {truncatedAddress}
              </Link>
              <button
                className="border border-[#91897C]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#91897C] transition hover:border-red-400 hover:text-red-400 touch-manipulation"
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
                className="border-2 border-[#EEF083] bg-[#EEF083] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
                onClick={() => setWalletOpen((v) => !v)}
                type="button"
              >
                Connect
              </button>

              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[#91897C] bg-[#241F19] shadow-[6px_6px_0_#3a342c]">
                  <div className="border-b border-[#91897C]/40 px-4 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
                      Select wallet
                    </p>
                  </div>
                  <div className="p-3">
                    {wallets.length > 0 ? (
                      <div className="grid gap-2">
                        {wallets.map((w) => (
                          <button
                            key={w.name}
                            className="w-full border border-[#EEF083] bg-[#EEF083] px-4 py-2.5 text-left font-mono text-xs font-black uppercase tracking-[0.12em] text-[#241F19] transition hover:bg-[#f5f6a5] disabled:opacity-50"
                            disabled={isConnecting}
                            onClick={() => connect(w)}
                            type="button"
                          >
                            {displayName(w)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-5 text-[#d8d4a1]">
                        No wallet detected. Install a Solana wallet and refresh.
                      </p>
                    )}
                    {status && (
                      <p className="mt-3 font-mono text-[10px] text-[#91897C]">{status}</p>
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
            <span className={`block h-px w-5 bg-[#91897C] transition-all ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[#91897C] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#91897C] transition-all ${menuOpen ? "translate-y-[-3.5px] -rotate-45" : ""}`} />
          </button>

        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="border-t border-[#91897C]/30 bg-[#241F19] px-4 pb-4 pt-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/how-to-play"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]"
              onClick={() => setMenuOpen(false)}
            >
              How to Play
            </Link>
            <Link
              href="/leaderboard"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/store"
              className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#EEF083] transition hover:text-[#f5f6a5]"
              onClick={() => setMenuOpen(false)}
            >
              Store
            </Link>
            {account && (
              <Link
                href="/profile"
                className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]"
                onClick={() => setMenuOpen(false)}
              >
                {truncatedAddress}
              </Link>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}
