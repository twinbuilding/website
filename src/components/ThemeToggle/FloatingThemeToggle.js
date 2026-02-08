"use client";

import { useEffect, useState } from "react";
import styles from "./FloatingThemeToggle.module.css";

export default function FloatingThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ?? (prefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.fab}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <span className={styles.fabIcon} aria-hidden="true" />
      </button>
    </div>
  );
}
