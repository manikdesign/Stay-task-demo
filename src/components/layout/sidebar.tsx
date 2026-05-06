"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  user: { name: string; email: string };
  org: { name: string };
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: CalendarDays, label: "Events" },
];

export function Sidebar({ user, org }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 5C2 3.34315 3.34315 2 5 2H11C12.6569 2 14 3.34315 14 5V11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11V5Z" fill="white" fillOpacity="0.9"/>
            <path d="M5.5 8H10.5M8 5.5V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-sidebar-foreground font-semibold text-sm tracking-tight">
          StayFlow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-sidebar-primary" : "opacity-70")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          )}
        >
          <Settings className="w-4 h-4 opacity-70" />
          Settings
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm hover:bg-sidebar-accent/60 transition-colors group" />}>
            <Avatar className="w-6 h-6 shrink-0">
              <AvatarFallback className="text-[10px] bg-sidebar-primary text-white font-medium">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sidebar-foreground text-xs font-medium truncate">
                {user.name}
              </p>
              <p className="text-sidebar-foreground/50 text-[10px] truncate">
                {org.name}
              </p>
            </div>
            <ChevronRight className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-48"
          >
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" className="flex items-center gap-2" />}>
              <Building2 className="w-3.5 h-3.5" />
              Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/8"
              onSelect={async () => {
                await logout();
              }}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
