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
    <nav className="sticky top-0 z-20 border-b border-[#ddd6ea]/30 bg-[#f8f7fc]">

      {/* ── Main bar ── */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/home">
          <Image src="/logo.svg" alt="Proof of Alpha" width={40} height={40} />
        </Link>

        {/* Desktop centre links */}
        <div className="hidden items-center gap-7 sm:flex">
          {[
            { href: "/home",        label: "Home" },
            { href: "/profile",     label: "Profile" },
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/guilds",      label: "Gangs" },
            { href: "/store",       label: "Store" },
            { href: "/saura",       label: "Staking" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#231942] transition hover:text-[#5e548e]"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right — wallet + mobile menu toggle */}
        <div className="flex items-center gap-2">

          {account ? (
            /* Connected state */
            <>
              <span className="hidden border border-[#ddd6ea]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#716a7e] sm:block">
                {truncatedAddress}
              </span>
              <button
                className="border border-[#ddd6ea]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#716a7e] transition hover:border-red-400 hover:text-red-400 touch-manipulation"
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
                className="border-2 border-[#5e548e] bg-[#5e548e] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
                onClick={() => setWalletOpen((v) => !v)}
                type="button"
              >
                Connect
              </button>

              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[#ddd6ea] bg-[#f8f7fc] shadow-[6px_6px_0_#170b2e]">
                  <div className="border-b border-[#ddd6ea]/40 px-4 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#716a7e]">
                      Select wallet
                    </p>
                  </div>
                  <div className="p-3">
                    {wallets.length > 0 ? (
                      <div className="grid gap-2">
                        {wallets.map((w) => (
                          <button
                            key={w.name}
                            className="w-full border border-[#5e548e] bg-[#5e548e] px-4 py-2.5 text-left font-mono text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#5e548e] disabled:opacity-50"
                            disabled={isConnecting}
                            onClick={() => connect(w)}
                            type="button"
                          >
                            {displayName(w)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-5 text-[#231942]">
                        No wallet detected. Install a Solana wallet and refresh.
                      </p>
                    )}
                    {status && (
                      <p className="mt-3 font-mono text-[10px] text-[#716a7e]">{status}</p>
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
            <span className={`block h-px w-5 bg-[#716a7e] transition-all ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[#716a7e] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#716a7e] transition-all ${menuOpen ? "translate-y-[-3.5px] -rotate-45" : ""}`} />
          </button>

        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="border-t border-[#ddd6ea]/30 bg-[#f8f7fc] px-4 pb-4 pt-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {[
              { href: "/home",        label: "Home" },
              { href: "/profile",     label: "Profile" },
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/guilds",      label: "Gangs" },
              { href: "/store",       label: "Store" },
              { href: "/saura",       label: "Staking" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#231942] transition hover:text-[#5e548e]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {account && (
              <span className="py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[#716a7e]">
                {truncatedAddress}
              </span>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}
