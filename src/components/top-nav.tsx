"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Disc3, Shuffle, RotateCcw, User } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState } from "react";

export function TopNav({ active }: { active: "home" | "random" | "wheel" | "account" }) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/90 backdrop-blur-xl border-b border-white/10">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-3 sm:px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg uppercase tracking-tight text-foreground" aria-label="Home">
          <Disc3 className="size-5 text-hotpink" />
          <span className="hidden sm:inline">1001.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/" label="Browse" active={active === "home"}><Menu className="size-4" /></NavLink>
          <NavLink href="/random" label="Random" active={active === "random"}><Shuffle className="size-4" /></NavLink>
          <NavLink href="/wheel" label="Wheel" active={active === "wheel"}><RotateCcw className="size-4" /></NavLink>
          <NavLink href="/account" label="Account" active={active === "account"}><User className="size-4" /></NavLink>
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex size-9 items-center justify-center rounded-full border border-white/15 bg-card/60 text-foreground transition hover:border-hotpink"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl py-3 px-3"
          >
            <div className="flex flex-col gap-2">
              <NavLink href="/" label="Browse" active={active === "home"} className="justify-start px-3 py-2 text-base"><Menu className="size-5 mr-3" /> Browse</NavLink>
              <NavLink href="/random" label="Random" active={active === "random"} className="justify-start px-3 py-2 text-base"><Shuffle className="size-5 mr-3" /> Random</NavLink>
              <NavLink href="/wheel" label="Wheel" active={active === "wheel"} className="justify-start px-3 py-2 text-base"><RotateCcw className="size-5 mr-3" /> Wheel</NavLink>
              <NavLink href="/account" label="Account" active={active === "account"} className="justify-start px-3 py-2 text-base"><User className="size-5 mr-3" /> Account</NavLink>
            </div>
            <ThemeToggle className="mt-2 mb-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-card/60 text-foreground transition hover:border-hotpink hover:text-hotpink"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.span key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><Moon className="size-5" /></motion.span>
            ) : (
              <motion.span key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sun className="size-5" /></motion.span>
            )}
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}

function NavLink({
  href,
  label,
  active,
  children,
  className = "",
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={`flex items-center justify-center rounded-full border transition ${
            active
              ? "border-hotpink bg-hotpink/15 text-hotpink"
              : "border-white/15 bg-card/60 text-foreground/80 hover:border-hotpink hover:text-hotpink"
          } ${className}`}
          aria-label={label}
          aria-current={active ? "page" : undefined}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
