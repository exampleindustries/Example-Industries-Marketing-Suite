import { useHashLocation } from "wouter/use-hash-location";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, CalendarCheck, BarChart3, Target,
  Sun, Moon, ChevronRight, LogOut, User
} from "lucide-react";
import { useState, useEffect } from "react";

const nav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Social Posts", href: "/social", icon: CalendarCheck },
  { label: "Ad Campaigns", href: "/ads", icon: BarChart3 },
  { label: "Leads", href: "/leads", icon: Target },
];

export default function Sidebar() {
  const [location, navigate] = useHashLocation();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <aside className="sidebar-scroll h-full border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 flex-shrink-0">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="Full Circle Builders logo">
            <circle cx="18" cy="18" r="15" stroke="hsl(218,72%,28%)" strokeWidth="3" className="dark:stroke-[hsl(215,80%,60%)]" fill="none" />
            <path d="M10 22 L10 28 L26 28 L26 22 L18 15 Z" fill="hsl(218,72%,28%)" className="dark:fill-[hsl(215,80%,60%)]" />
            <path d="M8 23 L18 13 L28 23" stroke="hsl(33,95%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">Full Circle</p>
          <p className="text-xs text-muted-foreground leading-tight">Agency Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = location === href || (href !== "/" && location.startsWith(href));
          return (
            <button
              key={href}
              data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
              onClick={() => navigate(href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        )}

        <button
          data-testid="theme-toggle"
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? "Light mode" : "Dark mode"}
        </button>

        <button
          data-testid="button-logout"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
