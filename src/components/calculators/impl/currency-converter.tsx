"use client";

import * as React from "react";
import { CalculatorLayout, CalculatorInput, CalculatorChart, ResultCard } from "..";
import { formatCurrency } from "@/lib/utils";

export default function CurrencyConverter() {
  const [amount, setAmount] = React.useState(100);
  const [fromCurrency, setFromCurrency] = React.useState(0); // 0=USD
  const [toCurrency, setToCurrency] = React.useState(1); // 1=EUR
  const [exchangeRate, setExchangeRate] = React.useState(0.92);

  const currencies: { label: string; value: number }[] = [
    { label: "USD - US Dollar", value: 0 },
    { label: "EUR - Euro", value: 1 },
    { label: "GBP - British Pound", value: 2 },
    { label: "JPY - Japanese Yen", value: 3 },
    { label: "CAD - Canadian Dollar", value: 4 },
    { label: "AUD - Australian Dollar", value: 5 },
  ];

  const fromCurrencyLabel = (currencies.find(c => c.value === fromCurrency)?.label ?? "USD").split(" - ")[0] ?? "USD";
  const toCurrencyLabel = (currencies.find(c => c.value === toCurrency)?.label ?? "EUR").split(" - ")[0] ?? "EUR";

  const safeAmount = isFinite(amount) ? Math.max(0, amount) : 0;
  const safeRate = isFinite(exchangeRate) ? Math.max(0, exchangeRate) : 0;

  const convertedAmount = safeAmount * safeRate;
  const inverseRate = safeRate > 0 ? 1 / safeRate : 0;

  const chartData = [
    { name: fromCurrencyLabel, value: safeAmount },
    { name: toCurrencyLabel, value: convertedAmount },
  ];

  return (
    <CalculatorLayout
      title="Currency Converter"
      description="Convert between different world currencies using current exchange rates."
      icon={<span>💱</span>}
      results={
        <div className="space-y-4">
          <ResultCard label="Converted Amount" value={formatCurrency(convertedAmount)} highlight />
          <ResultCard label={`1 ${fromCurrencyLabel} =`} value={`${safeRate} ${toCurrencyLabel}`} subtext="Exchange rate" />
          <ResultCard label={`1 ${toCurrencyLabel} =`} value={`${inverseRate.toFixed(4)} ${fromCurrencyLabel}`} subtext="Inverse rate" />
          <ResultCard label="Original Amount" value={formatCurrency(safeAmount)} subtext={fromCurrencyLabel} />
        </div>
      }
    >
      <CalculatorChart type="bar" data={chartData} xKey="name" yKey="value" title="Currency Comparison" height={250} />
      <CalculatorInput
        input={{ id: "amount", label: "Amount", type: "number", defaultValue: 100, suffix: "$", min: 0, tooltip: "The amount of currency you want to convert." }}
        value={amount}
        onChange={setAmount}
      />
      <CalculatorInput
        input={{ id: "fromCurrency", label: "From Currency", type: "select", defaultValue: 0, options: currencies, tooltip: "The currency you are converting from." }}
        value={fromCurrency}
        onChange={setFromCurrency}
      />
      <CalculatorInput
        input={{ id: "toCurrency", label: "To Currency", type: "select", defaultValue: 1, options: currencies, tooltip: "The currency you are converting to." }}
        value={toCurrency}
        onChange={setToCurrency}
      />
      <CalculatorInput
        input={{ id: "exchangeRate", label: "Exchange Rate", type: "number", defaultValue: 0.92, step: 0.0001, min: 0, tooltip: "The exchange rate from the source currency to the target currency." }}
        value={exchangeRate}
        onChange={setExchangeRate}
      />
    </CalculatorLayout>
  );
}
