"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Bot,
  Plus,
  ExternalLink,
  CalendarDays,
  Search,
} from "lucide-react";
import type { SavedPlan } from "@/types/ai";

const supabase = createClient();

export default function PlansPage() {
  const [plans, setPlans] = React.useState<SavedPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadPlans = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPlans([]);
        return;
      }

      const { data, error: plansError } = await supabase
        .from("saved_plans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;
      setPlans(data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved plans",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleDelete = React.useCallback(
    async (planId: string) => {
      try {
        setDeleting(true);

        const { error: deleteError } = await supabase
          .from("saved_plans")
          .delete()
          .eq("id", planId);

        if (deleteError) throw deleteError;

        setPlans((prev) => prev.filter((p) => p.id !== planId));
        setDeleteOpen(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete plan";
        alert(message);
      } finally {
        setDeleting(false);
      }
    },
    [],
  );

  const filteredPlans = React.useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter(
      (plan) =>
        plan.title.toLowerCase().includes(q) ||
        plan.config?.description?.toLowerCase().includes(q),
    );
  }, [plans, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your saved plans...
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
          <Button variant="outline" onClick={loadPlans}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your saved AI-generated financial calculators
          </p>
        </div>
        <Button asChild>
          <Link href="/ai-specialist">
            <Plus className="mr-1.5 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Search */}
      {plans.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search plans by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:placeholder:text-gray-400"
          />
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20">
              <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                No saved plans yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Try the AI Specialist to create your first financial calculator.
                Describe what you need and it will be built instantly.
              </p>
            </div>
            <Button asChild>
              <Link href="/ai-specialist">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Your First Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Search className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                No results found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try a different search term
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={`/ai-specialist?id=${plan.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {plan.title}
                      </Link>
                    </CardTitle>
                    {plan.config?.description && (
                      <CardDescription className="mt-1.5 line-clamp-2 text-xs">
                        {plan.config.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Created {formatDate(plan.created_at)}</span>
                </div>
                {plan.config?.inputs && plan.config.inputs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.config.inputs.slice(0, 3).map((input) => (
                      <Badge
                        key={input.id}
                        variant="secondary"
                        className="text-[10px] font-normal"
                      >
                        {input.label}
                      </Badge>
                    ))}
                    {plan.config.inputs.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal"
                      >
                        +{plan.config.inputs.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <Separator />
              <CardFooter className="gap-2 pt-3">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/ai-specialist?id=${plan.id}`}>
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Open
                  </Link>
                </Button>
                <Dialog
                  open={deleteOpen === plan.id}
                  onOpenChange={(open) => {
                    if (!open) setDeleteOpen(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => setDeleteOpen(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Plan</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &quot;{plan.title}&quot;?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteOpen(null)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
