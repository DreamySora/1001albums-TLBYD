"use client";

import { cn } from "@/lib/utils";

export function Marquee({
  items,
  reverse = false,
  className,
  separator = "✦",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  separator?: string;
}) {
  const content = (
    <div className={cn("marquee-track items-center", reverse && "marquee-track-rev")}>
      {[...items, ...items].map((it, i) => (
        <span key={i} className="flex items-center">
          <span className="px-4">{it}</span>
          <span className="text-lime/70">{separator}</span>
        </span>
      ))}
    </div>
  );
  return <div className={cn("overflow-hidden whitespace-nowrap", className)}>{content}</div>;
}
