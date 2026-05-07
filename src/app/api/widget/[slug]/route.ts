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
  const appUrl = `${baseUrl}/calculators/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${calculator.title} — QFINHUB Widget</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: transparent;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .widget-container {
      max-width: 100%;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
    }
    .widget-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .widget-header .icon {
      font-size: 20px;
      line-height: 1;
    }
    .widget-body {
      padding: 20px;
    }
    .widget-body p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .widget-cta {
      display: inline-block;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      background: #111827;
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .widget-cta:hover {
      background: #374151;
    }
    .widget-footer {
      padding: 12px 20px;
      border-top: 1px solid #f3f4f6;
      text-align: center;
    }
    .widget-footer a {
      font-size: 12px;
      color: #9ca3af;
      text-decoration: none;
    }
    .widget-footer a:hover {
      color: #6b7280;
    }
    @media (prefers-color-scheme: dark) {
      .widget-container {
        border-color: #374151;
        background: #1f2937;
      }
      .widget-header {
        border-bottom-color: #374151;
      }
      .widget-header h2 { color: #f9fafb; }
      .widget-body p { color: #9ca3af; }
      .widget-cta { color: #111827; background: #f9fafb; }
      .widget-cta:hover { background: #e5e7eb; }
      .widget-footer { border-top-color: #374151; }
      .widget-footer a { color: #6b7280; }
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      ${
        typeof calculator.icon === "string"
          ? `<span class="icon">${calculator.icon}</span>`
          : ""
      }
      <h2>${calculator.title}</h2>
    </div>
    <div class="widget-body">
      <p>${calculator.description}</p>
      <a href="${appUrl}" class="widget-cta" target="_blank" rel="noopener">
        Open Calculator →
      </a>
    </div>
    <div class="widget-footer">
      <a href="${baseUrl}/calculators" target="_blank" rel="noopener">Powered by QFINHUB</a>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
