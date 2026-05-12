"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function CalorieCalculator() {
  const [age, setAge] = React.useState(30);
  const [gender, setGender] = React.useState(0); // 0=male, 1=female
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(175);
  const [activityLevel, setActivityLevel] = React.useState(1); // 1=Light

  const safeAge = isNaN(age) ? 30 : age;
  const safeWeight = isNaN(weight) ? 70 : weight;
  const safeHeight = isNaN(height) ? 175 : height;

  // BMR using Mifflin-St Jeor
  const bmr = gender === 0
    ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5
    : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;

  const activityMultipliers: number[] = [1.2, 1.375, 1.55, 1.725, 1.9];
  const activityLabels: string[] = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"];

  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.375);
  const loseWeight = tdee - 500;
  const gainWeight = tdee + 500;

  return (
    <CalculatorLayout
      title="Calorie Calculator"
      description="Calculate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) to manage your weight."
      icon={<span>🔥</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Basal Metabolic Rate (BMR)" value={formatNumber(bmr)} highlight />
          <ResultCard label="Daily Calories (TDEE)" value={formatNumber(tdee)} subtext={`${activityLabels[activityLevel]} activity`} />
          <ResultCard label="Weight Loss (−500 cal/day)" value={formatNumber(loseWeight)} />
          <ResultCard label="Weight Gain (+500 cal/day)" value={formatNumber(gainWeight)} />
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "age", label: "Age", type: "number", defaultValue: 30, suffix: "years", min: 10, max: 120, tooltip: "Your age in years." }}
        value={age}
        onChange={setAge}
      />
      <CalculatorInput
        input={{ id: "gender", label: "Gender", type: "select", defaultValue: 0, options: [{ label: "Male", value: 0 }, { label: "Female", value: 1 }], tooltip: "Biological sex for BMR calculation." }}
        value={gender}
        onChange={setGender}
      />
      <CalculatorInput
        input={{ id: "weight", label: "Weight", type: "number", defaultValue: 70, suffix: "kg", min: 1, max: 400, tooltip: "Your body weight in kilograms." }}
        value={weight}
        onChange={setWeight}
      />
      <CalculatorInput
        input={{ id: "height", label: "Height", type: "number", defaultValue: 175, suffix: "cm", min: 50, max: 300, tooltip: "Your height in centimeters." }}
        value={height}
        onChange={setHeight}
      />
      <CalculatorInput
        input={{ id: "activityLevel", label: "Activity Level", type: "select", defaultValue: 1, options: [{ label: "Sedentary (1.2)", value: 0 }, { label: "Lightly Active (1.375)", value: 1 }, { label: "Moderately Active (1.55)", value: 2 }, { label: "Very Active (1.725)", value: 3 }, { label: "Extra Active (1.9)", value: 4 }], tooltip: "Your typical daily activity level." }}
        value={activityLevel}
        onChange={setActivityLevel}
      />
    </CalculatorLayout>
  );
}
