import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, Transaction } from "@solana/web3.js";

/** True when running inside the Capacitor Android shell on a Solana Mobile device. */
export function isSolanaMobile(): boolean {
  if (typeof window === "undefined") return false;
  return (
    // Capacitor sets this on the window object
    !!(window as unknown as Record<string, unknown>)["Capacitor"] ||
    /Android/i.test(navigator.userAgent)
  );
}

export type MWAWalletInfo = {
  publicKey: PublicKey;
  signAndSendTransaction: (tx: Transaction, recentBlockhash: string) => Promise<string>;
};

/**
 * Opens the Solana Mobile Wallet Adapter session, authorises the dApp,
 * and returns the wallet's public key + a signAndSendTransaction helper.
 */
export async function connectMWA(): Promise<MWAWalletInfo> {
  return transact(async (wallet) => {
    const authResult = await wallet.authorize({
      cluster: "mainnet-beta",
      identity: {
        name: "Proof of Alpha",
        uri: "https://proof-of-alpha-live.vercel.app",
        icon: "/charecter/alpha-charecter.png",
      },
    });

    const publicKey = new PublicKey(authResult.accounts[0].address);

    async function signAndSendTransaction(tx: Transaction, recentBlockhash: string): Promise<string> {
      tx.recentBlockhash = recentBlockhash;
      tx.feePayer = publicKey;

      const results = await wallet.signAndSendTransactions({
        transactions: [tx],
      });
      const sigBytes = results[0];
      return Buffer.from(sigBytes).toString("base64");
    }

    return { publicKey, signAndSendTransaction };
  });
}
