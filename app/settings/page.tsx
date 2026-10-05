"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { setSoundEnabled, isSoundEnabled } from "../lib/sounds";

type AnimSpeed = "normal" | "fast" | "off";


export default function SettingsPage() {
  const { account, truncatedAddress, disconnect } = useWallet();

  const [sound, setSound] = useState(true);

  useEffect(() => { setSound(isSoundEnabled()); }, []);
  const [animSpeed, setAnimSpeed] = useState<AnimSpeed>("normal");
  const [notifyWin, setNotifyWin]     = useState(true);
  const [notifyRankUp, setNotifyRankUp] = useState(true);
  const [notifyRoom, setNotifyRoom]   = useState(false);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!account?.address) return;
    navigator.clipboard.writeText(String(account.address));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-[#5e548e]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-6">

        <div>
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">
            Preferences
          </p>
          <h1 className="text-4xl font-black uppercase">Settings</h1>
        </div>

        {/* ── WALLET ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">Wallet</p>
          </div>
          <div className="px-5 py-5">
            {account ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#716a7e]">Connected as</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-[#5e548e]">{truncatedAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-[#ddd6ea] px-4 py-2 font-mono text-xs uppercase text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e]"
                      onClick={copyAddress}
                      type="button"
                    >
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <button
                      className="rounded-full border border-[#ddd6ea] px-4 py-2 font-mono text-xs uppercase text-[#716a7e] transition hover:border-red-400 hover:text-red-400"
                      onClick={disconnect}
                      type="button"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#ddd6ea] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#716a7e]">
                    Full address
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[#231942]">
                    {String(account.address)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#716a7e]">No wallet connected.</p>
                <p className="font-mono text-xs text-[#716a7e]">
                  Use the <span className="text-[#5e548e]">Connect Wallet</span> button in the nav above.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SOUND ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">Audio</p>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black uppercase text-[#5e548e]">Sound Effects</p>
                <p className="mt-0.5 text-sm text-[#716a7e]">Move confirms, round results, eliminations</p>
              </div>
              <button
                className={`rounded-full h-7 w-14 border transition ${sound ? "border-[#5e548e] bg-[#5e548e]" : "border-[#ddd6ea] bg-transparent"}`}
                onClick={() => setSound((s) => { setSoundEnabled(!s); return !s; })}
                type="button"
              >
                <span className={`rounded-full block h-5 w-5 border transition-transform ${sound ? "translate-x-8 border-[#f8f7fc] bg-[#f8f7fc]" : "translate-x-1 border-[#ddd6ea] bg-[#716a7e]"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* ── ANIMATION SPEED ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">Accessibility</p>
          </div>
          <div className="px-5 py-5">
            <p className="font-black uppercase text-[#5e548e]">Animation Speed</p>
            <p className="mt-0.5 mb-4 text-sm text-[#716a7e]">
              Reduce or disable animations for epilepsy or motion sensitivity.
            </p>
            <div className="flex gap-2">
              {(["normal","fast","off"] as AnimSpeed[]).map((s) => (
                <button
                  key={s}
                  className={`rounded-full border px-4 py-2 font-mono text-xs uppercase transition ${
                    animSpeed === s
                      ? "border-[#5e548e] bg-[#5e548e] text-white"
                      : "border-[#ddd6ea] text-[#5e548e] hover:border-[#5e548e]"
                  }`}
                  onClick={() => setAnimSpeed(s)}
                  type="button"
                >
                  {s === "off" ? "Disabled" : s}
                </button>
              ))}
            </div>
            {animSpeed === "off" && (
              <p className="mt-3 font-mono text-xs text-[#716a7e]">
                All flip-in, stamp, and rank-up animations will be skipped.
              </p>
            )}
          </div>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">Notifications</p>
          </div>
          <div className="divide-y divide-[#716a7e]">
            {[
              { label: "Match win / loss result", sub: "Notify when a match you're in concludes", val: notifyWin, set: setNotifyWin },
              { label: "Rank up",                 sub: "Notify when you reach a new rank",        val: notifyRankUp, set: setNotifyRankUp },
              { label: "Room invite",             sub: "Notify when someone shares a room code",  val: notifyRoom, set: setNotifyRoom },
            ].map(({ label, sub, val, set }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-black uppercase text-[#5e548e]">{label}</p>
                  <p className="mt-0.5 text-sm text-[#716a7e]">{sub}</p>
                </div>
                <button
                  className={`rounded-full h-7 w-14 border transition ${val ? "border-[#5e548e] bg-[#5e548e]" : "border-[#ddd6ea] bg-transparent"}`}
                  onClick={() => set((v: boolean) => !v)}
                  type="button"
                >
                  <span className={`rounded-full block h-5 w-5 border transition-transform ${val ? "translate-x-8 border-[#f8f7fc] bg-[#f8f7fc]" : "translate-x-1 border-[#ddd6ea] bg-[#716a7e]"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRANSACTION HISTORY ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">
              Transaction History
            </p>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#716a7e]">No transactions yet</p>
            <p className="mt-2 text-sm text-[#231942]">Sigma Points earned on-chain will appear here.</p>
          </div>
        </section>

        {/* ── DANGER ZONE ── */}
        <section className="border border-[#ddd6ea] bg-white shadow-sm">
          <div className="border-b border-[#ddd6ea] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#716a7e]">Danger Zone</p>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase text-[#5e548e]">Clear Local Data</p>
                <p className="mt-0.5 text-sm text-[#716a7e]">Removes saved archetype preferences and UI state.</p>
              </div>
              <button
                className="rounded-full border border-[#ddd6ea] px-4 py-2 font-mono text-xs uppercase text-[#716a7e] transition hover:border-red-400 hover:text-red-400"
                onClick={() => {
                  localStorage.removeItem("poa_last_archetype");
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <div className="pb-8">
          <Link
            className="font-mono text-xs uppercase text-[#716a7e] transition hover:text-[#5e548e]"
            href="/"
          >
            Back
          </Link>
        </div>

      </main>
    </div>
  );
}
