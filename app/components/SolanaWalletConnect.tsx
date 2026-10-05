"use client";

import { useEffect } from "react";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { useWallet } from "./WalletProvider";

type SolanaWalletConnectProps = {
  onAccountChange?: (account: WalletAccount | undefined, wallet: Wallet | undefined) => void;
};

export function SolanaWalletConnect({ onAccountChange }: SolanaWalletConnectProps) {
  const {
    wallets,
    account,
    selectedWallet,
    status,
    isConnecting,
    connect,
    disconnect,
    truncatedAddress,
    isMobileWallet,
    displayName,
  } = useWallet();

  useEffect(() => {
    onAccountChange?.(account, selectedWallet);
  }, [account, onAccountChange, selectedWallet]);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5e548e]">Connect wallet</p>

      {account ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-lg border border-[#ddd6ea] bg-[#f8f7fc]/70 p-4 font-mono text-sm text-[#231942]">
            wallet: {selectedWallet?.name}
            <br />
            address: {truncatedAddress}
            <br />
            cluster: solana:mainnet
          </div>
          <button
            className="rounded-lg border border-[#ddd6ea] px-4 py-3 text-sm font-black uppercase text-[#5e548e] transition hover:bg-[#5e548e] hover:text-white"
            onClick={disconnect}
            type="button"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <button
                className="rounded-lg border border-[#5e548e] bg-[#5e548e] px-4 py-3 text-left text-sm font-black uppercase text-white transition hover:bg-[#5e548e] disabled:opacity-60"
                disabled={isConnecting}
                key={wallet.name}
                onClick={() => connect(wallet)}
                type="button"
              >
                {displayName(wallet)}
                <span className="block text-xs font-semibold normal-case text-[#231942]">
                  {isMobileWallet(wallet)
                    ? "Connect through Mobile Wallet Adapter"
                    : "Wallet Standard compatible"}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-[#ddd6ea] bg-[#f8f7fc]/70 p-4 text-sm leading-6 text-[#231942]">
              No wallet detected. Solana Mobile web support requires Android Chrome with a Mobile
              Wallet Adapter wallet installed.
              <a
                className="mt-3 block font-black uppercase text-[#5e548e] underline underline-offset-4"
                href="https://solanamobile.com/wallets"
              >
                Find a Solana Mobile wallet
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-[#ddd6ea] bg-[#f8f7fc]/70 p-4 font-mono text-sm text-[#231942]">
        {status}
      </div>
    </div>
  );
}
