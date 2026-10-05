import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // A stray package-lock.json in the user's home dir otherwise makes
    // Turbopack treat the whole home folder as the root (huge watch set, hangs).
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
