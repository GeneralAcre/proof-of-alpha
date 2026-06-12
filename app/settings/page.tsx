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
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-6">

        <div>
          <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
            Preferences
          </p>
          <h1 className="text-4xl font-black uppercase">Settings</h1>
        </div>

        {/* ── WALLET ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Wallet</p>
          </div>
          <div className="px-5 py-5">
            {account ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8]">Connected as</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-[#E4D474]">{truncatedAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="border border-[#a09ab8] px-4 py-2 font-mono text-xs uppercase text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
                      onClick={copyAddress}
                      type="button"
                    >
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <button
                      className="border border-[#a09ab8] px-4 py-2 font-mono text-xs uppercase text-[#a09ab8] transition hover:border-red-400 hover:text-red-400"
                      onClick={disconnect}
                      type="button"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#a09ab8] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8]">
                    Full address
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[#ffffff]">
                    {String(account.address)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#a09ab8]">No wallet connected.</p>
                <p className="font-mono text-xs text-[#a09ab8]">
                  Use the <span className="text-[#E4D474]">Connect Wallet</span> button in the nav above.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SOUND ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Audio</p>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black uppercase text-[#E4D474]">Sound Effects</p>
                <p className="mt-0.5 text-sm text-[#a09ab8]">Move confirms, round results, eliminations</p>
              </div>
              <button
                className={`h-7 w-14 border transition ${sound ? "border-[#E4D474] bg-[#E4D474]" : "border-[#a09ab8] bg-transparent"}`}
                onClick={() => setSound((s) => { setSoundEnabled(!s); return !s; })}
                type="button"
              >
                <span className={`block h-5 w-5 border transition-transform ${sound ? "translate-x-8 border-[#24153E] bg-[#24153E]" : "translate-x-1 border-[#a09ab8] bg-[#a09ab8]"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* ── ANIMATION SPEED ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Accessibility</p>
          </div>
          <div className="px-5 py-5">
            <p className="font-black uppercase text-[#E4D474]">Animation Speed</p>
            <p className="mt-0.5 mb-4 text-sm text-[#a09ab8]">
              Reduce or disable animations for epilepsy or motion sensitivity.
            </p>
            <div className="flex gap-2">
              {(["normal","fast","off"] as AnimSpeed[]).map((s) => (
                <button
                  key={s}
                  className={`border px-4 py-2 font-mono text-xs uppercase transition ${
                    animSpeed === s
                      ? "border-[#E4D474] bg-[#E4D474] text-[#24153E]"
                      : "border-[#a09ab8] text-[#E4D474] hover:border-[#E4D474]"
                  }`}
                  onClick={() => setAnimSpeed(s)}
                  type="button"
                >
                  {s === "off" ? "Disabled" : s}
                </button>
              ))}
            </div>
            {animSpeed === "off" && (
              <p className="mt-3 font-mono text-xs text-[#a09ab8]">
                All flip-in, stamp, and rank-up animations will be skipped.
              </p>
            )}
          </div>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Notifications</p>
          </div>
          <div className="divide-y divide-[#a09ab8]">
            {[
              { label: "Match win / loss result", sub: "Notify when a match you're in concludes", val: notifyWin, set: setNotifyWin },
              { label: "Rank up",                 sub: "Notify when you reach a new rank",        val: notifyRankUp, set: setNotifyRankUp },
              { label: "Room invite",             sub: "Notify when someone shares a room code",  val: notifyRoom, set: setNotifyRoom },
            ].map(({ label, sub, val, set }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-black uppercase text-[#E4D474]">{label}</p>
                  <p className="mt-0.5 text-sm text-[#a09ab8]">{sub}</p>
                </div>
                <button
                  className={`h-7 w-14 border transition ${val ? "border-[#E4D474] bg-[#E4D474]" : "border-[#a09ab8] bg-transparent"}`}
                  onClick={() => set((v: boolean) => !v)}
                  type="button"
                >
                  <span className={`block h-5 w-5 border transition-transform ${val ? "translate-x-8 border-[#24153E] bg-[#24153E]" : "translate-x-1 border-[#a09ab8] bg-[#a09ab8]"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRANSACTION HISTORY ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
              Transaction History
            </p>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">No transactions yet</p>
            <p className="mt-2 text-sm text-[#ffffff]">Sigma Points earned on-chain will appear here.</p>
          </div>
        </section>

        {/* ── DANGER ZONE ── */}
        <section className="border border-[#a09ab8] bg-[#2d1a4a] shadow-[4px_4px_0_#a09ab8]">
          <div className="border-b border-[#a09ab8] px-5 py-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">Danger Zone</p>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase text-[#E4D474]">Clear Local Data</p>
                <p className="mt-0.5 text-sm text-[#a09ab8]">Removes saved archetype preferences and UI state.</p>
              </div>
              <button
                className="border border-[#a09ab8] px-4 py-2 font-mono text-xs uppercase text-[#a09ab8] transition hover:border-red-400 hover:text-red-400"
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
            className="font-mono text-xs uppercase text-[#a09ab8] transition hover:text-[#E4D474]"
            href="/"
          >
            Back
          </Link>
        </div>

      </main>
    </div>
  );
}
