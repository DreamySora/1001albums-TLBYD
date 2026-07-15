"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Disc3, User, Compass, Dice6, Music } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

export function TopNav({ active }: { active: "home" | "random" | "wheel" | "account" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/90 backdrop-blur-xl border-b border-white/10">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-3 sm:px-5">
        <Link href="/" className="flex items-center gap-3 font-display text-lg uppercase tracking-tight text-foreground" aria-label="Home">
          <Disc3 className="size-4 text-hotpink animate-[spin_8s_linear_infinite]" />
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-display text-base sm:text-xl tracking-tight text-gradient-funk">
              1001<span className="text-hotpink">.</span>
            </span>
            <span className="font-grotesk text-[10px] sm:text-sm tracking-wider text-gradient-funk uppercase leading-none sm:leading-normal">
              Albums<span className="sm:hidden">.</span><span className="hidden sm:inline">TLBYD</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <NavLink href="/" label="Browse" active={active === "home"} className="size-9"><Compass className="size-4" /></NavLink>
          <NavLink href="/random" label="Random" active={active === "random"} className="size-9"><Dice6 className="size-4" /></NavLink>
          <NavLink href="/wheel" label="Wheel" active={active === "wheel"} className="size-9"><Music className="size-4" /></NavLink>
          <NavLink href="/account" label="Account" active={active === "account"} className="size-9"><User className="size-4" /></NavLink>
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex size-10 items-center justify-center rounded-full border border-white/15 bg-card/60 text-foreground transition hover:border-hotpink"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
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
              <NavLink href="/" label="Browse" active={active === "home"} className="justify-start px-4 py-3 text-base"><Compass className="size-4 mr-4" /> Browse</NavLink>
              <NavLink href="/random" label="Random" active={active === "random"} className="justify-start px-4 py-3 text-base"><Dice6 className="size-4 mr-4" /> Random</NavLink>
              <NavLink href="/wheel" label="Wheel" active={active === "wheel"} className="justify-start px-4 py-3 text-base"><Music className="size-4 mr-4" /> Wheel</NavLink>
              <NavLink href="/account" label="Account" active={active === "account"} className="justify-start px-4 py-3 text-base"><User className="size-4 mr-4" /> Account</NavLink>
            </div>
            <ThemeToggle className="mt-2 mb-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = theme === "dark";
  if (!mounted) {
    return (
      <div className={`flex size-9 items-center justify-center ${className}`}>
        <Moon className="size-4 text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`flex size-9 items-center justify-center rounded-full border border-white/15 bg-card/60 text-foreground transition hover:border-hotpink hover:text-hotpink ${className}`}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><Moon className="size-4" /></motion.span>
            ) : (
              <motion.span key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sun className="size-4" /></motion.span>
            )}
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
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
