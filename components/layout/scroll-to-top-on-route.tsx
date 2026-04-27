"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Ensures inner-page scroll position does not carry over when navigating to another route (e.g. home). */
export function ScrollToTopOnRoute() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
