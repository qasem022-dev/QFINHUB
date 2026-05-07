"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Plus,
  Bot,
  Calculator,
  ArrowRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import type { SavedPlan } from "@/types/ai";

const supabase = createClient();

export default function DashboardPage() {
  const [user, setUser] = React.useState<{
    email: string;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [plans, setPlans] = React.useState<SavedPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { user_metadata } = session.user;
          setUser({
            email: session.user.email ?? "",
            name: user_metadata?.full_name ?? user_metadata?.name ?? undefined,
            avatar_url: user_metadata?.avatar_url ?? undefined,
          });
        }

        const { data, error: plansError } = await supabase
          .from("saved_plans")
          .select("*")
          .eq("user_id", session?.user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (plansError) throw plansError;
        setPlans(data ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const timeOfDay = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }, []);

  const greeting = user?.name
    ? `Good ${timeOfDay}, ${user.name.split(" ")[0]}`
    : `Good ${timeOfDay}`;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-6 dark:border-primary-800 sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent-500/10" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greeting}! 👋
          </h1>
          <p className="mt-1.5 text-sm text-primary-100">
            Welcome back to QFINHUB. Here&apos;s your financial overview.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="secondary" size="sm">
              <Link href="/calculators">
                <Calculator className="mr-1.5 h-4 w-4" />
                Browse Calculators
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white/15 text-white hover:bg-white/25"
            >
              <Link href="/ai-specialist">
                <Bot className="mr-1.5 h-4 w-4" />
                AI Specialist
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Saved Plans
            </CardTitle>
            <FileText className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {plans.length === 0
                ? "No plans saved yet"
                : `${plans.length} plan${plans.length !== 1 ? "s" : ""} available`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Recent Activity
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-accent-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0 ? "Active" : "None"}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {plans.length > 0
                ? `Last used ${timeAgo(plans[0]!.created_at)}`
                : "Start by creating a plan"}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Quick Actions
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/calculators">
                <Calculator className="mr-1.5 h-4 w-4" />
                New Calculator
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/ai-specialist">
                <Bot className="mr-1.5 h-4 w-4" />
                AI Specialist
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Plans</CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your most recently saved AI-generated calculators
            </p>
          </div>
          {plans.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/plans">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Bot className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  No saved plans yet
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try the AI Specialist to create your first financial
                  calculator!
                </p>
              </div>
              <Button asChild>
                <Link href="/ai-specialist">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Your First Plan
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/ai-specialist?id=${plan.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {plan.title}
                      </p>
                      {plan.config?.description && (
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {plan.config.description}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-normal"
                      >
                        {timeAgo(plan.created_at)}
                      </Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
