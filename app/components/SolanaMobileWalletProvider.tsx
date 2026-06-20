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

    // Android WebView throws when querying 'local-network-access' because the
    // "Local Network Access Split" Chrome feature flag is off. Patch it to return
    // 'granted' so the MWA library can proceed without crashing.
    if (isCapacitor && typeof navigator !== "undefined" && navigator.permissions) {
      const _orig = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (desc: PermissionDescriptor) => {
        try {
          return _orig(desc).catch(() =>
            Promise.resolve({ state: "granted" } as PermissionStatus)
          );
        } catch {
          return Promise.resolve({ state: "granted" } as PermissionStatus);
        }
      };
    }

    if (isCapacitor) {
      registerWallet(new LocalSolanaMobileWalletAdapterWallet(config));
    } else {
      registerMwa(config);
    }

    hasRegisteredMwa = true;
  }, []);

  return null;
}
