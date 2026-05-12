"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function HomeRenovationCalculator() {
  const [livingRoom, setLivingRoom] = React.useState(8000);
  const [kitchen, setKitchen] = React.useState(25000);
  const [bathroom, setBathroom] = React.useState(15000);
  const [bedroom, setBedroom] = React.useState(5000);
  const [basement, setBasement] = React.useState(20000);
  const [materialRatio, setMaterialRatio] = React.useState(50);
  const [laborRatio, setLaborRatio] = React.useState(50);

  const safeLivingRoom = isFinite(livingRoom) ? Math.max(0, livingRoom) : 0;
  const safeKitchen = isFinite(kitchen) ? Math.max(0, kitchen) : 0;
  const safeBathroom = isFinite(bathroom) ? Math.max(0, bathroom) : 0;
  const safeBedroom = isFinite(bedroom) ? Math.max(0, bedroom) : 0;
  const safeBasement = isFinite(basement) ? Math.max(0, basement) : 0;
  const safeMatRatio = isFinite(materialRatio) ? Math.max(0, Math.min(materialRatio, 100)) : 50;
  const safeLabRatio = isFinite(laborRatio) ? Math.max(0, Math.min(laborRatio, 100)) : 50;

  const rooms = [
    { name: "Living Room", cost: safeLivingRoom },
    { name: "Kitchen", cost: safeKitchen },
    { name: "Bathroom", cost: safeBathroom },
    { name: "Bedroom", cost: safeBedroom },
    { name: "Basement", cost: safeBasement },
  ];

  const totalCost = rooms.reduce((sum, r) => sum + r.cost, 0);
  const materialsCost = totalCost * (safeMatRatio / 100);
  const laborCost = totalCost * (safeLabRatio / 100);

  // Pie chart: room cost breakdown
  const pieData = rooms
    .filter((r) => r.cost > 0)
    .map((r) => ({
      name: r.name,
      value: Math.round(r.cost),
    }));

  // Bar chart: individual room costs
  const barData = rooms.map((r) => ({
    name: r.name,
    Cost: Math.round(r.cost),
  }));

  return (
    <CalculatorLayout
      title="Home Renovation Calculator"
      description="Budget home renovation projects with material costs, labor estimates, and ROI projections."
      icon={<span>🔨</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Project Cost" value={formatCurrency(totalCost)} highlight />
          <ResultCard label="Materials Cost" value={formatCurrency(materialsCost)} subtext={`${materialRatio}% of total`} />
          <ResultCard label="Labor Cost" value={formatCurrency(laborCost)} subtext={`${laborRatio}% of total`} />
          {rooms.map((r) => (
            <ResultCard
              key={r.name}
              label={`${r.name} Cost`}
              value={formatCurrency(r.cost)}
              subtext={totalCost > 0 ? `${((r.cost / totalCost) * 100).toFixed(1)}% of total` : ""}
            />
          ))}
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Cost by Room" />
      <CalculatorChart type="bar" data={barData} xKey="name" yKey={["Cost"]} title="Room Costs Breakdown" />
      <CalculatorInput
        input={{ id: "livingRoom", label: "Living Room Budget", type: "number", defaultValue: 8000, suffix: "$", min: 0, tooltip: "Budget allocated for living room renovations." }}
        value={livingRoom}
        onChange={setLivingRoom}
      />
      <CalculatorInput
        input={{ id: "kitchen", label: "Kitchen Budget", type: "number", defaultValue: 25000, suffix: "$", min: 0, tooltip: "Budget allocated for kitchen renovations." }}
        value={kitchen}
        onChange={setKitchen}
      />
      <CalculatorInput
        input={{ id: "bathroom", label: "Bathroom Budget", type: "number", defaultValue: 15000, suffix: "$", min: 0, tooltip: "Budget allocated for bathroom renovations." }}
        value={bathroom}
        onChange={setBathroom}
      />
      <CalculatorInput
        input={{ id: "bedroom", label: "Bedroom Budget", type: "number", defaultValue: 5000, suffix: "$", min: 0, tooltip: "Budget allocated for bedroom renovations." }}
        value={bedroom}
        onChange={setBedroom}
      />
      <CalculatorInput
        input={{ id: "basement", label: "Basement Budget", type: "number", defaultValue: 20000, suffix: "$", min: 0, tooltip: "Budget allocated for basement finishing or renovations." }}
        value={basement}
        onChange={setBasement}
      />
      <CalculatorInput
        input={{ id: "materialRatio", label: "Material Cost %", type: "slider", defaultValue: 50, suffix: "%", min: 10, max: 90, step: 5, tooltip: "Percentage of total cost allocated to materials" }}
        value={materialRatio}
        onChange={setMaterialRatio}
      />
      <CalculatorInput
        input={{ id: "laborRatio", label: "Labor Cost %", type: "slider", defaultValue: 50, suffix: "%", min: 10, max: 90, step: 5, tooltip: "Percentage of total cost allocated to labor" }}
        value={laborRatio}
        onChange={setLaborRatio}
      />
    </CalculatorLayout>
  );
}
