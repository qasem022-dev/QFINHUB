'use client';

import { Suspense } from "react";
import { useParams, notFound } from "next/navigation";
import { getCalculatorBySlug } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/app/i18n-provider";

export default function EmbedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useTranslation();

  const calculator = getCalculatorBySlug(slug);
  const CalculatorComponent = getCalculatorComponent(slug);

  // Calculator not found at all
  if (!calculator) {
    notFound();
  }

  // Calculator found but no component registered yet
  if (!CalculatorComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8 dark:bg-surface-dark">
        <div className="text-center">
          <div className="mb-3 text-5xl opacity-30">
            {typeof calculator.icon === "string"
              ? calculator.icon
              : "📊"}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {calculator.title} {t('embed.comingSoon')}
          </p>
          <div className="mt-6">
            <a
              href={`https://qfinhub.com/calculators/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {t('embed.poweredBy')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Full embed: just the calculator + subtle footer
  return (
    <div className="w-full bg-white dark:bg-surface-dark">
      <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}>
        <CalculatorComponent />
      </Suspense>
      <div className="border-t border-gray-100 py-2.5 text-center dark:border-gray-800">
        <a
          href={`https://qfinhub.com/calculators/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-wide text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {t('embed.poweredBy')}
        </a>
      </div>
    </div>
  );
}
