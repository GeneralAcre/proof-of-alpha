"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { getWallets } from "@wallet-standard/app";
import type {
  StandardConnectFeature,
  StandardDisconnectFeature,
  StandardEventsFeature,
} from "@wallet-standard/features";
import { StandardConnect, StandardDisconnect, StandardEvents } from "@wallet-standard/features";
import {
  SolanaMobileWalletAdapterWalletName,
  SolanaMobileWalletAdapterRemoteWalletName,
} from "@solana-mobile/wallet-standard-mobile";

export type WalletContextValue = {
  wallets: readonly Wallet[];
  selectedWallet: Wallet | undefined;
  account: WalletAccount | undefined;
  status: string;
  isConnecting: boolean;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
  truncatedAddress: string | undefined;
  isMobileWallet: (wallet: Wallet) => boolean;
  displayName: (wallet: Wallet) => string;
};

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function isSolanaMobileWallet(wallet: Wallet) {
  return (
    wallet.name === SolanaMobileWalletAdapterWalletName ||
    wallet.name === SolanaMobileWalletAdapterRemoteWalletName
  );
}

function getConnectFeature(wallet: Wallet) {
  return (wallet.features as Partial<StandardConnectFeature>)[StandardConnect];
}

function getDisconnectFeature(wallet: Wallet) {
  return (wallet.features as Partial<StandardDisconnectFeature>)[StandardDisconnect];
}

function getEventsFeature(wallet: Wallet) {
  return (wallet.features as Partial<StandardEventsFeature>)[StandardEvents];
}

const WalletContext = createContext<WalletContextValue>({
  wallets: [],
  selectedWallet: undefined,
  account: undefined,
  status: "Connect a Solana wallet to begin.",
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  truncatedAddress: undefined,
  isMobileWallet: isSolanaMobileWallet,
  displayName: (w) => w.name,
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const walletsApi = useMemo(() => getWallets(), []);
  const [wallets, setWallets] = useState<readonly Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>();
  const [account, setAccount] = useState<WalletAccount | undefined>();
  const [status, setStatus] = useState("Connect a Solana wallet to begin.");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const refresh = () => setWallets(walletsApi.get());
    refresh();
    const unreg = walletsApi.on("register", refresh);
    const unlisten = walletsApi.on("unregister", refresh);
    return () => {
      unreg();
      unlisten();
    };
  }, [walletsApi]);

  useEffect(() => {
    if (!selectedWallet) return;
    const events = getEventsFeature(selectedWallet);
    if (!events) return;
    return events.on("change", ({ accounts }) => {
      if (!accounts) return;
      const next = accounts[0];
      setAccount(next);
      if (!next) {
        setSelectedWallet(undefined);
        setStatus("Wallet disconnected.");
      }
    });
  }, [selectedWallet]);

  const connectableWallets = useMemo(
    () =>
      wallets
        .filter((w) => getConnectFeature(w))
        .sort((a, b) => Number(isSolanaMobileWallet(b)) - Number(isSolanaMobileWallet(a))),
    [wallets],
  );

  const connect = useCallback(async (wallet: Wallet) => {
    const feature = getConnectFeature(wallet);
    if (!feature) {
      setStatus(`${wallet.name} does not support Wallet Standard connect.`);
      return;
    }
    setIsConnecting(true);
    setStatus(`Connecting ${isSolanaMobileWallet(wallet) ? "mobile wallet" : wallet.name}...`);
    try {
      const result = await feature.connect({ silent: false });
      const next = result.accounts[0];
      if (!next) {
        setStatus("Connected but no account was authorized.");
        return;
      }
      setSelectedWallet(wallet);
      setAccount(next);
      setStatus("Authorized on devnet.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Connection rejected or failed.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!selectedWallet) return;
    try {
      await getDisconnectFeature(selectedWallet)?.disconnect();
    } finally {
      setSelectedWallet(undefined);
      setAccount(undefined);
      setStatus("Wallet disconnected.");
    }
  }, [selectedWallet]);

  return (
    <WalletContext.Provider
      value={{
        wallets: connectableWallets,
        selectedWallet,
        account,
        status,
        isConnecting,
        connect,
        disconnect,
        truncatedAddress: account ? truncateAddress(account.address) : undefined,
        isMobileWallet: isSolanaMobileWallet,
        displayName: (w) => (isSolanaMobileWallet(w) ? "Use Installed Wallet" : w.name),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
