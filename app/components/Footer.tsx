"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Home",        href: "/home" },
  { label: "Rizz Test",   href: "/test" },
  { label: "Profile",     href: "/profile" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Gangs",       href: "/guilds" },
  { label: "Store",       href: "/store" },
  { label: "Staking",     href: "/saura" },
];

const PROGRAM_ID = "DkwFvvR...toU";

export function Footer() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const mailto = `mailto:acreforcoding@gmail.com?subject=POA Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
    window.location.href = mailto;
    setSent(true);
    setName(""); setEmail(""); setMessage("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <footer className="border-t border-[#a09ab8]/20 bg-[#160c2c]">

      {/* ── Top grid ── */}
      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-10 px-6 py-12 lg:grid-cols-3 lg:gap-8">

        {/* Contact */}
        <div className="col-span-2 lg:col-span-1">
          <p className="mb-5 font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a09ab8]">
            Contact &amp; Support
          </p>
          <form onSubmit={handleSend} className="space-y-3">
            <input
              className="w-full border-b border-[#a09ab8]/30 bg-transparent pb-2 font-mono text-xs text-[#E4D474] placeholder-[#a09ab8]/40 outline-none focus:border-[#E4D474] transition"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
            />
            <input
              className="w-full border-b border-[#a09ab8]/30 bg-transparent pb-2 font-mono text-xs text-[#E4D474] placeholder-[#a09ab8]/40 outline-none focus:border-[#E4D474] transition"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <textarea
              className="w-full border-b border-[#a09ab8]/30 bg-transparent pb-2 font-mono text-xs text-[#E4D474] placeholder-[#a09ab8]/40 outline-none focus:border-[#E4D474] transition resize-none"
              placeholder="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="submit"
              className="mt-2 w-full border border-[#E4D474] bg-[#E4D474] py-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#160c2c] transition hover:bg-transparent hover:text-[#E4D474]"
            >
              {sent ? "Sent!" : "Send"}
            </button>
          </form>
        </div>

        {/* Navigation */}
        <div>
          <p className="mb-5 font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a09ab8]">
            Navigation
          </p>
          <ul className="space-y-3">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="font-mono text-sm text-[#ffffff]/70 transition hover:text-[#E4D474]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div>
          <p className="mb-5 font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a09ab8]">
            Social
          </p>
          <div className="flex gap-3">
            <Link
              href="https://x.com/created_alpha"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-16 w-16 items-center justify-center border border-[#a09ab8]/30 text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
              aria-label="Twitter / X"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link
              href="https://github.com/GeneralAcre/proof-of-alpha"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-16 w-16 items-center justify-center border border-[#a09ab8]/30 text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
              aria-label="GitHub"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#a09ab8]/15 bg-[#0d0820]">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center space-y-4">
          <p className="font-mono text-xs text-[#a09ab8]/60 leading-6 max-w-2xl mx-auto">
            Proof of Alpha is a fully on-chain dating-practice game on Solana — chat, flirt, and build your rizz to earn AURA and climb the leaderboard.
          </p>
          <div className="inline-flex items-center gap-3 border border-[#a09ab8]/20 px-6 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]/50">Powered by</span>
            <Image src="/solanaWordMark.png" alt="Solana" width={80} height={14} className="object-contain" />
          </div>
        </div>
      </div>

    </footer>
  );
}
