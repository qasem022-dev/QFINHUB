"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const navLinks = [
  { href: "/calculators", label: "Calculators" },
  { href: "/ai-specialist", label: "AI Specialist", highlight: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Simulate auth state — replace with real auth context later
  const user = null as { email: string; avatar_url?: string } | null;
  const isLoggedIn = user !== null;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-surface-dark/95"
          : "border-transparent bg-white dark:bg-surface-dark",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500">
            <span className="text-sm font-bold text-white">Q</span>
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-gray-900 sm:inline dark:text-white">
            QFINHUB
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
              )}
            >
              {link.highlight ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-1 text-white shadow-sm">
                  {link.label}
                </span>
              ) : (
                link.label
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth / User Menu */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>

          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatar_url ?? undefined}
                      alt={user.email ?? ""}
                    />
                    <AvatarFallback className="bg-primary-100 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                      {user.email?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-sm hover:from-primary-700 hover:to-accent-600"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 dark:border-gray-700 dark:bg-surface-dark md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            {/* Mobile Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            {isLoggedIn && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
                <Link href="/auth/signup">
                  <Button className="mt-1 w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-sm hover:from-primary-700 hover:to-accent-600">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
