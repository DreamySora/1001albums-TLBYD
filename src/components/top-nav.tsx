"use client";

import { useTheme } from "next-themes";
import { Disc3, Shuffle, Disc, User, Sun, Moon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isDark = theme === "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-card/60 transition hover:border-amber hover:text-amber"
          aria-label="Toggle theme"
        >
          {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}</TooltipContent>
    </Tooltip>
  );
}

export function TopNav({ active }: { active?: "home" | "random" | "wheel" | "account" }) {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <a href="/" className="flex items-center gap-2">
        <Disc3 className="size-5 animate-[spin_6s_linear_infinite] text-hotpink" />
        <span className="font-display text-lg tracking-tight uppercase">
          1001<span className="text-lime">.</span>
        </span>
        <span className="hidden font-mono-funk text-[10px] tracking-[0.2em] text-muted-foreground sm:inline">
          ALBUMS BEFORE YOU DIE
        </span>
      </a>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <NavLink href="/random" label="Random" active={active === "random"}>
          <Shuffle className="size-4" />
        </NavLink>
        <NavLink href="/wheel" label="Wheel" active={active === "wheel"}>
          <Disc className="size-4" />
        </NavLink>
        <NavLink href="/account" label="Account" active={active === "account"}>
          <User className="size-4" />
        </NavLink>
        <ThemeToggle />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          className={`flex size-9 items-center justify-center rounded-full border transition ${
            active
              ? "border-hotpink bg-hotpink/15 text-hotpink"
              : "border-white/15 bg-card/60 text-foreground/80 hover:border-hotpink hover:text-hotpink"
          }`}
          aria-label={label}
        >
          {children}
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
