"use client";

import { useEffect, useMemo, useState } from "react";
import { MAGICBLOCK_GAME_PLAN } from "../lib/magicblock";

type Probe = {
  endpoint: string;
  label: string;
  latencyMs?: number;
  ok: boolean;
};

type MagicBlockStatusResponse = {
  checkedAt: string;
  probes: Probe[];
  ready: boolean;
};

type StatusState =
  | { status: "idle" | "loading"; data?: MagicBlockStatusResponse; error?: string }
  | { status: "ready"; data: MagicBlockStatusResponse; error?: string }
  | { status: "error"; data?: MagicBlockStatusResponse; error: string };

function getLatencyTone(latencyMs?: number) {
  if (latencyMs === undefined) {
    return "text-[#a09ab8]";
  }

  if (latencyMs < 500) {
    return "text-[#E4D474]";
  }

  if (latencyMs < 1400) {
    return "text-[#ffffff]";
  }

  return "text-[#a09ab8]";
}

export function MagicBlockStatus() {
  const [state, setState] = useState<StatusState>({ status: "idle" });

  async function fetchStatus() {
    const response = await fetch("/api/magicblock/status", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("MagicBlock status check failed.");
    }

    return (await response.json()) as MagicBlockStatusResponse;
  }

  async function refreshStatus() {
    setState((current) => ({ data: current.data, status: "loading" }));

    try {
      setState({ data: await fetchStatus(), status: "ready" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "MagicBlock status check failed.";
      setState((current) => ({ data: current.data, error: message, status: "error" }));
    }
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialStatus() {
      try {
        const data = await fetchStatus();

        if (isCurrent) {
          setState({ data, status: "ready" });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "MagicBlock status check failed.";

        if (isCurrent) {
          setState({ error: message, status: "error" });
        }
      }
    }

    void loadInitialStatus();

    return () => {
      isCurrent = false;
    };
  }, []);

  const headline = useMemo(() => {
    if (state.status === "loading" && !state.data) {
      return "Checking MagicBlock devnet";
    }

    if (state.data?.ready) {
      return "MagicBlock path ready";
    }

    if (state.status === "error") {
      return "MagicBlock path degraded";
    }

    return "MagicBlock path warming up";
  }, [state]);

  return (
    <section className="rounded-lg border border-[#a09ab8] bg-[#2d1a4a] p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#E4D474]">MagicBlock engine</p>
          <h2 className="mt-2 text-2xl font-black uppercase text-[#E4D474]">{headline}</h2>
        </div>
        <button
          className="rounded-lg border border-[#a09ab8] px-4 py-3 text-sm font-black uppercase text-[#E4D474] transition hover:bg-[#E4D474] hover:text-[#24153E] disabled:opacity-60"
          disabled={state.status === "loading"}
          onClick={refreshStatus}
          type="button"
        >
          {state.status === "loading" ? "Checking" : "Refresh"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {(state.data?.probes ?? []).map((probe) => (
          <div key={probe.label} className="rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a09ab8]">{probe.label}</p>
              <span className={`font-mono text-xs uppercase ${probe.ok ? "text-[#E4D474]" : "text-[#a09ab8]"}`}>
                {probe.ok ? "online" : "offline"}
              </span>
            </div>
            <p className={`mt-3 text-2xl font-black ${getLatencyTone(probe.latencyMs)}`}>
              {probe.latencyMs === undefined ? "--" : `${probe.latencyMs}ms`}
            </p>
          </div>
        ))}
      </div>

      {state.data?.probes.length ? null : (
        <div className="mt-5 rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4 text-sm leading-6 text-[#ffffff]">
          MagicBlock status will appear here after the first devnet check.
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MAGICBLOCK_GAME_PLAN.map((item) => (
          <article key={item.label} className="rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E4D474]">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#ffffff]">{item.detail}</p>
          </article>
        ))}
      </div>

      {state.status === "error" ? (
        <div className="mt-5 rounded-lg border border-[#a09ab8] bg-[#24153E]/70 p-4 text-sm leading-6 text-[#a09ab8]">
          {state.error} The game UI stays responsive and staged locally instead of blocking on a slow RPC.
        </div>
      ) : null}
    </section>
  );
}
