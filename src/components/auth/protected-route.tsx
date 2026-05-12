"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps client-side pages that require authentication.
 *
 * - While auth state is loading, renders a full-page spinner (no flash).
 * - If user is not authenticated, redirects to /auth/login?redirectTo=<path>.
 * - If authenticated, renders children.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [redirected, setRedirected] = React.useState(false);

  React.useEffect(() => {
    // Wait for auth to settle before deciding
    if (isLoading) return;
    if (redirected) return;

    if (!user) {
      setRedirected(true);
      const encoded = encodeURIComponent(pathname);
      router.replace(`/auth/login?redirectTo=${encoded}`);
    }
  }, [user, isLoading, pathname, router, redirected]);

  // Loading state — prevents flash of dashboard content
  if (isLoading || (!user && !redirected)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect in progress — keep showing spinner
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
