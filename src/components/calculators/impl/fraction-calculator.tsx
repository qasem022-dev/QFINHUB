"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export default function FractionCalculator() {
  const [num1, setNum1] = React.useState(1);
  const [den1, setDen1] = React.useState(2);
  const [num2, setNum2] = React.useState(1);
  const [den2, setDen2] = React.useState(3);
  const [operation, setOperation] = React.useState(0); // 0=add, 1=sub, 2=mul, 3=div

  let resultNum = 0;
  let resultDen = 1;

  const safeNum1 = isFinite(num1) ? num1 : 0;
  const safeDen1 = isFinite(den1) && den1 !== 0 ? Math.abs(den1) : 1;
  const safeNum2 = isFinite(num2) ? num2 : 0;
  const safeDen2 = isFinite(den2) && den2 !== 0 ? Math.abs(den2) : 1;

  switch (operation) {
    case 0: // Add
      resultNum = safeNum1 * safeDen2 + safeNum2 * safeDen1;
      resultDen = safeDen1 * safeDen2;
      break;
    case 1: // Subtract
      resultNum = safeNum1 * safeDen2 - safeNum2 * safeDen1;
      resultDen = safeDen1 * safeDen2;
      break;
    case 2: // Multiply
      resultNum = safeNum1 * safeNum2;
      resultDen = safeDen1 * safeDen2;
      break;
    case 3: // Divide
      resultNum = safeNum1 * safeDen2;
      resultDen = safeDen1 * safeNum2;
      break;
  }

  // Simplify
  const absNum = Math.abs(resultNum);
  const g = resultDen !== 0 && resultNum !== 0 ? gcd(resultNum, resultDen) : 1;
  const simplifiedNum = resultDen !== 0 ? resultNum / g : 0;
  const simplifiedDen = resultDen !== 0 ? resultDen / g : 1;

  const decimalValue = simplifiedDen !== 0 ? simplifiedNum / simplifiedDen : 0;

  const operationLabels: string[] = ["Add", "Subtract", "Multiply", "Divide"];
  const operationLabel = operationLabels[operation] ?? "Add";

  return (
    <CalculatorLayout
      title="Fraction Calculator"
      description="Add, subtract, multiply, and divide fractions. Results shown as simplified fractions and decimals."
      icon={<span>➗</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Result (Fraction)" value={`${simplifiedNum} / ${simplifiedDen}`} highlight />
          <ResultCard label="Result (Decimal)" value={formatNumber(decimalValue, 4)} />
          <ResultCard label="Operation" value={operationLabel} />
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "num1", label: "First Numerator", type: "number", defaultValue: 1, tooltip: "Numerator of the first fraction." }}
        value={num1}
        onChange={setNum1}
      />
      <CalculatorInput
        input={{ id: "den1", label: "First Denominator", type: "number", defaultValue: 2, min: 1, tooltip: "Denominator of the first fraction (cannot be zero)." }}
        value={den1}
        onChange={setDen1}
      />
      <CalculatorInput
        input={{ id: "num2", label: "Second Numerator", type: "number", defaultValue: 1, tooltip: "Numerator of the second fraction." }}
        value={num2}
        onChange={setNum2}
      />
      <CalculatorInput
        input={{ id: "den2", label: "Second Denominator", type: "number", defaultValue: 3, min: 1, tooltip: "Denominator of the second fraction (cannot be zero)." }}
        value={den2}
        onChange={setDen2}
      />
      <CalculatorInput
        input={{ id: "operation", label: "Operation", type: "select", defaultValue: 0, options: [{ label: "Add (+)", value: 0 }, { label: "Subtract (−)", value: 1 }, { label: "Multiply (×)", value: 2 }, { label: "Divide (÷)", value: 3 }], tooltip: "Choose the fraction operation." }}
        value={operation}
        onChange={setOperation}
      />
    </CalculatorLayout>
  );
}
