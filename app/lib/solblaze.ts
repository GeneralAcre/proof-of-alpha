const BSOL_MINT    = "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1";
const MAINNET_RPC  = "https://api.mainnet-beta.solana.com";

export const BSOL_UNLOCK_AREAS  = ["vault", "islandDAO"]; // unlocked free for bSOL holders
export const SAURA_PER_BSOL     = 1000; // 1 bSOL = 1000 sAURA in-game credit

export function sauraKey(walletAddress: string): string {
  return `poa_saura_${walletAddress}`;
}

export async function getSauraBalance(walletAddress: string): Promise<number> {
  const bsol = await getBsolBalance(walletAddress);
  return Math.floor(bsol * SAURA_PER_BSOL);
}

export async function claimSaura(walletAddress: string): Promise<number> {
  const saura = await getSauraBalance(walletAddress);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(sauraKey(walletAddress), String(saura));
  }
  return saura;
}

export async function getBsolBalance(walletAddress: string): Promise<number> {
  try {
    const res = await fetch(MAINNET_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: BSOL_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    });
    const data = await res.json() as {
      result?: { value: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }[] }
    };
    const accounts = data.result?.value ?? [];
    if (accounts.length === 0) return 0;
    return accounts[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

export async function hasBsol(walletAddress: string): Promise<boolean> {
  const bal = await getBsolBalance(walletAddress);
  return bal > 0;
}
