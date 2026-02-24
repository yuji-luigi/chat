import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";

function getPreferredColorScheme(): ColorScheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function usePrefersColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(getPreferredColorScheme);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme(mql.matches ? "dark" : "light");

    onChange();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Safari < 14
    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(onChange);
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(onChange);
  }, []);

  return scheme;
}
