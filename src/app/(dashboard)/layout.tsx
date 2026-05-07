"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import {
  LayoutDashboard,
  Calculator,
  Bot,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Bell,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "My Plans", icon: Bot },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/ai-specialist", label: "AI Specialist", icon: Bot },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Simulate auth state — replace with real auth context later
  const user = null as { email: string; avatar_url?: string } | null;

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-700 dark:bg-surface-dark-elevated lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6 dark:border-gray-700">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-600 to-accent-500">
              <span className="text-xs font-bold text-white">Q</span>
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
              QFINHUB
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-surface-dark/95 sm:px-6">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search calculators..."
              className="h-9 rounded-lg border-gray-200 bg-gray-50 pl-9 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </button>

            {/* Notifications */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              <Bell className="h-4 w-4" />
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={user?.avatar_url ?? undefined}
                      alt={user?.email ?? ""}
                    />
                    <AvatarFallback className="bg-primary-100 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                      {user?.email?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2"
                  >
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
