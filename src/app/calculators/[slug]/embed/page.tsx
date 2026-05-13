'use client';

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Code2, Smartphone, Globe, Check } from "lucide-react";
import { useState } from "react";
import { getCalculatorBySlug } from "@/lib/calculators";
import { generateWidgetCode } from "@/lib/widgets/generator";
import { getCalculatorComponent } from "@/components/calculators/registry";

export default function EmbedCodePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const calc = getCalculatorBySlug(slug);
  const hasImplementation = !!getCalculatorComponent(slug);
  const widgetCode = generateWidgetCode(slug);

  if (!calc || !widgetCode || !hasImplementation) {
    notFound();
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const WidgetCodeDisplay = ({
    label,
    code,
    id,
  }: {
    label: string;
    code: string;
    id: string;
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark-elevated">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {copiedId === id ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation */}
        <Link href={`/calculators/${slug}`}>
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to {calc.title}
          </span>
        </Link>

        {/* Header */}
        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Embed {calc.title} Widget
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Add a free, interactive {calc.title} to your website. Your visitors
            can use it directly on your site.
          </p>
        </div>

        {/* Preview */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Preview
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
            <iframe
              src={`/api/widget/${slug}`}
              title={`${calc.title} widget preview`}
              width="100%"
              height="450"
              style={{ border: "none", display: "block" }}
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            This is how the widget will appear on your site. It adapts to
            light/dark mode automatically.
          </p>
        </div>

        {/* Quick Install */}
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">
                Quick Setup
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Copy the iframe code below and paste it into any webpage or CMS
                that supports HTML. Works with WordPress, Wix, Squarespace,
                Shopify, Webflow, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Embed Codes */}
        <div className="space-y-6">
          <WidgetCodeDisplay
            label="Iframe Embed (recommended — works everywhere)"
            code={widgetCode.iframe}
            id="copy-iframe"
          />
          <WidgetCodeDisplay
            label="Script Embed (auto-sizing, responsive)"
            code={widgetCode.script}
            id="copy-script"
          />
          <WidgetCodeDisplay
            label="Full HTML Block (styled box with attribution)"
            code={widgetCode.html}
            id="copy-html"
          />
        </div>

        {/* WordPress Shortcode Info */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-surface-dark-elevated">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <Globe className="h-4 w-4 text-primary-500" />
            WordPress Users
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            In the WordPress block editor (Gutenberg), add a{" "}
            <strong>Custom HTML</strong> block and paste the{" "}
            <strong>Iframe Embed</strong> code above. In the classic editor,
            switch to the &quot;Text&quot; tab and paste the code where you want
            the calculator to appear.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            The widget is fully responsive and works on mobile, tablet, and
            desktop.
          </p>
        </div>

        {/* Backlink benefits */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
            Why add this to your site?
          </h3>
          <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
            <li>
              ✅ Provide a useful interactive tool for your readers — they stay
              longer on your site
            </li>
            <li>
              ✅ No coding required — just copy and paste
            </li>
            <li>
              ✅ Free — no sign-up, no API key, no limits
            </li>
            <li>✅ Works on any website platform</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
