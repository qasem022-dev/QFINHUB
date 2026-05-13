import { NextRequest, NextResponse } from "next/server";
import { PinterestClient } from "@/lib/pinterest/client";

/**
 * Pinterest OAuth Callback
 * 
 * Called by Pinterest after user authorizes the app.
 * Exchanges the authorization code for access + refresh tokens.
 * 
 * URL: /api/pinterest/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle error from Pinterest
  if (error) {
    console.error("Pinterest OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        "/?pinterest=error&message=" + encodeURIComponent(error),
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?pinterest=error&message=no_code", request.url)
    );
  }

  try {
    const clientId = process.env.PINTEREST_CLIENT_ID || "1570427";
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET || "";
    const redirectUri = "https://www.qfinhub.com/api/pinterest/callback";

    const tokens = await PinterestClient.exchangeCode(
      code,
      redirectUri,
      clientId,
      clientSecret
    );

    console.log("Pinterest OAuth success! Got tokens.");

    // Return the tokens in the redirect so the user can save them
    const params = new URLSearchParams({
      pinterest: "success",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: String(tokens.expires_in),
    });

    return NextResponse.redirect(
      new URL(`/?${params.toString()}`, request.url)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Pinterest token exchange failed:", msg);
    return NextResponse.redirect(
      new URL(
        "/?pinterest=error&message=" + encodeURIComponent(msg.substring(0, 200)),
        request.url
      )
    );
  }
}
