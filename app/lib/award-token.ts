import { createHmac, randomBytes } from "crypto";

type TokenPayload = {
  w: string;  // wallet
  a: number;  // aura amount
  n: string;  // nonce (prevents token reuse)
  e: number;  // expiry unix seconds
};

const TOKEN_TTL_SECONDS = 120; // 2 minutes — enough time to confirm on-chain

function secret(): string {
  const s = process.env.AWARD_HMAC_SECRET;
  if (!s) throw new Error("AWARD_HMAC_SECRET not configured");
  return s;
}

function sign(encoded: string): string {
  return createHmac("sha256", secret()).update(encoded).digest("hex");
}

export function createAwardToken(wallet: string, amount: number): string {
  const payload: TokenPayload = {
    w: wallet,
    a: amount,
    n: randomBytes(16).toString("hex"),
    e: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAwardToken(token: string): { wallet: string; amount: number } {
  const dot = token.lastIndexOf(".");
  if (dot < 0) throw new Error("Malformed token");
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (sig !== sign(encoded)) throw new Error("Invalid token signature");
  const payload: TokenPayload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (Math.floor(Date.now() / 1000) > payload.e) throw new Error("Token expired");
  return { wallet: payload.w, amount: payload.a };
}
