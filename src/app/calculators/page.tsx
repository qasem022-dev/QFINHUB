"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  allCalculators,
  getAllCategories,
} from "@/lib/calculators";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type CategoryType,
} from "@/types/calculator";

export default function CalculatorsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const categories = getAllCategories();

  const filteredCalculators = allCalculators.filter((calc) => {
    const matchesSearch =
      search === "" ||
      calc.title.toLowerCase().includes(search.toLowerCase()) ||
      calc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || calc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = filteredCalculators.reduce<
    Record<string, typeof allCalculators>
  >((acc, calc) => {
    const cat = calc.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(calc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Financial Calculators
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Choose from {allCalculators.length}+ professional financial calculators
          to analyze loans, investments, retirement, and more.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search calculators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calculator Grid Grouped by Category */}
      {Object.entries(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No calculators found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter to find what you&apos;re looking
            for.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, calculators]) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {CATEGORY_LABELS[category as CategoryType]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {calculators.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => router.push(`/calculators/${calc.slug}`)}
                  className="group w-full text-left"
                >
                  <Card className="h-full cursor-pointer border-gray-200 transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:hover:border-primary-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-lg dark:bg-primary-900/30">
                          {typeof calc.icon === "string" ? (
                            <span>{calc.icon}</span>
                          ) : (
                            calc.icon
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={CATEGORY_COLORS[calc.category]}
                        >
                          {CATEGORY_LABELS[calc.category]}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                        {calc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {calc.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
