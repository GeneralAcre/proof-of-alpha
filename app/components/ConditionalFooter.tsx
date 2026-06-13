"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const NO_FOOTER = ["/game", "/lobby", "/character-select", "/mode-select", "/map", "/end"];

export function ConditionalFooter() {
  const path = usePathname();
  if (NO_FOOTER.some((p) => path.startsWith(p))) return null;
  return <Footer />;
}
