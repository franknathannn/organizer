"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Wallet,
  ListChecks,
  CalendarDays,
  Flag,
  Target,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/budget", label: "Money", icon: Wallet },
  { href: "/todos", label: "Tasks", icon: ListChecks },
  { href: "/planner", label: "Calendar", icon: CalendarDays },
  { href: "/deadlines", label: "Deadlines", icon: Flag },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  if (pathname === "/") return null;

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-panel/80 backdrop-blur-md border-b border-border sticky top-0 z-40 w-full">
        <div className="flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber">
            Task Organizer & Budget Tracking
          </p>
          <p className="font-display text-base text-ink font-semibold">My Stuffs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border text-muted hover:text-ink transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg border border-border text-muted hover:text-ink transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container (both Desktop & Mobile Drawer) */}
      <aside
        className={cn(
          "shrink-0 border-r border-border bg-panel flex flex-col transition-all duration-200 z-50 h-screen",
          collapsed ? "w-[68px]" : "w-60",
          // Mobile styles: fixed, full-height, sliding off-screen by default
          "fixed top-0 left-0 bottom-0",
          isOpen ? "translate-x-0 w-60" : "-translate-x-full",
          // Desktop styles: override fixed with sticky, always visible (translate-x-0)
          "md:sticky md:translate-x-0"
        )}
      >
        <div className={cn("px-5 py-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber">
                Organizer
              </p>
              <p className="font-display text-xl text-ink mt-0.5">My Stuffs</p>
            </div>
          )}
          {/* Close button inside mobile drawer */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg border border-border text-muted hover:text-ink"
          >
            <X size={16} />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-ink hover:bg-panel-raised/60 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                onClick={() => setIsOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-panel-raised text-ink border border-border-bright"
                    : "text-muted hover:text-ink hover:bg-panel-raised/60 border border-transparent"
                )}
              >
                <Icon size={17} strokeWidth={1.75} />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5 space-y-2">
          {/* Theme Toggle (Desktop and mobile bottom) */}
          <button
            onClick={toggleTheme}
            title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-ink hover:bg-panel-raised/60 transition-colors border border-transparent",
              collapsed && "justify-center px-2"
            )}
          >
            {theme === "dark" ? (
              <>
                <Sun size={17} strokeWidth={1.75} />
                {!collapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon size={17} strokeWidth={1.75} />
                {!collapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>

          <button
            onClick={signOut}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-danger hover:bg-danger/5 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut size={17} strokeWidth={1.75} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
