"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ChildCareCostCalculator() {
  const [daycare, setDaycare] = React.useState(1200);
  const [nanny, setNanny] = React.useState(2000);
  const [afterSchool, setAfterSchool] = React.useState(500);
  const [summerCamp, setSummerCamp] = React.useState(2000);
  const [numChildren, setNumChildren] = React.useState(2);

  const safeDaycare = isFinite(daycare) ? daycare : 0;
  const safeNanny = isFinite(nanny) ? nanny : 0;
  const safeAfter = isFinite(afterSchool) ? afterSchool : 0;
  const safeSummer = isFinite(summerCamp) ? summerCamp : 0;
  const safeChildren = isFinite(numChildren) ? numChildren : 0;

  const monthlyTotal = safeDaycare + safeNanny + safeAfter + safeSummer / 12;
  const annualTotal = monthlyTotal * 12;
  const costPerChild = safeChildren > 0 ? annualTotal / safeChildren : 0;

  const pieData = [
    { name: "Daycare", value: safeDaycare * 12 },
    { name: "Nanny", value: safeNanny * 12 },
    { name: "After-School", value: safeAfter * 12 },
    { name: "Summer Camp", value: safeSummer },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Child Care Cost"
      description="Calculate the total cost of child care including daycare, nanny, after-school programs, and summer camp."
      icon={<span>👶</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Monthly Cost" value={formatCurrency(monthlyTotal)} highlight />
          <ResultCard label="Annual Cost" value={formatCurrency(annualTotal)} />
          <ResultCard label="Cost Per Child" value={formatCurrency(costPerChild)} />
          <ResultCard label="Number of Children" value={formatNumber(safeChildren)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Annual Cost Breakdown" />
      <CalculatorInput input={{ id: "daycare", label: "Daycare (Monthly)", type: "number", defaultValue: 1200, suffix: "$", min: 0, tooltip: "Monthly daycare center costs." }} value={daycare} onChange={setDaycare} />
      <CalculatorInput input={{ id: "nanny", label: "Nanny (Monthly)", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Monthly nanny or babysitter costs." }} value={nanny} onChange={setNanny} />
      <CalculatorInput input={{ id: "after-school", label: "After-School (Monthly)", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Monthly after-school program costs." }} value={afterSchool} onChange={setAfterSchool} />
      <CalculatorInput input={{ id: "summer-camp", label: "Summer Camp (Annual)", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Annual summer camp costs." }} value={summerCamp} onChange={setSummerCamp} />
      <CalculatorInput input={{ id: "num-children", label: "Number of Children", type: "number", defaultValue: 2, suffix: "kids", min: 1, max: 10, tooltip: "Number of children needing care." }} value={numChildren} onChange={setNumChildren} />
    </CalculatorLayout>
  );
}
