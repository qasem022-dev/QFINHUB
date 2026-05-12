import { NextRequest, NextResponse } from "next/server";
import { getCalculatorBySlug } from "@/lib/calculators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    return new NextResponse("Calculator not found", { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${calculator.title} — QFINHUB Widget</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: transparent;
      color: #111827;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .embed-wrapper {
      width: 100%;
      max-width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .embed-frame {
      width: 100%;
      flex: 1;
      border: none;
      min-height: 400px;
    }
    @media (prefers-color-scheme: dark) {
      body { color: #f9fafb; }
    }
  </style>
</head>
<body>
  <div class="embed-wrapper">
    <iframe
      class="embed-frame"
      src="${baseUrl}/embed/${slug}"
      title="${calculator.title}"
      allow="clipboard-read; clipboard-write"
      referrerpolicy="strict-origin-when-cross-origin"
      loading="lazy"
    ></iframe>
  </div>
  <script>
    (function() {
      function sendHeight() {
        var h = document.documentElement.scrollHeight;
        parent.postMessage({ type: 'qfinhub-resize', height: h }, '*');
      }
      window.addEventListener('load', function() {
        sendHeight();
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 500);
      });
      window.addEventListener('resize', function() {
        sendHeight();
      });
      var observer = new MutationObserver(function() {
        sendHeight();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
