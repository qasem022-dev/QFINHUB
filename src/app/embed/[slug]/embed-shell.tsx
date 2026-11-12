'use client';

/**
 * Client shell for the white-label embed.
 *
 * Kept separate from the route so the route can stay a server component and do
 * licence validation — if this file decided whether to show the badge, a visitor
 * could read the bundle and strip it.
 */

import { Suspense, useEffect, useState } from "react";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { Loader2 } from "lucide-react";

type Props = {
  slug: string;
  title: string;
  brand: string;
  color: string;
  showBadge: boolean;
  leadCapture: boolean;
  licenceKey: string;
};

export function EmbedShell({
  slug,
  title,
  brand,
  color,
  showBadge,
  leadCapture,
  licenceKey,
}: Props) {
  const CalculatorComponent = getCalculatorComponent(slug);

  // Tell the host page how tall we are so the iframe never traps the visitor in
  // an inner scrollbar. Fires repeatedly because results change the height.
  useEffect(() => {
    if (window.parent === window) return;

    function report() {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({ type: "qfinhub:height", height }, "*");
    }

    report();
    const t1 = setTimeout(report, 300);
    const t2 = setTimeout(report, 1200);

    const observer = new MutationObserver(report);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener("resize", report);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      window.removeEventListener("resize", report);
    };
  }, []);

  return (
    <div
      className="w-full bg-white dark:bg-surface-dark"
      style={{ "--qf-brand": color } as React.CSSProperties}
    >
      {brand ? (
        <div className="flex items-center gap-2 border-b border-gray-100 px-1 pb-3 dark:border-gray-800">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {brand}
          </span>
        </div>
      ) : null}

      {CalculatorComponent ? (
        <Suspense
          fallback={
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          }
        >
          <CalculatorComponent />
        </Suspense>
      ) : (
        <div className="flex min-h-[280px] items-center justify-center p-8 text-center">
          <p className="text-sm text-gray-400">{title} is not available yet.</p>
        </div>
      )}

      {leadCapture ? (
        <LeadForm slug={slug} title={title} colour={color} licenceKey={licenceKey} />
      ) : null}

      {showBadge ? (
        <div className="border-t border-gray-100 py-2.5 text-center dark:border-gray-800">
          <a
            href={`https://www.qfinhub.com/calculators/${slug}?utm_source=embed&utm_medium=widget&utm_campaign=powered_by`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] tracking-wide text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Powered by QFINHUB — free financial calculators
          </a>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Lead capture.
 *
 * This is the entire commercial difference between "$0 widget" and "$499/month":
 * a competitor's free calculator hands the enquiry to nobody. This one delivers
 * it to the institution that owns the page.
 */
function LeadForm({
  slug,
  title,
  colour,
  licenceKey,
}: {
  slug: string;
  title: string;
  colour: string;
  licenceKey: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real people never fill a hidden field.
    if (String(data.get("company_website") || "").length > 0) {
      setStatus("done");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/embed/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: licenceKey,
          calculator: slug,
          calculatorTitle: title,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          consent: data.get("consent") === "on",
        }),
      });
      setStatus(res.ok ? "done" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 p-4 text-center dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Thanks — someone will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
    >
      <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Want a personalised quote?
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Your name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <input
          name="phone"
          type="tel"
          maxLength={30}
          placeholder="Phone (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
        />
      </div>

      {/* Honeypot — hidden from humans, irresistible to bots. */}
      <input
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
        <input name="consent" type="checkbox" required className="mt-0.5" />
        <span>
          I agree to be contacted about my enquiry. My details are sent to the
          business whose calculator this is.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: colour }}
      >
        {status === "sending" ? "Sending…" : "Get my quote"}
      </button>

      {status === "error" ? (
        <p className="mt-2 text-xs text-red-600">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </form>
  );
}
