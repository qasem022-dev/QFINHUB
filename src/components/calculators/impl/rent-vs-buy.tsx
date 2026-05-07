"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const mr = annualRate / 100 / 12;
  return (principal * mr * Math.pow(1 + mr, termMonths)) / (Math.pow(1 + mr, termMonths) - 1);
}

export default function RentVsBuyCalculator() {
  const [rent, setRent] = React.useState(2000);
  const [homePrice, setHomePrice] = React.useState(350000);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(6.5);
  const [hoa, setHoa] = React.useState(300);
  const [maintenance, setMaintenance] = React.useState(200);
  const [years, setYears] = React.useState(7);

  const downPayment = homePrice * (downPct / 100);
  const loanAmount = homePrice - downPayment;
  const termMonths = 360; // 30 years
  const mortgagePmt = calcMonthlyPayment(loanAmount, rate, termMonths);
  const totalBuyMonthly = mortgagePmt + hoa + maintenance;
  const annualRentIncrease = 0.03;

  let totalRentCost = 0;
  let currentRent = rent;
  const chartData: { year: string; "Rent Cost": number; "Buy Cost": number }[] = [
    { year: "Year 0", "Rent Cost": 0, "Buy Cost": Math.round(downPayment) },
  ];

  for (let y = 1; y <= years; y++) {
    totalRentCost += currentRent * 12;
    currentRent *= (1 + annualRentIncrease);
    const buyCost = downPayment + (mortgagePmt + hoa + maintenance) * 12 * y;

    // Estimate home appreciation for equity
    const homeValue = homePrice * Math.pow(1.03, y);
    const balanceAfterYrs = (mortgagePmt - (loanAmount * (rate / 100 / 12))) * 
      ((Math.pow(1 + rate / 100 / 12, y * 12) - 1) / (rate / 100 / 12));
    const equity = homeValue - Math.max(0, loanAmount - balanceAfterYrs);

    chartData.push({
      year: `Year ${y}`,
      "Rent Cost": Math.round(totalRentCost),
      "Buy Cost": Math.round(downPayment + (mortgagePmt + hoa + maintenance) * 12 * y - equity),
    });
  }

  totalRentCost = 0;
  currentRent = rent;
  for (let y = 1; y <= years; y++) {
    totalRentCost += currentRent * 12;
    currentRent *= (1 + annualRentIncrease);
  }

  const totalBuyOutlay = downPayment + (mortgagePmt + hoa + maintenance) * 12 * years;
  const homeValueEnd = homePrice * Math.pow(1.03, years);
  // Simplified remaining balance
  const mr = rate / 100 / 12;
  const remainingBalance = loanAmount * Math.pow(1 + mr, years * 12) - mortgagePmt * ((Math.pow(1 + mr, years * 12) - 1) / mr);
  const equity = Math.max(0, homeValueEnd - Math.max(0, remainingBalance));
  const netBuyCost = totalBuyOutlay - equity;
  const breakEven = netBuyCost <= totalRentCost ? `Year ${years}` : `> ${years} years`;

  return (
    <CalculatorLayout
      title="Rent vs. Buy"
      description="Compare the financial outcomes of renting versus buying a home over any time horizon."
      icon={<span>🏘️</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Cost of Renting" value={formatCurrency(totalRentCost)} highlight subtext={`Over ${years} years`} />
          <ResultCard label="Cost of Buying" value={formatCurrency(netBuyCost)} subtext={`After equity of ${formatCurrency(Math.max(0, equity))}`} />
          <ResultCard label="Net Difference" value={formatCurrency(totalRentCost - netBuyCost)} highlight={netBuyCost <= totalRentCost} subtext={netBuyCost <= totalRentCost ? "Buying is cheaper" : "Renting is cheaper"} />
          <ResultCard label="Est. Break-Even" value={breakEven} />
        </div>
      }
    >
      <CalculatorChart type="line" data={chartData} xKey="year" yKey={["Rent Cost", "Buy Cost"]} title="Cumulative Costs" />
      <CalculatorInput input={{ id: "rent", label: "Monthly Rent", type: "number", defaultValue: 2000, suffix: "$", min: 0 }} value={rent} onChange={setRent} />
      <CalculatorInput input={{ id: "homePrice", label: "Home Price", type: "number", defaultValue: 350000, suffix: "$", min: 0 }} value={homePrice} onChange={setHomePrice} />
      <CalculatorInput input={{ id: "downPct", label: "Down Payment", type: "slider", defaultValue: 20, suffix: "%", min: 0, max: 100, step: 1 }} value={downPct} onChange={setDownPct} />
      <CalculatorInput input={{ id: "rate", label: "Mortgage Rate", type: "number", defaultValue: 6.5, suffix: "%", min: 0, max: 20, step: 0.1 }} value={rate} onChange={setRate} />
      <CalculatorInput input={{ id: "hoa", label: "Monthly HOA Fees", type: "number", defaultValue: 300, suffix: "$", min: 0 }} value={hoa} onChange={setHoa} />
      <CalculatorInput input={{ id: "maintenance", label: "Monthly Maintenance", type: "number", defaultValue: 200, suffix: "$", min: 0, tooltip: "Estimated 1% of home value per year for maintenance." }} value={maintenance} onChange={setMaintenance} />
      <CalculatorInput input={{ id: "years", label: "Time Horizon", type: "number", defaultValue: 7, suffix: "years", min: 1, max: 30 }} value={years} onChange={setYears} />
    </CalculatorLayout>
  );
}
