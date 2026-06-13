"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { supabase, supabaseReady } from "../lib/supabase";
import { getBsolBalance } from "../lib/solblaze";
import {
  loadGuilds,
  getGuildAura,
  createGuild,
  joinGuild,
  leaveGuild,
  BSOL_CREATE_REQUIRED,
  type Guild,
} from "../lib/guilds";

export default function GuildsPage() {
  const { account } = useWallet();
  const addr = account ? String(account.address) : null;

  const [guilds,     setGuilds]     = useState<Guild[]>([]);
  const [myGuild,    setMyGuild]    = useState<Guild | null>(null);
  const [bsol,       setBsol]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name,       setName]       = useState("");
  const [tag,        setTag]        = useState("");
  const [motto,      setMotto]      = useState("");
  const [error,      setError]      = useState("");
  const [joining,    setJoining]    = useState<string | null>(null);

  async function refresh() {
    const all = await loadGuilds();
    const sorted = all.sort((a, b) => getGuildAura(b) - getGuildAura(a));
    setGuilds(sorted);
    if (addr) {
      setMyGuild(sorted.find((g) => g.members.includes(addr)) ?? null);
      const bal = await getBsolBalance(addr);
      setBsol(bal);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();

    if (!supabaseReady) return;

    const channel = supabase
      .channel("gangs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gangs" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "gang_members" }, () => void refresh())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [addr]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!addr) { setError("Connect wallet first."); return; }
    if (!name.trim()) { setError("Gang name required."); return; }
    if (!tag.trim() || tag.trim().length < 2) { setError("Tag must be 2–4 chars."); return; }
    setSubmitting(true);
    setError("");
    const result = await createGuild(addr, name, tag, motto);
    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    setCreating(false);
    setName(""); setTag(""); setMotto("");
    await refresh();
  }

  async function handleJoin(guildId: string) {
    if (!addr) return;
    setJoining(guildId);
    await joinGuild(addr, guildId);
    setJoining(null);
    await refresh();
  }

  async function handleLeave() {
    if (!addr) return;
    await leaveGuild(addr);
    await refresh();
  }

  const canJoin   = (g: Guild) => !g.id.startsWith("seed_");
  const canCreate = bsol >= BSOL_CREATE_REQUIRED;

  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="px-4 py-10 sm:px-8 space-y-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Alpha Collective</p>
            <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Gangs</h1>
            <p className="mt-2 font-mono text-sm text-[#a09ab8]">
              Form a gang, climb the leaderboard together.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {supabaseReady && (
              <div className="flex items-center gap-2 border border-[#a09ab8]/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#E4D474] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#a09ab8]">Live</span>
              </div>
            )}
            <button
              className="border-2 border-[#E4D474] bg-[#E4D474] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-[#24153E] shadow-[3px_3px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              onClick={() => setCreating(true)}
              type="button"
              disabled={!addr || !canCreate}
            >
              {!addr
                ? "Connect Wallet"
                : !canCreate
                ? `Need ${BSOL_CREATE_REQUIRED} bSOL`
                : "Create Gang"}
            </button>
          </div>
        </div>

        {/* My gang panel */}
        {myGuild && (
          <section>
            <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#a09ab8]">Your Gang</p>
            <div className="border-2 border-[#E4D474] bg-[#2d1a4a] p-5 sm:p-6 shadow-[6px_6px_0_#160c2c]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[#E4D474] px-2 py-0.5 font-mono text-xs font-black text-[#E4D474]">
                      [{myGuild.tag}]
                    </span>
                    <h2 className="text-2xl font-black uppercase sm:text-3xl">{myGuild.name}</h2>
                  </div>
                  {myGuild.motto && (
                    <p className="mt-1 font-mono text-sm italic text-[#a09ab8]">"{myGuild.motto}"</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-5 font-mono text-sm text-[#a09ab8]">
                    <span><span className="font-black text-[#E4D474]">{myGuild.members.length}</span> members</span>
                    <span><span className="font-black text-[#E4D474]">{getGuildAura(myGuild).toLocaleString()}</span> AURA</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/guilds/${myGuild.id}`}
                    className="border border-[#a09ab8] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474] touch-manipulation"
                  >
                    View
                  </Link>
                  {!myGuild.id.startsWith("seed_") && (
                    <button
                      className="border border-[#a09ab8]/40 px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-[#a09ab8]/50 transition hover:border-red-400 hover:text-red-400 touch-manipulation"
                      onClick={handleLeave}
                      type="button"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Create gang form */}
        {creating && (
          <section>
            <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#a09ab8]">Start a Gang</p>
            <form onSubmit={handleCreate} className="border border-[#a09ab8]/60 bg-[#160c2c]">
              <div className="border-b border-[#a09ab8]/30 px-5 py-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#E4D474]">New Gang</p>
                <p className="mt-0.5 font-mono text-[10px] text-[#a09ab8]">
                  Requires {BSOL_CREATE_REQUIRED} bSOL · Your balance: {bsol.toFixed(4)} bSOL
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">
                      Gang Name
                    </label>
                    <input
                      className="w-full border border-[#a09ab8] bg-[#24153E] px-3 py-3 font-mono text-sm text-[#E4D474] outline-none focus:border-[#E4D474] touch-manipulation"
                      maxLength={32}
                      placeholder="Alpha Legion"
                      autoComplete="off"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">
                      Tag <span className="normal-case">(2–4 chars)</span>
                    </label>
                    <input
                      className="w-full border border-[#a09ab8] bg-[#24153E] px-3 py-3 font-mono text-sm uppercase text-[#E4D474] outline-none focus:border-[#E4D474] touch-manipulation"
                      maxLength={4}
                      placeholder="ALP"
                      autoComplete="off"
                      value={tag}
                      onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">
                    Motto <span className="normal-case text-[#a09ab8]/60">(optional)</span>
                  </label>
                  <input
                    className="w-full border border-[#a09ab8] bg-[#24153E] px-3 py-3 font-mono text-sm text-[#E4D474] outline-none focus:border-[#E4D474] touch-manipulation"
                    maxLength={60}
                    placeholder="Real ones only."
                    autoComplete="off"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="border border-[#a09ab8]/30 bg-[#a09ab8]/5 px-4 py-3 font-mono text-xs text-[#a09ab8]">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    className="flex-1 border-2 border-[#E4D474] bg-[#E4D474] py-3 font-mono text-sm font-black uppercase tracking-wide text-[#24153E] transition hover:bg-transparent hover:text-[#E4D474] disabled:opacity-50 touch-manipulation"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Founding…" : "Found Gang"}
                  </button>
                  <button
                    className="border border-[#a09ab8]/50 px-5 py-3 font-mono text-sm uppercase text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474] touch-manipulation"
                    onClick={() => { setCreating(false); setError(""); }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* All gangs list */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#a09ab8]">
              All Gangs — ranked by AURA
            </p>
            {loading && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a09ab8] animate-pulse">Loading…</span>
            )}
          </div>

          {/* Header row — 4 cols mobile, 5 cols desktop */}
          <div className="grid grid-cols-[28px_1fr_52px_64px] sm:grid-cols-[32px_1fr_64px_88px_72px] gap-2 sm:gap-3 border border-[#a09ab8]/30 bg-[#160c2c] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]">
            <span>#</span>
            <span>Gang</span>
            <span className="text-right">Members</span>
            <span className="text-right hidden sm:block">AURA</span>
            <span className="text-right">Action</span>
          </div>

          <div className="border border-t-0 border-[#a09ab8]/30 divide-y divide-[#a09ab8]/15">
            {guilds.length === 0 && !loading ? (
              <div className="bg-[#160c2c] py-12 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-[#a09ab8]">No gangs yet. Be the first.</p>
              </div>
            ) : guilds.map((g, i) => {
              const isMe = myGuild?.id === g.id;
              const aura = getGuildAura(g);
              const rankColor = i === 0 ? "#E4D474" : i === 1 ? "#aaa" : i === 2 ? "#a09ab8" : "#a09ab8";

              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-[28px_1fr_52px_64px] sm:grid-cols-[32px_1fr_64px_88px_72px] items-center gap-2 sm:gap-3 px-4 py-3.5 transition ${isMe ? "bg-[#E4D474]/5" : "bg-[#160c2c] hover:bg-[#160c2c]"}`}
                >
                  {/* Rank */}
                  <span className="font-mono text-sm font-black" style={{ color: rankColor }}>
                    {i + 1}
                  </span>

                  {/* Name + motto */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="shrink-0 border px-1.5 py-px font-mono text-[9px] font-black"
                        style={{ borderColor: isMe ? "#E4D474" : "#a09ab855", color: isMe ? "#E4D474" : "#a09ab8" }}
                      >
                        [{g.tag}]
                      </span>
                      <Link
                        href={`/guilds/${g.id}`}
                        className="truncate font-black uppercase text-sm hover:underline"
                        style={{ color: isMe ? "#E4D474" : "#ffffff" }}
                      >
                        {g.name}
                      </Link>
                      {isMe && (
                        <span className="shrink-0 border border-[#E4D474]/40 px-1 font-mono text-[8px] text-[#E4D474]">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-[#a09ab8]">"{g.motto}"</p>
                  </div>

                  {/* Members */}
                  <span className="text-right font-mono text-sm text-[#a09ab8]">{g.members.length}</span>

                  {/* AURA — desktop only */}
                  <span className="hidden text-right font-mono text-sm font-black text-[#E4D474] sm:block">
                    {aura.toLocaleString()}
                  </span>

                  {/* Action */}
                  <div className="text-right">
                    {isMe ? (
                      <span className="font-mono text-xs uppercase text-[#E4D474]">Joined</span>
                    ) : canJoin(g) && !myGuild ? (
                      <button
                        className="border border-[#a09ab8]/50 px-3 py-1.5 font-mono text-xs uppercase text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474] disabled:opacity-40 touch-manipulation"
                        disabled={!addr || joining === g.id}
                        onClick={() => handleJoin(g.id)}
                        type="button"
                      >
                        {joining === g.id ? "…" : "Join"}
                      </button>
                    ) : (
                      <Link
                        href={`/guilds/${g.id}`}
                        className="font-mono text-xs uppercase text-[#a09ab8] hover:text-[#E4D474] touch-manipulation"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
