"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";

type AnimSpeed = "normal" | "fast" | "off";


export default function SettingsPage() {
  const { account, truncatedAddress, disconnect } = useWallet();

  const [sound, setSound] = useState(true);
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
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        <div>
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
            Preferences
          </p>
          <h1 className="text-4xl font-black uppercase">Settings</h1>
        </div>

        {/* ── WALLET ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Wallet</p>
          </div>
          <div className="px-5 py-5">
            {account ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C]">Connected as</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-[#EEF083]">{truncatedAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="border border-[#91897C] px-4 py-2 font-mono text-xs uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]"
                      onClick={copyAddress}
                      type="button"
                    >
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <button
                      className="border border-[#91897C] px-4 py-2 font-mono text-xs uppercase text-[#91897C] transition hover:border-red-400 hover:text-red-400"
                      onClick={disconnect}
                      type="button"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#91897C] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C]">
                    Full address
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[#d8d4a1]">
                    {String(account.address)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#91897C]">No wallet connected.</p>
                <p className="font-mono text-xs text-[#91897C]">
                  Use the <span className="text-[#EEF083]">Connect Wallet</span> button in the nav above.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SOUND ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Audio</p>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black uppercase text-[#EEF083]">Sound Effects</p>
                <p className="mt-0.5 text-sm text-[#91897C]">Move confirms, round results, eliminations</p>
              </div>
              <button
                className={`h-7 w-14 border transition ${sound ? "border-[#EEF083] bg-[#EEF083]" : "border-[#91897C] bg-transparent"}`}
                onClick={() => setSound((s) => !s)}
                type="button"
              >
                <span className={`block h-5 w-5 border transition-transform ${sound ? "translate-x-8 border-[#241F19] bg-[#241F19]" : "translate-x-1 border-[#91897C] bg-[#91897C]"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* ── ANIMATION SPEED ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Accessibility</p>
          </div>
          <div className="px-5 py-5">
            <p className="font-black uppercase text-[#EEF083]">Animation Speed</p>
            <p className="mt-0.5 mb-4 text-sm text-[#91897C]">
              Reduce or disable animations for epilepsy or motion sensitivity.
            </p>
            <div className="flex gap-2">
              {(["normal","fast","off"] as AnimSpeed[]).map((s) => (
                <button
                  key={s}
                  className={`border px-4 py-2 font-mono text-xs uppercase transition ${
                    animSpeed === s
                      ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                      : "border-[#91897C] text-[#EEF083] hover:border-[#EEF083]"
                  }`}
                  onClick={() => setAnimSpeed(s)}
                  type="button"
                >
                  {s === "off" ? "Disabled" : s}
                </button>
              ))}
            </div>
            {animSpeed === "off" && (
              <p className="mt-3 font-mono text-xs text-[#91897C]">
                All flip-in, stamp, and rank-up animations will be skipped.
              </p>
            )}
          </div>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Notifications</p>
          </div>
          <div className="divide-y divide-[#91897C]">
            {[
              { label: "Match win / loss result", sub: "Notify when a match you're in concludes", val: notifyWin, set: setNotifyWin },
              { label: "Rank up",                 sub: "Notify when you reach a new rank",        val: notifyRankUp, set: setNotifyRankUp },
              { label: "Room invite",             sub: "Notify when someone shares a room code",  val: notifyRoom, set: setNotifyRoom },
            ].map(({ label, sub, val, set }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-black uppercase text-[#EEF083]">{label}</p>
                  <p className="mt-0.5 text-sm text-[#91897C]">{sub}</p>
                </div>
                <button
                  className={`h-7 w-14 border transition ${val ? "border-[#EEF083] bg-[#EEF083]" : "border-[#91897C] bg-transparent"}`}
                  onClick={() => set((v: boolean) => !v)}
                  type="button"
                >
                  <span className={`block h-5 w-5 border transition-transform ${val ? "translate-x-8 border-[#241F19] bg-[#241F19]" : "translate-x-1 border-[#91897C] bg-[#91897C]"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRANSACTION HISTORY ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Transaction History
            </p>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">No transactions yet</p>
            <p className="mt-2 text-sm text-[#d8d4a1]">Sigma Points earned on-chain will appear here.</p>
          </div>
        </section>

        {/* ── DANGER ZONE ── */}
        <section className="border border-[#91897C] bg-[#2f2922] shadow-[4px_4px_0_#91897C]">
          <div className="border-b border-[#91897C] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">Danger Zone</p>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase text-[#EEF083]">Clear Local Data</p>
                <p className="mt-0.5 text-sm text-[#91897C]">Removes saved archetype preferences and UI state.</p>
              </div>
              <button
                className="border border-[#91897C] px-4 py-2 font-mono text-xs uppercase text-[#91897C] transition hover:border-red-400 hover:text-red-400"
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
            className="font-mono text-xs uppercase text-[#91897C] transition hover:text-[#EEF083]"
            href="/"
          >
            ← Back
          </Link>
        </div>

      </main>
    </div>
  );
}
