"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const NO_FOOTER_PREFIX = ["/game", "/lobby", "/character-select", "/mode-select", "/map", "/end", "/play", "/scenarios", "/life"];
const NO_FOOTER_EXACT = ["/", "/privacy-policy", "/terms"];

export function ConditionalFooter() {
  const path = usePathname();
  if (NO_FOOTER_EXACT.includes(path) || NO_FOOTER_PREFIX.some((p) => path.startsWith(p))) return null;
  return <Footer />;
}
