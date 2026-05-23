"use client";

import { useState, useRef, useCallback } from "react";
import { Share2, Download, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareCardProps {
  calculatorName: string;
  resultLabel: string;
  resultValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  details?: { label: string; value: string }[];
  url: string;
}

export function ShareableResultCard({
  calculatorName,
  resultLabel,
  resultValue,
  secondaryLabel,
  secondaryValue,
  details,
  url,
}: ShareCardProps) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#0f172a",
      });
      const link = document.createElement("a");
      link.download = `qfinhub-${calculatorName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error("Download failed:", e);
    }
  }, [calculatorName]);

  return (
    <div className="mt-6">
      {/* Trigger Button */}
      <Button
        onClick={() => setShowCard(!showCard)}
        variant="outline"
        className="gap-2 text-sm"
      >
        <Share2 className="h-4 w-4" />
        Share Your Result
      </Button>

      {/* Shareable Card Modal */}
      {showCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Close bar */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-lg">Share Your Result</h3>
              <button
                onClick={() => setShowCard(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* The Shareable Card */}
            <div className="p-4">
              <div
                ref={cardRef}
                className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white"
                style={{ minWidth: 320 }}
              >
                {/* QFINHUB Brand */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold">
                    QF
                  </div>
                  <span className="text-sm font-medium text-indigo-300">
                    QFINHUB
                  </span>
                </div>

                {/* Calculator Name */}
                <p className="text-xs text-indigo-300/70 mb-2 uppercase tracking-wider">
                  {calculatorName}
                </p>

                {/* Main Result */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-1">{resultLabel}</p>
                  <p className="text-4xl font-bold text-white tracking-tight">
                    {resultValue}
                  </p>
                  {secondaryLabel && secondaryValue && (
                    <p className="text-sm text-slate-400 mt-1">
                      {secondaryLabel}:{" "}
                      <span className="text-indigo-300 font-medium">
                        {secondaryValue}
                      </span>
                    </p>
                  )}
                </div>

                {/* Detail Rows */}
                {details && details.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-3 mt-3 space-y-1.5">
                    {details.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-400">{d.label}</span>
                        <span className="text-slate-200 font-medium">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">
                    qfinhub.com
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Free • No Signup
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={downloadCard}
                  variant="default"
                  className="flex-1 gap-2 text-sm bg-indigo-600 hover:bg-indigo-700"
                >
                  {downloaded ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloaded ? "Saved!" : "Download Card"}
                </Button>
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="flex-1 gap-2 text-sm"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
