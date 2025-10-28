"use client"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "next-themes"
import { useCallback } from "react"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const handleThemeToggle = useCallback(
    (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      const x = e?.clientX ?? window.innerWidth / 2;
      const y = e?.clientY ?? window.innerHeight / 2;
      root.style.setProperty("--x", `${x}px`);
      root.style.setProperty("--y", `${y}px`);

      // Start the view transition
      const transition = document.startViewTransition(() => {
        setTheme(newMode);
      });

      // Animate the new view expanding out from the click point
      transition.ready.then(() => {
        // Delay a few ms to avoid flicker during dark mode rendering
        requestAnimationFrame(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(150% at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 700,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        });
      });
    },
    [resolvedTheme, setTheme]
  );

  return (
    <button
      type="button"
      onClick={handleThemeToggle}
      aria-label="Toggle theme"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
