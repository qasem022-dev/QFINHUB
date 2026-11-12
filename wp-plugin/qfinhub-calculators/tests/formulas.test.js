/**
 * Formula verification harness.
 *
 * Loads the plugin runtime in Node with a minimal DOM stub, then checks each
 * calculator against values computed independently (closed-form references and,
 * where no closed form exists, the same simulation written separately).
 *
 * Run: node tests/formulas.test.js
 */

'use strict';

// Minimal DOM stub — compute() logic never touches the DOM, only boot() does.
global.window = {};
global.document = {
	readyState: 'complete',
	querySelectorAll: function () { return []; },
	addEventListener: function () {},
	createElement: function () { return { appendChild: function () {}, setAttribute: function () {} }; }
};

require('../assets/js/qfinhub-calculators.js');

const C = global.window.qfinhubCalculators.COMPUTE;

let pass = 0;
let fail = 0;

function near(name, actual, expected, tolerance) {
	const tol = tolerance === undefined ? 0.5 : tolerance;
	if (Math.abs(actual - expected) <= tol) {
		pass++;
		console.log(`  PASS  ${name}: ${Number(actual).toFixed(2)}`);
	} else {
		fail++;
		console.log(`  FAIL  ${name}: got ${Number(actual).toFixed(2)}, expected ${expected} (tol ${tol})`);
	}
}

function eq(name, actual, expected) {
	if (actual === expected) {
		pass++;
		console.log(`  PASS  ${name}: ${actual}`);
	} else {
		fail++;
		console.log(`  FAIL  ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
	}
}

console.log('\n--- mortgage-payment ---');
// 320,000 @ 6.5% / 360mo = 2,022.62 (standard amortisation reference)
let r = C['mortgage-payment']({ price: 400000, down: 80000, rate: 6.5, years: 30 });
near('monthly payment', r.payment, 2022.62, 1);
near('loan amount', r.loan, 320000, 0.01);
near('total paid', r.totalPaid, 2022.62 * 360, 400);

// The 0% case: the naive formula is 0/0 here and returns NaN.
r = C['mortgage-payment']({ price: 320000, down: 0, rate: 0, years: 30 });
near('0% APR payment', r.payment, 888.89, 0.02);
eq('0% APR is finite', isFinite(r.payment), true);

console.log('\n--- mortgage-affordability ---');
// 120k income => 10k/mo gross. 28% = 2,800/mo housing.
r = C['mortgage-affordability']({ income: 120000, monthlyDebt: 0, down: 60000, rate: 6.5, years: 30 });
near('monthly housing budget', r.monthlyHousing, 2800, 0.5);
// 2,800/mo at 6.5%/360 => loan 442,935
near('max loan', r.maxLoan, 442935, 800);
near('max price', r.maxPrice, 442935 + 60000, 800);

console.log('\n--- auto-loan ---');
r = C['auto-loan']({ price: 32000, down: 4000, tradeIn: 0, rate: 7.5, months: 60 });
near('financed', r.loan, 28000, 0.01);
// 28,000 @ 7.5%/60 = 561.02
near('payment', r.payment, 561.02, 1);

r = C['auto-loan']({ price: 32000, down: 4000, tradeIn: 6000, rate: 0, months: 60 });
near('trade-in reduces principal', r.loan, 22000, 0.01);
near('0% payment', r.payment, 366.67, 0.02);

console.log('\n--- loan-payment ---');
r = C['loan-payment']({ amount: 15000, rate: 11.5, months: 36 });
// 15,000 @ 11.5%/36 = 494.73
near('payment', r.payment, 494.73, 1);
near('total paid', r.totalPaid, 494.73 * 36, 40);

console.log('\n--- refinance-breakeven ---');
r = C['refinance-breakeven']({
	balance: 300000, currentRate: 7.25, newRate: 5.75,
	years: 30, closingCosts: 6000
});
// 300k @ 7.25% = 2046.53 ; @ 5.75% = 1750.77 ; saving 295.76 ; breakeven 20.3 mo
near('monthly saving', r.monthlySaving, 295.76, 3);
near('breakeven months', r.breakevenMonths, 20.3, 1);

r = C['refinance-breakeven']({
	balance: 300000, currentRate: 5.0, newRate: 7.0,
	years: 30, closingCosts: 6000
});
eq('higher rate is never worth it', isFinite(r.breakevenMonths), false);

console.log('\n--- compound-interest ---');
r = C['compound-interest']({ principal: 10000, monthly: 500, rate: 7, years: 20 });
// 10,000 grown + 500/mo at 7%/12 for 240 months = 300,852
near('future value', r.futureValue, 300852, 600);
near('contributed', r.contributed, 130000, 0.01);
near('growth', r.growth, 170852, 600);

r = C['compound-interest']({ principal: 10000, monthly: 0, rate: 0, years: 10 });
near('0% rate keeps principal', r.futureValue, 10000, 0.01);

console.log('\n--- savings-goal ---');
r = C['savings-goal']({ target: 50000, current: 5000, rate: 4, years: 5 });
// 5,000 grows to 6,104.98 at 4%/12 for 60mo; remaining 43,895.02 over a
// 66.299 annuity factor = 662.08. Verified independently in Python.
near('monthly needed', r.monthlyNeeded, 662.08, 1);
eq('goal covered is positive', r.monthlyNeeded > 0, true);

r = C['savings-goal']({ target: 10000, current: 20000, rate: 4, years: 5 });
near('already exceeded goal => 0 monthly', r.monthlyNeeded, 0, 0.01);

console.log('\n--- retirement-savings ---');
r = C['retirement-savings']({ age: 35, retireAge: 65, current: 60000, monthly: 800, rate: 7 });
near('years to grow', r.yearsToGrow, 30, 0.01);
// 60,000 + 800/mo at 7% for 360 months = 1,462,762
near('balance at retirement', r.atRetirement, 1462762, 20000);
near('4% safe income', r.safeIncome, 1462762 * 0.04, 800);

console.log('\n--- debt-payoff ---');
r = C['debt-payoff']({ balance: 12000, rate: 22.9, payment: 400 });
// -ln(1 - 12000*0.0190833/400)/ln(1.0190833) = 44.95
near('months to clear', r.months, 44.95, 0.6);
eq('payoff is finite', isFinite(r.months), true);

r = C['debt-payoff']({ balance: 12000, rate: 22.9, payment: 200 });
// 12,000 * 0.0190833 = 229.0 > 200 => never pays off
eq('payment below interest => never pays', isFinite(r.months), false);
eq('neverPays warning present', r.neverPays.length > 0, true);

console.log('\n--- credit-card-minimum ---');
r = C['credit-card-minimum']({ balance: 6000, rate: 24.99, minimumPct: 2 });
eq('simulation terminates', r.months < 600, true);
// Independently simulated in Python: 148 months, $5,863.06 interest.
// The $25 payment floor accelerates the tail, so interest lands just under the
// original balance rather than over it.
near('months to clear', r.months, 148, 2);
near('first payment', r.firstPayment, 244.95, 6);
near('total interest', r.totalInterest, 5863, 40);
eq('interest approaches the whole balance', r.totalInterest / 6000 > 0.9, true);

console.log('\n--- roi ---');
r = C['roi']({ cost: 10000, finalValue: 16000, years: 5 });
near('total return %', r.totalReturn, 60, 0.01);
near('annualised %', r.annualised, 9.86, 0.05);
near('profit', r.profit, 6000, 0.01);

r = C['roi']({ cost: 10000, finalValue: 5000, years: 3 });
near('loss is negative', r.totalReturn, -50, 0.01);
eq('annualised negative on loss', r.annualised < 0, true);

console.log('\n--- inflation ---');
r = C['inflation']({ amount: 100000, rate: 3, years: 20 });
// 1.03^20 = 1.80611 ; 100000/1.80611 = 55,367.6
near('real value', r.realValue, 55367.6, 20);
near('purchasing power loss %', r.purchasingPowerLoss, 44.63, 0.3);
near('needed to match today', r.neededForSame, 180611, 300);

console.log(`\n=========================================`);
console.log(`  PASS ${pass}   FAIL ${fail}`);
console.log(`=========================================\n`);
process.exit(fail === 0 ? 0 : 1);
