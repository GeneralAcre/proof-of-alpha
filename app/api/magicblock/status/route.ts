import { MAGICBLOCK_ENDPOINTS, MAGICBLOCK_PROGRAMS } from "@/app/lib/magicblock";

export const dynamic = "force-dynamic";

type RpcProbe = {
  endpoint: string;
  label: string;
  latencyMs?: number;
  ok: boolean;
  result?: unknown;
};

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

async function probeRpc(label: string, endpoint: string, method = "getHealth"): Promise<RpcProbe> {
  const startedAt = performance.now();
  const timeout = timeoutSignal(2200);

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        id: label,
        jsonrpc: "2.0",
        method,
      }),
      cache: "no-store",
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      signal: timeout.signal,
    });

    const body = (await response.json()) as { error?: unknown; result?: unknown };
    const latencyMs = Math.round(performance.now() - startedAt);

    return {
      endpoint,
      label,
      latencyMs,
      ok: response.ok && !body.error,
      result: body.result,
    };
  } catch {
    return {
      endpoint,
      label,
      latencyMs: Math.round(performance.now() - startedAt),
      ok: false,
    };
  } finally {
    timeout.clear();
  }
}

export async function GET() {
  const [router, er, base] = await Promise.all([
    probeRpc("Magic Router", MAGICBLOCK_ENDPOINTS.routerRpc, "getRoutes"),
    probeRpc("Ephemeral Rollup", MAGICBLOCK_ENDPOINTS.erRpc),
    probeRpc("Solana Devnet", MAGICBLOCK_ENDPOINTS.baseRpc),
  ]);

  return Response.json(
    {
      checkedAt: new Date().toISOString(),
      endpoints: MAGICBLOCK_ENDPOINTS,
      programs: MAGICBLOCK_PROGRAMS,
      probes: [router, er, base],
      ready: router.ok && er.ok && base.ok,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
