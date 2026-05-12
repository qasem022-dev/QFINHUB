"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface AuthContextValue {
  /** The logged-in user profile, or null if not authenticated. */
  user: UserProfile | null;
  /** True while checking the session on initial load. */
  isLoading: boolean;
  /** Sign out the current user and redirect to home. */
  signOut: () => Promise<void>;
  /** Refresh the current user session from Supabase. */
  refreshSession: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function useAuth() {
  return React.useContext(AuthContext);
}

// ── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // ── Helper: transform Supabase User → UserProfile ──────
  const toProfile = (u: User): UserProfile => ({
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
    avatar_url: u.user_metadata?.avatar_url ?? undefined,
  });

  // ── Refresh session manually ──────────────────────────
  const refreshSession = React.useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(toProfile(session.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [supabase]);

  // ── Sign out ──────────────────────────────────────────
  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  // ── Initial load + listen for auth changes ────────────
  React.useEffect(() => {
    let mounted = true;

    // 1. Load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(toProfile(session.user));
      }
      setIsLoading(false);
    });

    // 2. Listen for future changes (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(toProfile(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
