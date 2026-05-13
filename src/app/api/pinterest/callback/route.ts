import { NextRequest, NextResponse } from "next/server";

/**
 * Pinterest OAuth Callback
 * 
 * Called by Pinterest after user authorizes the app.
 * Shows the auth code for manual exchange (server-side exchange often fails
 * due to environment variable issues on Vercel).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:white">
        <h2>❌ Pinterest Authorization Error</h2>
        <p>${error}</p>
        <p><a href="/" style="color:#60a5fa">Back to QFINHUB</a></p>
      </body></html>`,
      { headers: { "content-type": "text/html" } }
    );
  }

  if (!code) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:white">
        <h2>❌ No Authorization Code</h2>
        <p>No code was returned by Pinterest.</p>
        <p><a href="/" style="color:#60a5fa">Back to QFINHUB</a></p>
      </body></html>`,
      { headers: { "content-type": "text/html" } }
    );
  }

  // Try server-side exchange
  const clientId = process.env.PINTEREST_CLIENT_ID || "1570427";
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET || "";
  const redirectUri = "https://www.qfinhub.com/api/pinterest/callback";

  let exchangeResult = null;
  let exchangeError = null;

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const resp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const body = await resp.text();

    if (resp.ok) {
      const data = JSON.parse(body);
      exchangeResult = data;
    } else {
      exchangeError = `${resp.status}: ${body.substring(0, 300)}`;
    }
  } catch (err) {
    exchangeError = String(err);
  }

  if (exchangeResult) {
    // Success! Show tokens
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:white">
        <h2>✅ Pinterest Authorization Successful!</h2>
        <p>Copy these tokens and send them to your developer:</p>
        <div style="background:#1e293b;padding:20px;border-radius:12px;margin:20px 0">
          <p><strong>Access Token:</strong></p>
          <code style="word-break:break-all;color:#a5f3fc;font-size:13px">${exchangeResult.access_token}</code>
          <p style="margin-top:15px"><strong>Refresh Token:</strong></p>
          <code style="word-break:break-all;color:#a5f3fc;font-size:13px">${exchangeResult.refresh_token || "(none)"}</code>
          <p style="margin-top:15px"><strong>Expires in:</strong> ${exchangeResult.expires_in} seconds</p>
        </div>
        <p><a href="/" style="color:#60a5fa">Go to QFINHUB</a></p>
      </body></html>`,
      { headers: { "content-type": "text/html" } }
    );
  }

  // Exchange failed — show code for manual exchange
  return new Response(
    `<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:white">
      <h2>⚠️ Server Exchange Failed</h2>
      <p>Error: ${exchangeError}</p>
      <p>But I have the auth code! Send this to your developer:</p>
      <div style="background:#1e293b;padding:20px;border-radius:12px;margin:20px 0">
        <p><strong>Authorization Code:</strong></p>
        <code style="word-break:break-all;color:#fbbf24;font-size:13px">${code}</code>
      </div>
      <p style="color:#94a3b8;font-size:14px">The developer can exchange this code manually for tokens.</p>
      <p><a href="/" style="color:#60a5fa">Back to QFINHUB</a></p>
    </body></html>`,
    { headers: { "content-type": "text/html" } }
  );
}
