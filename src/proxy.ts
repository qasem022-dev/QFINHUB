import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPaths = ["/dashboard"];
const authPaths = ["/auth/login", "/auth/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 410 Gone for confirmed obsolete pages (Phase 12.13) ────
  const GONE_PATHS = new Set([
    "/scenario/401k-50000-10pct-30yr",
    "/calculators/refinance/las-vegas-nv",
    "/scenario/mortgage-250k-30dp-40yr-6-5pct",
    "/scenario/mortgage-350k-15dp-15yr-5-0pct",
    "/calculators/refinance/phoenix-az",
  ]);
  if (GONE_PATHS.has(pathname)) {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Protect dashboard routes ──────────────────────────────
  // If not authenticated and trying to access /dashboard/*
  if (!user && protectedPaths.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?redirectTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // ── Redirect logged-in users away from auth pages ─────────
  // If authenticated and on auth pages, send to dashboard
  if (user && authPaths.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Phase 12.13: 410 Gone for obsolete scenario/geo pages
    "/scenario/:path*",
    "/calculators/refinance/:path*",
    // Existing auth matchers
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};
