import type { Metadata } from "next";
import { Bebas_Neue, Geist_Mono } from "next/font/google";
import { SolanaMobileWalletProvider } from "./components/SolanaMobileWalletProvider";
import { WalletProvider } from "./components/WalletProvider";
import { WalletGate } from "./components/WalletGate";
import { ConditionalFooter } from "./components/ConditionalFooter";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proof of Alpha",
  description: "A free-to-play fully on-chain PvP meme battle game on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#24153E]">
        <SolanaMobileWalletProvider />
        <WalletProvider>
          <WalletGate>
            <div className="flex flex-col flex-1">
              {children}
              <ConditionalFooter />
            </div>
          </WalletGate>
        </WalletProvider>
      </body>
    </html>
  );
}
