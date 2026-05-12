"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function VacationBudgetCalculator() {
  const [flights, setFlights] = React.useState(800);
  const [hotelPerNight, setHotelPerNight] = React.useState(200);
  const [nights, setNights] = React.useState(5);
  const [mealsPerDay, setMealsPerDay] = React.useState(75);
  const [activities, setActivities] = React.useState(500);
  const [transport, setTransport] = React.useState(200);
  const [insurance, setInsurance] = React.useState(50);
  const [other, setOther] = React.useState(100);

  const safeFlights = isFinite(flights) ? flights : 0;
  const safeHotel = isFinite(hotelPerNight) ? hotelPerNight : 0;
  const safeNights = isFinite(nights) ? nights : 0;
  const safeMeals = isFinite(mealsPerDay) ? mealsPerDay : 0;
  const safeActivities = isFinite(activities) ? activities : 0;
  const safeTransport = isFinite(transport) ? transport : 0;
  const safeInsurance = isFinite(insurance) ? insurance : 0;
  const safeOther = isFinite(other) ? other : 0;

  const accommodation = safeHotel * safeNights;
  const mealsTotal = safeMeals * safeNights;
  const total = safeFlights + accommodation + mealsTotal + safeActivities + safeTransport + safeInsurance + safeOther;
  const costPerDay = safeNights > 0 ? total / safeNights : 0;

  const pieData = [
    { name: "Flights", value: safeFlights },
    { name: "Accommodation", value: accommodation },
    { name: "Meals", value: mealsTotal },
    { name: "Activities", value: safeActivities },
    { name: "Transport", value: safeTransport },
    { name: "Insurance", value: safeInsurance },
    { name: "Other", value: safeOther },
  ].filter(d => d.value > 0);

  return (
    <CalculatorLayout
      title="Vacation Budget"
      description="Plan your vacation budget including flights, accommodation, meals, and activities."
      icon={<span>✈️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Total Trip Cost" value={formatCurrency(total)} highlight />
          <ResultCard label="Cost Per Day" value={formatCurrency(costPerDay)} />
          <ResultCard label="Nights" value={formatNumber(safeNights)} />
        </div>
      }
    >
      <CalculatorChart type="pie" data={pieData} xKey="name" yKey={["value"]} title="Trip Cost Breakdown" />
      <CalculatorInput input={{ id: "flights", label: "Flights", type: "number", defaultValue: 800, suffix: "$", min: 0, tooltip: "Round-trip flight costs for all travelers." }} value={flights} onChange={setFlights} />
      <CalculatorInput input={{ id: "hotel-per-night", label: "Hotel Per Night", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Average nightly rate for accommodations." }} value={hotelPerNight} onChange={setHotelPerNight} />
      <CalculatorInput input={{ id: "nights", label: "Number of Nights", type: "slider", defaultValue: 5, min: 1, max: 30, suffix: "nts", tooltip: "Total number of nights you'll be away." }} value={nights} onChange={setNights} />
      <CalculatorInput input={{ id: "meals-per-day", label: "Meals Per Day Budget", type: "number", defaultValue: 75, suffix: "$", min: 0, tooltip: "Estimated daily spending on food and drinks." }} value={mealsPerDay} onChange={setMealsPerDay} />
      <CalculatorInput input={{ id: "activities", label: "Activities & Tours", type: "number", defaultValue: 500, suffix: "$", min: 0, tooltip: "Tours, excursions, attraction tickets, and activities." }} value={activities} onChange={setActivities} />
      <CalculatorInput input={{ id: "transport", label: "Local Transport", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Taxis, rental cars, rideshares, and public transit at your destination." }} value={transport} onChange={setTransport} />
      <CalculatorInput input={{ id: "insurance", label: "Travel Insurance", type: "number", defaultValue: 50, suffix: "$", min: 0, tooltip: "Travel insurance and medical coverage." }} value={insurance} onChange={setInsurance} />
      <CalculatorInput input={{ id: "other", label: "Other Expenses", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "Souvenirs, tips, visas, and any other miscellaneous costs." }} value={other} onChange={setOther} />
    </CalculatorLayout>
  );
}
