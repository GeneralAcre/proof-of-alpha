import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.proofofalpha.app",
  appName: "Proof of Alpha",
  webDir: "out",
  server: {
    // All pages and API routes are served from the Vercel deployment.
    // This lets the APK stay thin while keeping server-side logic (award-aura, chat) intact.
    url: "https://proof-of-alpha-live.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#160c2c",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#160c2c",
      showSpinner: false,
    },
  },
};

export default config;
