"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const STATES = ["PA", "NJ", "KY", "MD", "IA", "NE", "None"] as const;
const STATE_LABELS = [
  "Pennsylvania (PA)",
  "New Jersey (NJ)",
  "Kentucky (KY)",
  "Maryland (MD)",
  "Iowa (IA)",
  "Nebraska (NE)",
  "No Inheritance Tax",
];
const RELATIONSHIPS = ["Spouse", "Child", "Sibling", "Other"] as const;

const STATE_RATES: Record<string, Record<string, number>> = {
  PA: { Spouse: 0, Child: 4.5, Sibling: 12, Other: 15 },
  NJ: { Spouse: 0, Child: 0, Sibling: 15, Other: 15 },
  KY: { Spouse: 0, Child: 5, Sibling: 12, Other: 16 },
  MD: { Spouse: 0, Child: 5, Sibling: 10, Other: 10 },
  IA: { Spouse: 0, Child: 5, Sibling: 10, Other: 15 },
  NE: { Spouse: 0, Child: 5, Sibling: 11, Other: 18 },
};

export default function InheritanceTaxCalculator() {
  const [inheritanceAmount, setInheritanceAmount] = React.useState(500000);
  const [stateIdx, setStateIdx] = React.useState(0);
  const [relationshipIdx, setRelationshipIdx] = React.useState(0);

  const safeAmount = Math.max(0, isFinite(inheritanceAmount) ? inheritanceAmount : 0);
  const stateKey = STATES[stateIdx]!;
  const relationship = RELATIONSHIPS[relationshipIdx]!;

  const getTaxRate = () => {
    if (stateKey === "None") return 0;
    const stateData = STATE_RATES[stateKey];
    if (!stateData) return 0;
    return (stateData[relationship] ?? stateData.Other ?? 15) / 100;
  };

  const taxRate = getTaxRate();
  const taxAmount = safeAmount * taxRate;
  const netInheritance = safeAmount - taxAmount;
  const effectiveRate = taxRate * 100;

  const pieData = [
    { name: "Tax Amount", value: Math.round(taxAmount) },
    { name: "Net Inheritance", value: Math.round(netInheritance) },
  ];

  return (
    <CalculatorLayout
      title="Inheritance Tax Calculator"
      description="Calculate inheritance tax based on state and relationship to the deceased. Only 6 states impose an inheritance tax."
      icon={<span>💰</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Tax Rate Applied" value={formatPercentage(effectiveRate)} subtext={`${STATE_LABELS[stateIdx]} — ${relationship}`} />
          <ResultCard label="Tax Amount" value={formatCurrency(taxAmount)} />
          <ResultCard label="Net Inheritance" value={formatCurrency(netInheritance)} highlight />
          <ResultCard label="Gross Inheritance" value={formatCurrency(safeAmount)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Inheritance Breakdown" />
      <CalculatorInput
        input={{ id: "inheritanceAmount", label: "Inheritance Amount", type: "number", defaultValue: 500000, suffix: "$", min: 0, step: 10000, tooltip: "The total value of the inheritance received." }}
        value={inheritanceAmount}
        onChange={setInheritanceAmount}
      />
      <CalculatorInput
        input={{ id: "state", label: "State", type: "select", defaultValue: 0, options: STATE_LABELS.map((label, i) => ({ label, value: i })), tooltip: "Only 6 states impose inheritance tax: PA, NJ, KY, MD, IA, NE. Select 'None' if your state does not have one." }}
        value={stateIdx}
        onChange={setStateIdx}
      />
      <CalculatorInput
        input={{ id: "relationship", label: "Relationship", type: "select", defaultValue: 0, options: RELATIONSHIPS.map((label, i) => ({ label, value: i })), tooltip: "Inheritance tax rates vary based on your relationship to the deceased. Spouses are typically exempt." }}
        value={relationshipIdx}
        onChange={setRelationshipIdx}
      />
    </CalculatorLayout>
  );
}
