"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function WeddingBudgetCalculator() {
  const [budget, setBudget] = React.useState(30000);
  const [venue, setVenue] = React.useState(9000);
  const [catering, setCatering] = React.useState(7500);
  const [photography, setPhotography] = React.useState(3000);
  const [attire, setAttire] = React.useState(3000);
  const [flowers, setFlowers] = React.useState(2400);
  const [entertainment, setEntertainment] = React.useState(2400);
  const [invitations, setInvitations] = React.useState(900);
  const [cake, setCake] = React.useState(600);
  const [other, setOther] = React.useState(1200);

  const safeVenue = isFinite(venue) ? venue : 0;
  const safeCatering = isFinite(catering) ? catering : 0;
  const safePhoto = isFinite(photography) ? photography : 0;
  const safeAttire = isFinite(attire) ? attire : 0;
  const safeFlowers = isFinite(flowers) ? flowers : 0;
  const safeEntertainment = isFinite(entertainment) ? entertainment : 0;
  const safeInvites = isFinite(invitations) ? invitations : 0;
  const safeCake = isFinite(cake) ? cake : 0;
  const safeOther = isFinite(other) ? other : 0;
  const safeBudget = isFinite(budget) ? budget : 0;

  const totalSpent = safeVenue + safeCatering + safePhoto + safeAttire + safeFlowers + safeEntertainment + safeInvites + safeCake + safeOther;
  const remaining = safeBudget - totalSpent;

  const categoryData = [
    { name: "Venue", value: safeVenue },
    { name: "Catering", value: safeCatering },
    { name: "Photography", value: safePhoto },
    { name: "Attire", value: safeAttire },
    { name: "Flowers", value: safeFlowers },
    { name: "Entertainment", value: safeEntertainment },
    { name: "Invitations", value: safeInvites },
    { name: "Cake", value: safeCake },
    { name: "Other", value: safeOther },
  ].filter(d => d.value > 0);

  const budgetVsActual = [
    { name: "Budget", value: safeBudget },
    { name: "Actual", value: totalSpent },
  ];

  return (
    <CalculatorLayout
      title="Wedding Budget"
      description="Plan your wedding budget and track spending across all categories."
      icon={<span>💒</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Budget" value={formatCurrency(safeBudget)} />
          <ResultCard label="Total Spent" value={formatCurrency(totalSpent)} />
          <ResultCard label={remaining >= 0 ? "Remaining" : "Overspent"} value={formatCurrency(Math.abs(remaining))} highlight />
        </div>
      }
    >
      <CalculatorChart type="pie" data={categoryData} xKey="name" yKey="value" title="Spending by Category" />
      <CalculatorChart type="bar" data={budgetVsActual} xKey="name" yKey="value" title="Budget vs Actual" />
      <CalculatorInput input={{ id: "budget", label: "Total Budget", type: "number", defaultValue: 30000, suffix: "$", min: 0, tooltip: "Your total wedding budget." }} value={budget} onChange={setBudget} />
      <CalculatorInput input={{ id: "venue", label: "Venue", type: "number", defaultValue: 9000, suffix: "$", min: 0, tooltip: "Cost of the ceremony and reception venue." }} value={venue} onChange={setVenue} />
      <CalculatorInput input={{ id: "catering", label: "Catering", type: "number", defaultValue: 7500, suffix: "$", min: 0, tooltip: "Food, drinks, and service costs." }} value={catering} onChange={setCatering} />
      <CalculatorInput input={{ id: "photography", label: "Photography", type: "number", defaultValue: 3000, suffix: "$", min: 0, tooltip: "Photographer and videographer costs." }} value={photography} onChange={setPhotography} />
      <CalculatorInput input={{ id: "attire", label: "Attire", type: "number", defaultValue: 3000, suffix: "$", min: 0, tooltip: "Wedding dress, suit, and accessories." }} value={attire} onChange={setAttire} />
      <CalculatorInput input={{ id: "flowers", label: "Flowers & Decor", type: "number", defaultValue: 2400, suffix: "$", min: 0, tooltip: "Floral arrangements and decorations." }} value={flowers} onChange={setFlowers} />
      <CalculatorInput input={{ id: "entertainment", label: "Entertainment", type: "number", defaultValue: 2400, suffix: "$", min: 0, tooltip: "DJ, band, or other entertainment." }} value={entertainment} onChange={setEntertainment} />
      <CalculatorInput input={{ id: "invitations", label: "Invitations", type: "number", defaultValue: 900, suffix: "$", min: 0, tooltip: "Save-the-dates, invitations, and postage." }} value={invitations} onChange={setInvitations} />
      <CalculatorInput input={{ id: "cake", label: "Cake", type: "number", defaultValue: 600, suffix: "$", min: 0, tooltip: "Wedding cake and desserts." }} value={cake} onChange={setCake} />
      <CalculatorInput input={{ id: "other", label: "Other Expenses", type: "number", defaultValue: 1200, suffix: "$", min: 0, tooltip: "Any other wedding-related costs." }} value={other} onChange={setOther} />
    </CalculatorLayout>
  );
}
