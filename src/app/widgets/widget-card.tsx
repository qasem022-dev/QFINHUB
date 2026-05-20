"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import type { CalculatorConfig } from "@/types/calculator";
import { CATEGORY_LABELS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";

interface WidgetCardProps {
  calculator: CalculatorConfig;
}

export function WidgetCard({ calculator }: WidgetCardProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const embedCode = `<iframe\n  src="https://www.qfinhub.com/widgets/embed/${calculator.slug}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  title="Free ${calculator.title} Calculator"\n  style="border: 1px solid #e4e4e7; border-radius: 12px;"\n></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = embedCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const category = calculator.category as CategoryType;
  const categoryLabel = CATEGORY_LABELS[category] || calculator.category;

  return (
    <div
      className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-200 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <div className="relative bg-zinc-50 rounded-t-xl border-b border-zinc-200 h-40 overflow-hidden">
        <iframe
          src={`https://www.qfinhub.com/widgets/embed/${calculator.slug}`}
          className="w-full h-full pointer-events-none"
          style={{
            transform: isHovered ? "scale(1.02)" : "scale(1)",
            transition: "transform 0.3s ease",
          }}
          title={`Preview: ${calculator.title}`}
          loading="lazy"
        />
        <div className="absolute inset-0 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-zinc-900 text-sm">
            {calculator.title}
          </h3>
          <span className="text-lg flex-shrink-0">{calculator.icon}</span>
        </div>
        <p className="text-xs text-zinc-500 mb-1 line-clamp-2">
          {calculator.description}
        </p>
        <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full self-start mb-3">
          {categoryLabel}
        </span>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Embed Code
              </>
            )}
          </button>
          <a
            href={`https://www.qfinhub.com/widgets/embed/${calculator.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-2.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            title="Open preview"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
