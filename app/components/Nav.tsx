"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "./WalletProvider";

export function Nav() {
  const { account, truncatedAddress, disconnect, wallets, connect, isConnecting, status, displayName } = useWallet();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (account) setOpen(false);
  }, [account]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#91897C] bg-[#241F19] px-4 py-4 font-mono text-xs font-black uppercase tracking-[0.18em] sm:px-6 lg:px-8">
      <Link className="text-[#EEF083]" href="/">
        Proof of Alpha
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="border border-[#91897C] px-3 py-2 text-[#EEF083] transition hover:bg-[#EEF083] hover:text-[#241F19]"
          href="/how-to-play"
        >
          How to Play
        </Link>
        <Link
          className="border border-[#91897C] px-3 py-2 text-[#EEF083] transition hover:bg-[#EEF083] hover:text-[#241F19]"
          href="/leaderboard"
        >
          Leaderboard
        </Link>

        {account ? (
          <>
            <Link
              className="border border-[#91897C] px-3 py-2 text-[#d8d4a1] transition hover:border-[#EEF083] hover:text-[#EEF083]"
              href="/profile"
            >
              {truncatedAddress}
            </Link>
            <Link
              className="border border-[#91897C] px-3 py-2 text-[#EEF083] transition hover:bg-[#EEF083] hover:text-[#241F19]"
              href="/settings"
            >
              Settings
            </Link>
            <button
              className="border border-[#91897C] px-3 py-2 text-[#91897C] transition hover:border-red-400 hover:text-red-400"
              onClick={disconnect}
              type="button"
            >
              Disconnect
            </button>
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              className="border-2 border-[#EEF083] bg-[#EEF083] px-4 py-2 text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083]"
              onClick={() => setOpen((v) => !v)}
              type="button"
            >
              Connect Wallet
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-64 border border-[#91897C] bg-[#241F19] shadow-[6px_6px_0_#91897C]">
                <div className="border-b border-[#91897C] px-4 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#91897C]">
                    Select wallet
                  </p>
                </div>
                <div className="p-3">
                  {wallets.length > 0 ? (
                    <div className="grid gap-2">
                      {wallets.map((w) => (
                        <button
                          key={w.name}
                          className="w-full border border-[#EEF083] bg-[#EEF083] px-4 py-2.5 text-left text-xs font-black uppercase text-[#241F19] transition hover:bg-[#f5f6a5] disabled:opacity-50"
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
                    <p className="mt-3 text-[10px] text-[#91897C]">{status}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
