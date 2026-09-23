"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = dark ?? false;
    document.documentElement.classList.toggle("dark", !next);
    localStorage.setItem("theme", next ? "light" : "dark");
    setDark(!next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Toggle dark mode"
    >
      {dark === null ? "" : dark ? "Light mode" : "Dark mode"}
    </button>
  );
}