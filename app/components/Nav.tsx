"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";

const NAV_LINKS = [
  { href: "/home",        label: "Home" },
  { href: "/profile",     label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/guilds",      label: "Gangs" },
  { href: "/store",       label: "Store" },
  { href: "/saura",       label: "Staking" },
];

function Logo() {
  return (
    <Link href="/home" className="flex items-center gap-2">
      <Image src="/logo.svg" alt="Proof of Alpha logo" width={24} height={24} />
      <span className="text-sm font-black uppercase leading-none tracking-tight text-[#231942]">
        Proof of Alpha
      </span>
    </Link>
  );
}

export function Nav() {
  const { account, truncatedAddress, disconnect, wallets, connect, isConnecting, status, displayName } = useWallet();
  const pathname = usePathname();
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[#ddd6ea] bg-[#f8f7fc]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[#f8f7fc]/60 sm:px-6 lg:px-8">

        {/* Hamburger — mobile only, left of logo */}
        <button
          className="-ml-1 mr-2 flex h-9 w-9 items-center justify-center rounded-md text-[#231942] transition-colors hover:bg-[#5e548e]/10 md:hidden"
          onClick={() => setMenuOpen(true)}
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Logo />

        {/* Desktop links — pills next to the logo */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                isActive(href)
                  ? "bg-[#5e548e]/10 text-[#231942]"
                  : "text-[#716a7e] hover:text-[#231942]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right — wallet */}
        <div className="ml-auto flex items-center gap-2">
          {account ? (
            <>
              <span className="flex h-9 items-center gap-2 rounded-full border border-[#ddd6ea] bg-white/60 px-3 font-mono text-xs text-[#231942]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_#34d39980]" />
                {truncatedAddress}
              </span>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md text-[#716a7e] transition-colors hover:bg-red-50 hover:text-red-500 touch-manipulation"
                onClick={disconnect}
                type="button"
                aria-label="Disconnect wallet"
                title="Disconnect"
              >
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex h-9 items-center rounded-full bg-[#5e548e] px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#231942] touch-manipulation"
                onClick={() => setWalletOpen((v) => !v)}
                type="button"
              >
                Connect
              </button>

              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-md border border-[#ddd6ea] bg-[#f8f7fc] shadow-lg">
                  <div className="border-b border-[#ddd6ea] px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#716a7e]">
                      Select wallet
                    </p>
                  </div>
                  <div className="p-3">
                    {wallets.length > 0 ? (
                      <div className="grid gap-2">
                        {wallets.map((w) => (
                          <button
                            key={w.name}
                            className="w-full rounded-md bg-[#5e548e] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#231942] disabled:opacity-50"
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
        </div>
      </header>

      {/* ── Mobile drawer — slides in from the left ── */}
      <div
        data-state={menuOpen ? "open" : "closed"}
        inert={!menuOpen}
        className="group fixed inset-0 z-50 md:hidden data-[state=closed]:pointer-events-none"
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100"
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="absolute inset-0 flex flex-col overflow-y-auto bg-[#f8f7fc] transition-transform duration-[260ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-data-[state=closed]:-translate-x-full group-data-[state=open]:translate-x-0"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#ddd6ea] px-4">
            <Logo />
            <button
              type="button"
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#231942] transition-colors hover:bg-[#5e548e]/10"
              onClick={() => setMenuOpen(false)}
            >
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav aria-label="Main navigation" className="flex flex-col gap-1.5 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
                  isActive(href)
                    ? "bg-[#5e548e]/10 text-[#231942]"
                    : "text-[#716a7e] hover:bg-[#5e548e]/5 hover:text-[#231942]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          {account && (
            <div className="mt-auto border-t border-[#ddd6ea] px-4 py-4">
              <span className="flex items-center gap-2 font-mono text-xs text-[#716a7e]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {truncatedAddress}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
