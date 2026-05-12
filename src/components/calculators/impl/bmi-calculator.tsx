"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function BMICalculator() {
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(175);
  const [useImperial, setUseImperial] = React.useState(0);

  const safeWeight = isFinite(weight) ? Math.max(1, weight) : 70;
  const safeHeight = isFinite(height) ? Math.max(1, height) : 175;
  const weightKg = useImperial === 1 ? safeWeight * 0.453592 : safeWeight;
  const heightCm = useImperial === 1 ? safeHeight * 2.54 : safeHeight;
  const heightM = heightCm / 100;

  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

  let category = "";
  let categoryColor = "";

  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-blue-600";
  } else if (bmi < 25) {
    category = "Normal";
    categoryColor = "text-green-600";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-yellow-600";
  } else {
    category = "Obese";
    categoryColor = "text-red-600";
  }

  const healthyMin = 18.5 * heightM * heightM;
  const healthyMax = 24.9 * heightM * heightM;

  const indicatorPosition = Math.min(Math.max((bmi / 40) * 100, 0), 100);

  return (
    <CalculatorLayout
      title="BMI Calculator"
      description="Calculate your Body Mass Index (BMI) based on your height and weight, and see which category you fall into."
      icon={<span>⚖️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Your BMI" value={formatNumber(bmi, 1)} highlight />
          <ResultCard label="Category" value={category} subtext={`BMI ${formatNumber(bmi, 1)} — ${category}`} />
          <ResultCard label="Healthy Weight Range" value={`${formatNumber(healthyMin, 1)} – ${formatNumber(healthyMax, 1)} kg`} />
          <div className="mt-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BMI Scale</div>
            <div className="relative h-4 w-full rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500">
              <div
                className="absolute top-0 h-4 w-1 bg-white border-2 border-gray-800 rounded-full shadow-md transition-all"
                style={{ left: `${indicatorPosition}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>16</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40+</span>
            </div>
          </div>
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "weight", label: "Weight", type: "number", defaultValue: 70, suffix: useImperial === 1 ? "lbs" : "kg", min: 1, max: 500, tooltip: "Your body weight." }}
        value={weight}
        onChange={setWeight}
      />
      <CalculatorInput
        input={{ id: "height", label: "Height", type: "number", defaultValue: 175, suffix: useImperial === 1 ? "in" : "cm", min: 1, max: 300, tooltip: "Your height." }}
        value={height}
        onChange={setHeight}
      />
      <CalculatorInput
        input={{ id: "useImperial", label: "Units", type: "select", defaultValue: 0, options: [{ label: "Metric (kg / cm)", value: 0 }, { label: "Imperial (lbs / in)", value: 1 }], tooltip: "Choose your preferred unit system." }}
        value={useImperial}
        onChange={setUseImperial}
      />
    </CalculatorLayout>
  );
}
