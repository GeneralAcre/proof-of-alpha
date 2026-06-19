"use client";

import { useEffect } from "react";
import {
  LocalSolanaMobileWalletAdapterWallet,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
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
        uri: window.location.origin,
        icon: `${window.location.origin}/charecter/alpha-charecter.png`,
      },
      authorizationCache: createDefaultAuthorizationCache(),
      chains: [SOLANA_MAINNET_CHAIN] as const,
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    };

    // registerMwa() skips WebViews (isWebView check on the user agent).
    // The Capacitor APK runs in an Android WebView, so registerMwa() silently
    // registers nothing and the wallet list stays empty. When window.Capacitor
    // is present (set by the Capacitor runtime), bypass that guard and register
    // the local MWA wallet directly with the same config.
    const isCapacitor = !!(window as unknown as Record<string, unknown>)["Capacitor"];
    if (isCapacitor) {
      registerWallet(new LocalSolanaMobileWalletAdapterWallet(config));
    } else {
      registerMwa(config);
    }

    hasRegisteredMwa = true;
  }, []);

  return null;
}
