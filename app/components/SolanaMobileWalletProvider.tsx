"use client";

import { useEffect } from "react";
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from "@solana-mobile/wallet-standard-mobile";
import { SOLANA_DEVNET_CHAIN } from "@solana/wallet-standard-chains";

let hasRegisteredMwa = false;

export function SolanaMobileWalletProvider() {
  useEffect(() => {
    if (hasRegisteredMwa) {
      return;
    }

    // Solana Mobile web docs: register MWA in a non-SSR/client context.
    registerMwa({
      appIdentity: {
        name: "Proof of Alpha",
        uri: window.location.origin,
        icon: `${window.location.origin}/charecter/alpha-charecter.png`,
      },
      authorizationCache: createDefaultAuthorizationCache(),
      chains: [SOLANA_DEVNET_CHAIN],
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    });

    hasRegisteredMwa = true;
  }, []);

  return null;
}
