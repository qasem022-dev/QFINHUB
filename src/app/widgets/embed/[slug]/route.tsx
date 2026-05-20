import { NextRequest } from "next/server";
import { getCalculatorBySlug } from "@/lib/calculators";

// Serve a clean HTML page for embedding in iframes
// Uses Tailwind CDN for styles — completely independent of main layout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    return new Response("Calculator not found", { status: 404 });
  }

  const title = calculator.title;
  const description = calculator.description;
  const icon = calculator.icon || "🧮";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free ${title} — QFINHUB</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, nofollow">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    input, select, button { font-family: inherit; }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-white text-zinc-900 min-h-screen flex flex-col">
  <main class="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <span>${icon}</span> ${title}
        </h1>
        <p class="text-sm text-zinc-500 mt-1">${description}</p>
      </div>
      <a
        href="https://www.qfinhub.com/calculators/${slug}"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-zinc-400 hover:text-zinc-600 transition-colors border border-zinc-200 rounded-lg px-3 py-1.5 flex-shrink-0"
      >
        Open ↗
      </a>
    </div>

    <!-- Calculator placeholder -->
    <div id="calc-root" class="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
      <p class="text-center text-zinc-500 py-8">
        <span class="text-2xl block mb-2">${icon}</span>
        Interactive calculator loading or available on<br>
        <a href="https://www.qfinhub.com/calculators/${slug}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">
          qfinhub.com/calculators/${slug}
        </a>
      </p>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-zinc-200 py-3 px-4 text-center mt-auto">
    <a
      href="https://www.qfinhub.com/widgets"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
    >
      Powered by <span class="font-semibold text-zinc-500">QFINHUB</span> — Free Financial Calculators
    </a>
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
