"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, ResultCard } from "..";
import { formatNumber } from "@/lib/utils";

export default function BasicCalculator() {
  const [num1, setNum1] = React.useState(100);
  const [num2, setNum2] = React.useState(50);
  const [operation, setOperation] = React.useState(0);

  const safeNum1 = isFinite(num1) ? num1 : 0;
  const safeNum2 = isFinite(num2) ? num2 : 0;

  const result = React.useMemo(() => {
    switch (operation) {
      case 0: return safeNum1 + safeNum2; // Add
      case 1: return safeNum1 - safeNum2; // Subtract
      case 2: return safeNum1 * safeNum2; // Multiply
      case 3: return safeNum2 !== 0 ? safeNum1 / safeNum2 : 0; // Divide
      default: return 0;
    }
  }, [safeNum1, safeNum2, operation]);

  const operationLabel = ["Add", "Subtract", "Multiply", "Divide"][operation] ?? "Add";
  const sum = safeNum1 + safeNum2;
  const diff = safeNum1 - safeNum2;
  const prod = safeNum1 * safeNum2;
  const quot = safeNum2 !== 0 ? safeNum1 / safeNum2 : 0;

  return (
    <CalculatorLayout
      title="Basic Calculator"
      description="Perform basic arithmetic operations: addition, subtraction, multiplication, and division."
      icon={<span>🔢</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Result" value={formatNumber(result, 2)} highlight />
          <ResultCard label="Operation" value={operationLabel} />
          <ResultCard label="Sum" value={formatNumber(sum, 2)} subtext={`${safeNum1} + ${safeNum2}`} />
          <ResultCard label="Difference" value={formatNumber(diff, 2)} subtext={`${safeNum1} − ${safeNum2}`} />
          <ResultCard label="Product" value={formatNumber(prod, 2)} subtext={`${safeNum1} × ${safeNum2}`} />
          <ResultCard label="Quotient" value={safeNum2 !== 0 ? formatNumber(quot, 4) : "Undefined (÷ by 0)"} subtext={safeNum2 !== 0 ? `${safeNum1} ÷ ${safeNum2}` : "Cannot divide by zero"} />
        </div>
      }
    >
      <CalculatorInput
        input={{ id: "num1", label: "First Number", type: "number", defaultValue: 100, min: -999999999, tooltip: "First number for the operation." }}
        value={num1}
        onChange={setNum1}
      />
      <CalculatorInput
        input={{ id: "num2", label: "Second Number", type: "number", defaultValue: 50, min: -999999999, tooltip: "Second number for the operation." }}
        value={num2}
        onChange={setNum2}
      />
      <CalculatorInput
        input={{ id: "operation", label: "Operation", type: "select", defaultValue: 0, options: [{ label: "Add (+)", value: 0 }, { label: "Subtract (−)", value: 1 }, { label: "Multiply (×)", value: 2 }, { label: "Divide (÷)", value: 3 }], tooltip: "Choose the arithmetic operation." }}
        value={operation}
        onChange={setOperation}
      />
    </CalculatorLayout>
  );
}
