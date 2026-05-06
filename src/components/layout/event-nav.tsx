"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface EventNavProps {
  eventId: string;
  eventName: string;
}

const EVENT_TABS = [
  { href: "", label: "Overview" },
  { href: "/hotels", label: "Hotels" },
  { href: "/guests", label: "Guests" },
  { href: "/stays", label: "Stays" },
  { href: "/documents", label: "Documents" },
  { href: "/exports", label: "Exports" },
];

export function EventNav({ eventId, eventName }: EventNavProps) {
  const pathname = usePathname();
  const base = `/events/${eventId}`;

  return (
    <div className="border-b border-border bg-card">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-0">
        <Link
          href="/events"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Events
        </Link>
        <span className="text-xs text-muted-foreground/50">/</span>
        <span className="text-xs text-foreground font-medium truncate max-w-[200px]">
          {eventName}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 px-6 mt-3 overflow-x-auto scrollbar-none">
        {EVENT_TABS.map(({ href, label }) => {
          const fullHref = `${base}${href}`;
          const active = href === "" ? pathname === base : pathname.startsWith(fullHref);

          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
