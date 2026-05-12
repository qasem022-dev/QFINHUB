"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Sparkles } from "lucide-react";
import { getCalculatorComponent } from "@/components/calculators/registry";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type CategoryType,
} from "@/types/calculator";
import { useTranslation } from "@/app/i18n-provider";
import type { CalculatorConfig } from "@/types/calculator";
import { cn } from "@/lib/utils";

interface CalculatorListingClientProps {
  calculators: CalculatorConfig[];
  categories: string[];
  initialSearch: string;
  initialCategory: string;
}

export function CalculatorListingClient({
  calculators: allCalculators,
  categories,
  initialSearch,
  initialCategory,
}: CalculatorListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [search, setSearch] = React.useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = React.useState(initialCategory);

  const filteredCalculators = allCalculators.filter((calc) => {
    const matchesSearch =
      search === "" ||
      calc.title.toLowerCase().includes(search.toLowerCase()) ||
      calc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || calc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const implementedSlugs = React.useMemo(() => {
    const slugs = new Set<string>();
    for (const calc of allCalculators) {
      if (getCalculatorComponent(calc.slug)) {
        slugs.add(calc.slug);
      }
    }
    return slugs;
  }, [allCalculators]);

  const implementedCount = implementedSlugs.size;

  const grouped = filteredCalculators.reduce<
    Record<string, typeof allCalculators>
  >((acc, calc) => {
    const cat = calc.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(calc);
    return acc;
  }, {});

  const updateUrl = React.useCallback(
    (newSearch: string, newCategory: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("q", newSearch);
      if (newCategory && newCategory !== "all") params.set("cat", newCategory);
      const qs = params.toString();
      router.replace(`/calculators${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateUrl(value, categoryFilter);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    updateUrl(search, value);
  };

  return (
    <>
      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            type="text"
            placeholder={t('calcList.search')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 transition-all duration-200 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('calcList.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calcList.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as CategoryType] ?? cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count indicator */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in" key={`count-${filteredCalculators.length}-${categoryFilter}`}>
          {filteredCalculators.length === 0
            ? t('calcList.noResults')
            : filteredCalculators.length === 1
              ? "1 calculator found"
              : `${filteredCalculators.length} calculators found`}
        </p>
      </div>

      {/* Calculator Grid Grouped by Category */}
      {Object.entries(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {search
              ? t('calcList.noResults')
              : "No calculators available"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {search
              ? t('calcList.noResultsDesc')
              : "All calculators will appear here once they are implemented."}
          </p>
          {search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => handleSearchChange("")}
            >
              {t('dashboard.clearSearch') || "Clear Search"}
            </Button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([category, calculators]) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{CATEGORY_LABELS[category as CategoryType] ?? category}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-normal text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {calculators.length}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {calculators.map((calc, idx) => {
                const isImplemented = implementedSlugs.has(calc.slug);
                const card = (
                  <Card className={`h-full transition-all duration-300 border-gray-200 dark:border-gray-700 animate-fade-in ${
                    isImplemented
                      ? 'cursor-pointer hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5 dark:hover:border-primary-600'
                      : 'opacity-70'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-lg dark:bg-primary-900/30">
                          <span>{calc.icon}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!isImplemented && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 border-purple-200 dark:from-purple-900/20 dark:to-blue-900/20 dark:text-purple-400 dark:border-purple-800"
                            >
                              <Sparkles className="mr-1 h-2.5 w-2.5" />
                              {t('calcList.comingSoon')}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={CATEGORY_COLORS[calc.category as CategoryType] ?? ""}
                          >
                            {CATEGORY_LABELS[calc.category as CategoryType] ?? calc.category}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className={`mt-3 text-sm font-semibold text-gray-900 dark:text-white ${
                        isImplemented
                          ? 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          : ''
                      }`}>
                        {calc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {calc.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
                if (isImplemented) {
                  return (
                    <Link
                      key={calc.id}
                      href={`/calculators/${calc.slug}`}
                      className="group block w-full text-left"
                    >
                      {card}
                    </Link>
                  );
                }
                return (
                  <div key={calc.id} className="w-full text-left">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
