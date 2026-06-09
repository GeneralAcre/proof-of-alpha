import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SolanaMobileWalletProvider } from "./components/SolanaMobileWalletProvider";
import { WalletProvider } from "./components/WalletProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#241F19]">
        <SolanaMobileWalletProvider />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
