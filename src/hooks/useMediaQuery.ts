"use client";

import { useState, useEffect } from "react";

/**
 * Hook that tracks a CSS media query.
 * Returns true when the media query matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Returns true when viewport is at least 1024px (lg breakpoint) */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
