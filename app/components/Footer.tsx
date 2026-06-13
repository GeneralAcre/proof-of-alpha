import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#a09ab8]/20 bg-[#24153E] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col items-center gap-6 sm:flex-row sm:justify-between">

        {/* Brand */}
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#E4D474]">
            Proof of Alpha
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]">
            On-chain PvP on Solana
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <Link
            href="https://x.com/created_alpha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#a09ab8]/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
          >
            {/* X logo */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </Link>

          <Link
            href="https://github.com/GeneralAcre/proof-of-alpha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#a09ab8]/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
          >
            {/* GitHub logo */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a09ab8]/50">
          © 2025 Proof of Alpha
        </p>

      </div>
    </footer>
  );
}
