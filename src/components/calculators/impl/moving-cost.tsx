"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function MovingCostCalculator() {
  const [distance, setDistance] = React.useState(500);
  const [movingTruck, setMovingTruck] = React.useState(1500);
  const [movers, setMovers] = React.useState(2000);
  const [packingSupplies, setPackingSupplies] = React.useState(300);
  const [travelCosts, setTravelCosts] = React.useState(500);
  const [storage, setStorage] = React.useState(200);
  const [securityDeposit, setSecurityDeposit] = React.useState(2000);
  const [cleaning, setCleaning] = React.useState(400);
  const [other, setOther] = React.useState(200);

  const safeDistance = isFinite(distance) ? distance : 0;
  const safeTruck = isFinite(movingTruck) ? movingTruck : 0;
  const safeMovers = isFinite(movers) ? movers : 0;
  const safePacking = isFinite(packingSupplies) ? packingSupplies : 0;
  const safeTravel = isFinite(travelCosts) ? travelCosts : 0;
  const safeStorage = isFinite(storage) ? storage : 0;
  const safeDeposit = isFinite(securityDeposit) ? securityDeposit : 0;
  const safeCleaning = isFinite(cleaning) ? cleaning : 0;
  const safeOther = isFinite(other) ? other : 0;

  const total = safeTruck + safeMovers + safePacking + safeTravel + safeStorage + safeDeposit + safeCleaning + safeOther;
  const costPerMile = safeDistance > 0 ? total / safeDistance : 0;

  const pieData = [
    { name: "Moving Truck", value: safeTruck },
    { name: "Movers", value: safeMovers },
    { name: "Packing Supplies", value: safePacking },
    { name: "Travel Costs", value: safeTravel },
    { name: "Storage", value: safeStorage },
    { name: "Security Deposit", value: safeDeposit },
    { name: "Cleaning", value: safeCleaning },
    { name: "Other", value: safeOther },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Moving Cost"
      description="Estimate the total cost of your move including truck rental, movers, supplies, and deposits."
      icon={<span>📦</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Moving Cost" value={formatCurrency(total)} highlight />
          <ResultCard label="Cost Per Mile" value={formatCurrency(costPerMile)} />
          <ResultCard label="Distance" value={formatNumber(safeDistance) + " miles"} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey="value" title="Cost Breakdown" />
      <CalculatorInput input={{ id: "distance", label: "Moving Distance", type: "slider", defaultValue: 500, min: 1, max: 3000, suffix: "mi", tooltip: "Distance of your move in miles." }} value={distance} onChange={setDistance} />
      <CalculatorInput input={{ id: "moving-truck", label: "Moving Truck Rental", type: "number", defaultValue: 1500, suffix: "$", min: 0, tooltip: "Cost of renting a moving truck." }} value={movingTruck} onChange={setMovingTruck} />
      <CalculatorInput input={{ id: "movers", label: "Movers", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Cost of hiring professional movers." }} value={movers} onChange={setMovers} />
      <CalculatorInput input={{ id: "packing-supplies", label: "Packing Supplies", type: "number", defaultValue: 300, suffix: "$", min: 0, tooltip: "Boxes, tape, bubble wrap, and other packing materials." }} value={packingSupplies} onChange={setPackingSupplies} />
      <CalculatorInput input={{ id: "travel-costs", label: "Travel Costs", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Gas, lodging, meals during the move." }} value={travelCosts} onChange={setTravelCosts} />
      <CalculatorInput input={{ id: "storage", label: "Storage", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Temporary storage costs if needed." }} value={storage} onChange={setStorage} />
      <CalculatorInput input={{ id: "security-deposit", label: "Security Deposit", type: "number", defaultValue: 2000, suffix: "$", min: 0, tooltip: "Security deposit for the new rental." }} value={securityDeposit} onChange={setSecurityDeposit} />
      <CalculatorInput input={{ id: "cleaning", label: "Cleaning", type: "number", defaultValue: 400, suffix: "$", min: 0, tooltip: "Cleaning costs for old or new residence." }} value={cleaning} onChange={setCleaning} />
      <CalculatorInput input={{ id: "other", label: "Other Costs", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Any other moving-related expenses." }} value={other} onChange={setOther} />
    </CalculatorLayout>
  );
}
