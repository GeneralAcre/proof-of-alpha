"use client";

import { useEffect } from "react";
import {
  LocalSolanaMobileWalletAdapterWallet,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  registerMwa,
} from "@solana-mobile/wallet-standard-mobile";
import { SOLANA_MAINNET_CHAIN } from "@solana/wallet-standard-chains";
import { registerWallet } from "@wallet-standard/wallet";

let hasRegisteredMwa = false;

export function SolanaMobileWalletProvider() {
  useEffect(() => {
    if (hasRegisteredMwa) {
      return;
    }

    const config = {
      appIdentity: {
        name: "Proof of Alpha",
        uri: "https://proof-of-alpha-live.vercel.app",
        icon: "https://proof-of-alpha-live.vercel.app/charecter/alpha-charecter.png",
      },
      authorizationCache: createDefaultAuthorizationCache(),
      chains: [SOLANA_MAINNET_CHAIN] as const,
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: async () => { /* handled by WalletGate UI */ },
    };

    // registerMwa() skips WebViews. Bypass its guard for the Capacitor APK by
    // registering LocalSolanaMobileWalletAdapterWallet directly.
    const isCapacitor =
      !!(window as unknown as Record<string, unknown>)["Capacitor"] ||
      /(WebView|; wv\))/i.test(navigator.userAgent);

    if (isCapacitor) {
      if (navigator.permissions) {
        // Unconditionally return 'granted' for all permission queries in Capacitor.
        // Android WebView may return 'prompt' for loopback-network, which causes
        // the MWA library to display a permission modal that doesn't work in WebView.
        navigator.permissions.query = () =>
          Promise.resolve({ state: "granted" } as PermissionStatus);
      }

      // window.blur doesn't fire when an Android Activity goes to background in
      // Capacitor. The MWA library's getDetectionPromise() waits up to 3 s for
      // window.blur to confirm the wallet app opened; bridge visibilitychange so
      // that detection succeeds instead of timing out with ERROR_WALLET_NOT_FOUND.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          window.dispatchEvent(new Event("blur"));
        }
      });

      registerWallet(new LocalSolanaMobileWalletAdapterWallet(config));
    } else {
      registerMwa(config);
    }

    hasRegisteredMwa = true;
  }, []);

  return null;
}
