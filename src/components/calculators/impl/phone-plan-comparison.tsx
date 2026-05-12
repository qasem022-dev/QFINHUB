"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export default function PhonePlanComparison() {
  const [plan1Monthly, setPlan1Monthly] = React.useState(50);
  const [plan1Data, setPlan1Data] = React.useState(10);
  const [plan2Monthly, setPlan2Monthly] = React.useState(70);
  const [plan2Data, setPlan2Data] = React.useState(20);

  const safeP1 = isFinite(plan1Monthly) ? Math.max(0, plan1Monthly) : 0;
  const safeP1Data = isFinite(plan1Data) ? Math.max(0, plan1Data) : 0;
  const safeP2 = isFinite(plan2Monthly) ? Math.max(0, plan2Monthly) : 0;
  const safeP2Data = isFinite(plan2Data) ? Math.max(0, plan2Data) : 0;

  const plan1Annual = safeP1 * 12;
  const plan2Annual = safeP2 * 12;

  const plan1PerGB = safeP1Data > 0 ? safeP1 / safeP1Data : 0;
  const plan2PerGB = safeP2Data > 0 ? safeP2 / safeP2Data : 0;

  const savings = plan1Annual - plan2Annual;
  const cheaperPlan = savings > 0 ? "Plan 2" : savings < 0 ? "Plan 1" : "Same";

  const chartData = [
    { name: "Plan 1", "Monthly Cost": plan1Monthly, "Annual Cost": plan1Annual },
    { name: "Plan 2", "Monthly Cost": plan2Monthly, "Annual Cost": plan2Annual },
  ];

  return (
    <CalculatorLayout
      title="Phone Plan Comparison"
      description="Compare two phone plans based on monthly cost and data allowance to find the best value."
      icon={<span>📱</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Plan 1 Annual" value={formatCurrency(plan1Annual)} />
          <ResultCard label="Plan 2 Annual" value={formatCurrency(plan2Annual)} />
          <ResultCard label="Plan 1 Cost per GB" value={formatCurrency(plan1PerGB)} />
          <ResultCard label="Plan 2 Cost per GB" value={formatCurrency(plan2PerGB)} />
          <ResultCard label="Better Value" value={cheaperPlan} highlight subtext={`Save ${formatCurrency(Math.abs(savings))}/year`} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey={["Monthly Cost", "Annual Cost"]} title="Plan Comparison" height={250} />
      <CalculatorInput
        input={{ id: "plan1Monthly", label: "Plan 1 Monthly Cost", type: "number", defaultValue: 50, suffix: "$", min: 0, tooltip: "Monthly cost of plan 1." }}
        value={plan1Monthly}
        onChange={setPlan1Monthly}
      />
      <CalculatorInput
        input={{ id: "plan1Data", label: "Plan 1 Data", type: "number", defaultValue: 10, suffix: "GB", min: 0, tooltip: "Data allowance of plan 1 in GB." }}
        value={plan1Data}
        onChange={setPlan1Data}
      />
      <CalculatorInput
        input={{ id: "plan2Monthly", label: "Plan 2 Monthly Cost", type: "number", defaultValue: 70, suffix: "$", min: 0, tooltip: "Monthly cost of plan 2." }}
        value={plan2Monthly}
        onChange={setPlan2Monthly}
      />
      <CalculatorInput
        input={{ id: "plan2Data", label: "Plan 2 Data", type: "number", defaultValue: 20, suffix: "GB", min: 0, tooltip: "Data allowance of plan 2 in GB." }}
        value={plan2Data}
        onChange={setPlan2Data}
      />
    </CalculatorLayout>
  );
}
