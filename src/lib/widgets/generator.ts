/**
 * Embeddable Widget System for QFINHUB
 * 
 * Generates copy-paste embed codes for bloggers and site owners.
 * Each widget includes a "Powered by QFINHUB" link + backlink.
 */

import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.qfinhub.com";

export interface WidgetCode {
  iframe: string;
  script: string;
  html: string;
}

/**
 * Generate all embed code variants for a calculator.
 */
export function generateWidgetCode(slug: string): WidgetCode | null {
  const calc = getCalculatorBySlug(slug);
  if (!calc) return null;

  const calcUrl = `${BASE_URL}/calculators/${slug}`;
  const embedUrl = `${BASE_URL}/embed/${slug}`;
  const widgetUrl = `${BASE_URL}/api/widget/${slug}`;

  // Iframe embed — works on every platform (WordPress, Wix, etc.)
  const iframe = [
    `<iframe`,
    `  src="${widgetUrl}"`,
    `  title="${escapeAttr(calc.title)}"`,
    `  width="100%"`,
    `  height="500"`,
    `  frameborder="0"`,
    `  loading="lazy"`,
    `  style="max-width:100%;border:none;overflow:hidden;"`,
    `  referrerpolicy="strict-origin-when-cross-origin"`,
    `></iframe>`,
    `<p style="text-align:center;font-size:12px;color:#888;margin-top:4px;">`,
    `  <a href="${calcUrl}" target="_blank" rel="noopener" style="color:#888;text-decoration:none;">`,
    `    Powered by QFINHUB — Free ${escapeHtml(calc.title)}`,
    `  </a>`,
    `</p>`,
  ].join("\n");

  // Script embed — auto-renders with proper sizing
  const script = [
    `<div id="qfinhub-widget-${slug}"></div>`,
    `<script>`,
    `(function(){`,
    `  var w=document.getElementById("qfinhub-widget-${slug}");`,
    `  if(!w)return;`,
    `  var i=document.createElement("iframe");`,
    `  i.src="${widgetUrl}";`,
    `  i.title="${escapeAttr(calc.title)}";`,
    `  i.style.width="100%";`,
    `  i.style.border="none";`,
    `  i.style.overflow="hidden";`,
    `  i.setAttribute("loading","lazy");`,
    `  i.setAttribute("referrerpolicy","strict-origin-when-cross-origin");`,
    `  w.appendChild(i);`,
    `  function resize(){`,
    `    i.style.height=Math.min(document.documentElement.scrollHeight||500,800)+"px";`,
    `  }`,
    `  window.addEventListener("message",function(e){`,
    `    if(e.data&&e.data.type==="qfinhub-resize"&&e.data.height){`,
    `      i.style.height=Math.min(e.data.height,800)+"px";`,
    `    }`,
    `  });`,
    `  setTimeout(resize,500);`,
    `  setTimeout(resize,1000);`,
    `})();`,
    `</script>`,
    `<p style="text-align:center;font-size:12px;color:#888;margin-top:4px;">`,
    `  <a href="${calcUrl}" target="_blank" rel="noopener" style="color:#888;text-decoration:none;">`,
    `    Powered by QFINHUB — Free ${escapeHtml(calc.title)}`,
    `  </a>`,
    `</p>`,
  ].join("\n");

  // HTML block — for direct paste into HTML-based sites
  const html = [
    `<!-- QFINHUB ${escapeAttr(calc.title)} Widget -->`,
    `<div style="width:100%;max-width:800px;margin:20px auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">`,
    `  <iframe`,
    `    src="${widgetUrl}"`,
    `    title="${escapeAttr(calc.title)}"`,
    `    width="100%"`,
    `    height="500"`,
    `    frameborder="0"`,
    `    loading="lazy"`,
    `    style="display:block;width:100%;border:none;"`,
    `    referrerpolicy="strict-origin-when-cross-origin"`,
    `  ></iframe>`,
    `  <div style="padding:8px 16px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">`,
    `    <a href="${calcUrl}" target="_blank" rel="noopener" style="font-size:12px;color:#6b7280;text-decoration:none;">`,
    `      Powered by QFINHUB — Free ${escapeHtml(calc.title)}`,
    `    </a>`,
    `  </div>`,
    `</div>`,
  ].join("\n");

  return { iframe, script, html };
}

/**
 * Get ALL calculators that have widget implementations (have a registered component).
 */
export function getWidgetEnabledCalculators() {
  return allCalculators.filter((calc) => {
    // Only return calculators that have working implementations
    return calc.slug !== "basic-calculator"; // exclude basic
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
