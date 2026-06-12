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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E4D474]">Connect wallet</p>

      {account ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4 font-mono text-sm text-[#ffffff]">
            wallet: {selectedWallet?.name}
            <br />
            address: {truncatedAddress}
            <br />
            cluster: solana:devnet
          </div>
          <button
            className="rounded-lg border border-[#a09ab8] px-4 py-3 text-sm font-black uppercase text-[#E4D474] transition hover:bg-[#E4D474] hover:text-[#24153E]"
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
                className="rounded-lg border border-[#E4D474] bg-[#E4D474] px-4 py-3 text-left text-sm font-black uppercase text-[#24153E] transition hover:bg-[#ece880] disabled:opacity-60"
                disabled={isConnecting}
                key={wallet.name}
                onClick={() => connect(wallet)}
                type="button"
              >
                {displayName(wallet)}
                <span className="block text-xs font-semibold normal-case text-[#24153E]">
                  {isMobileWallet(wallet)
                    ? "Connect through Mobile Wallet Adapter"
                    : "Wallet Standard compatible"}
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4 text-sm leading-6 text-[#ffffff]">
              No wallet detected. Solana Mobile web support requires Android Chrome with a Mobile
              Wallet Adapter wallet installed.
              <a
                className="mt-3 block font-black uppercase text-[#E4D474] underline underline-offset-4"
                href="https://solanamobile.com/wallets"
              >
                Find a Solana Mobile wallet
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4 font-mono text-sm text-[#ffffff]">
        {status}
      </div>
    </div>
  );
}
