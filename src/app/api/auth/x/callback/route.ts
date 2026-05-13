import { NextRequest, NextResponse } from "next/server";

/**
 * X (Twitter) OAuth callback handler.
 * Receives the OAuth verifier and token after user authorization.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  console.log("[X Callback] Received:", { oauthToken, oauthVerifier });

  // Redirect back to home after successful auth
  return NextResponse.redirect(new URL("/", request.url));
}
