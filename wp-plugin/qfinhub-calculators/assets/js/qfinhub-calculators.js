/**
 * QFINHUB Financial Calculators — front-end runtime.
 *
 * Deliberately dependency-free: no jQuery, no React, no framework. A WordPress
 * plugin gets loaded on pages it did not build, so the runtime has to be small
 * and must not fight whatever theme or builder is already there.
 *
 * Maths is keyed by calculator id. A calculator renders only when a definition
 * in calculators.json has a matching compute function here, so a half-migrated
 * library never shows a calculator that cannot calculate.
 */
(function () {
	'use strict';

	/* ------------------------------------------------------------------ *
	 * Formatting
	 * ------------------------------------------------------------------ */

	var currencyFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	function format(value, kind) {
		if (value === null || value === undefined || (typeof value === 'number' && !isFinite(value))) {
			return '—';
		}
		switch (kind) {
			case 'currency':
				return currencyFmt.format(Math.round(value));
			case 'percent':
				return value.toFixed(1) + '%';
			case 'decimal':
				return value.toFixed(2) + '×';
			case 'months':
				if (!isFinite(value)) return 'Never';
				var m = Math.round(value);
				return m >= 12 ? m + ' mo (' + (m / 12).toFixed(1) + ' yr)' : m + ' mo';
			case 'years':
				return value.toFixed(1) + ' yr';
			default:
				return String(value);
		}
	}

	/* ------------------------------------------------------------------ *
	 * Shared maths
	 *
	 * paymentFor() guards mr === 0. Without it the standard amortisation
	 * formula is 0/0 at a 0% rate and returns NaN, which is the single most
	 * common bug in published mortgage calculators.
	 * ------------------------------------------------------------------ */

	function paymentFor(principal, annualRatePct, months) {
		if (months <= 0) return 0;
		var mr = annualRatePct / 100 / 12;
		if (mr === 0) return principal / months;
		var growth = Math.pow(1 + mr, months);
		return (principal * mr * growth) / (growth - 1);
	}

	function loanFor(payment, annualRatePct, months) {
		if (months <= 0) return 0;
		var mr = annualRatePct / 100 / 12;
		if (mr === 0) return payment * months;
		var growth = Math.pow(1 + mr, months);
		return (payment * (growth - 1)) / (mr * growth);
	}

	function futureValue(principal, monthly, annualRatePct, months) {
		var mr = annualRatePct / 100 / 12;
		if (mr === 0) return principal + monthly * months;
		var growth = Math.pow(1 + mr, months);
		return principal * growth + monthly * ((growth - 1) / mr);
	}

	/* ------------------------------------------------------------------ *
	 * Calculators
	 * ------------------------------------------------------------------ */

	var COMPUTE = {
		'mortgage-payment': function (v) {
			var loan = Math.max(0, v.price - v.down);
			var months = Math.round(v.years * 12);
			var payment = paymentFor(loan, v.rate, months);
			var totalPaid = payment * months;
			var totalInterest = totalPaid - loan;
			return {
				payment: payment,
				loan: loan,
				totalInterest: totalInterest,
				totalPaid: totalPaid,
				interestShare: totalPaid > 0 ? (totalInterest / totalPaid) * 100 : 0
			};
		},

		'mortgage-affordability': function (v) {
			var grossMonthly = v.income / 12;
			var months = Math.round(v.years * 12);
			// 28/36 rule: housing alone <= 28% of gross, all debt <= 36%.
			var byHousing = grossMonthly * 0.28;
			var byTotalDebt = grossMonthly * 0.36 - v.monthlyDebt;
			var housing = Math.max(0, Math.min(byHousing, byTotalDebt));
			var maxLoan = loanFor(housing, v.rate, months);
			return {
				maxPrice: maxLoan + v.down,
				maxLoan: maxLoan,
				monthlyHousing: housing,
				dtiUsed: grossMonthly > 0 ? (housing / grossMonthly) * 100 : 0
			};
		},

		'auto-loan': function (v) {
			var financed = Math.max(0, v.price - v.down - v.tradeIn);
			var months = Math.round(v.months);
			var payment = paymentFor(financed, v.rate, months);
			var totalPaid = payment * months;
			return {
				payment: payment,
				loan: financed,
				totalInterest: totalPaid - financed,
				totalPaid: totalPaid
			};
		},

		'loan-payment': function (v) {
			var months = Math.max(1, Math.round(v.months));
			var payment = paymentFor(v.amount, v.rate, months);
			var totalPaid = payment * months;
			var interest = totalPaid - v.amount;
			return {
				payment: payment,
				totalInterest: interest,
				totalPaid: totalPaid,
				costPerBorrowed: v.amount > 0 ? interest / v.amount : 0
			};
		},

		'refinance-breakeven': function (v) {
			var months = Math.round(v.years * 12);
			var current = paymentFor(v.balance, v.currentRate, months);
			var next = paymentFor(v.balance, v.newRate, months);
			var saving = current - next;
			var breakeven = saving > 0 ? v.closingCosts / saving : Infinity;
			var lifetime = saving * months - v.closingCosts;
			return {
				breakevenMonths: breakeven,
				monthlySaving: saving,
				lifetimeSaving: lifetime,
				worthIt: !isFinite(breakeven)
					? 'Not worth it — the new rate is not lower.'
					: breakeven <= 36
						? 'Worth it — breaks even in under 3 years.'
						: breakeven <= 60
							? 'Borderline — breaks even in about ' + Math.round(breakeven / 12) + ' years.'
							: 'Probably not worth it — you may move or refinance first.'
			};
		},

		'compound-interest': function (v) {
			var months = Math.round(v.years * 12);
			var fv = futureValue(v.principal, v.monthly, v.rate, months);
			var contributed = v.principal + v.monthly * months;
			return {
				futureValue: fv,
				contributed: contributed,
				growth: fv - contributed,
				multiple: contributed > 0 ? fv / contributed : 0
			};
		},

		'savings-goal': function (v) {
			var months = Math.max(1, Math.round(v.years * 12));
			var mr = v.rate / 100 / 12;
			var grownCurrent = mr === 0 ? v.current : v.current * Math.pow(1 + mr, months);
			var remaining = v.target - grownCurrent;
			var monthly;
			if (remaining <= 0) {
				monthly = 0;
			} else if (mr === 0) {
				monthly = remaining / months;
			} else {
				var growth = Math.pow(1 + mr, months);
				monthly = (remaining * mr) / (growth - 1);
			}
			var contributed = monthly * months;
			return {
				monthlyNeeded: monthly,
				totalContributed: contributed,
				interestEarned: Math.max(0, v.target - v.current - contributed)
			};
		},

		'retirement-savings': function (v) {
			var years = Math.max(0, v.retireAge - v.age);
			var months = Math.round(years * 12);
			var balance = futureValue(v.current, v.monthly, v.rate, months);
			return {
				atRetirement: balance,
				yearsToGrow: years,
				safeIncome: balance * 0.04,
				totalContributed: v.current + v.monthly * months
			};
		},

		'debt-payoff': function (v) {
			var mr = v.rate / 100 / 12;
			var months;
			if (v.payment <= 0) {
				months = Infinity;
			} else if (mr === 0) {
				months = v.balance / v.payment;
			} else if (v.payment <= v.balance * mr) {
				// Payment never touches the principal — the balance grows forever.
				months = Infinity;
			} else {
				months = -Math.log(1 - (v.balance * mr) / v.payment) / Math.log(1 + mr);
			}
			var totalPaid = isFinite(months) ? v.payment * months : Infinity;
			return {
				months: months,
				totalInterest: isFinite(totalPaid) ? totalPaid - v.balance : Infinity,
				totalPaid: totalPaid,
				neverPays: isFinite(months)
					? ''
					: 'At this payment the balance never falls — the payment does not cover the monthly interest.'
			};
		},

		'credit-card-minimum': function (v) {
			var mr = v.rate / 100 / 12;
			var balance = v.balance;
			var totalInterest = 0;
			var firstPayment = Math.max(25, balance * (v.minimumPct / 100) + balance * mr);
			var months = 0;
			// Simulation, because a percentage-of-balance minimum has no closed form.
			while (balance > 0.5 && months < 600) {
				var interest = balance * mr;
				var payment = Math.max(25, balance * (v.minimumPct / 100) + interest);
				if (payment <= interest) { months = Infinity; break; }
				balance = balance + interest - payment;
				totalInterest += interest;
				months++;
			}
			return {
				months: months,
				totalInterest: totalInterest,
				firstPayment: firstPayment,
				interestToBalance: v.balance > 0 ? totalInterest / v.balance : 0
			};
		},

		'roi': function (v) {
			var profit = v.finalValue - v.cost;
			var total = v.cost > 0 ? (profit / v.cost) * 100 : 0;
			var years = v.years > 0 ? v.years : 1;
			var annualised = v.cost > 0 && v.finalValue > 0
				? (Math.pow(v.finalValue / v.cost, 1 / years) - 1) * 100
				: -100;
			return {
				totalReturn: total,
				annualised: annualised,
				profit: profit
			};
		},

		'inflation': function (v) {
			var factor = Math.pow(1 + v.rate / 100, v.years);
			var realValue = v.amount / factor;
			return {
				realValue: realValue,
				purchasingPowerLoss: v.amount > 0 ? (1 - realValue / v.amount) * 100 : 0,
				neededForSame: v.amount * factor
			};
		}
	};

	/* ------------------------------------------------------------------ *
	 * Rendering
	 * ------------------------------------------------------------------ */

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function readValue(field, input) {
		if (field.type === 'select' || input.type === 'number') {
			var n = parseFloat(input.value);
			return isNaN(n) ? 0 : n;
		}
		return input.value;
	}

	function render(root) {
		var id = root.getAttribute('data-calculator');
		var compute = COMPUTE[id];
		var def;
		try {
			def = JSON.parse(root.getAttribute('data-definition'));
		} catch (e) {
			return;
		}
		if (!compute || !def) return;

		root.innerHTML = '';
		root.classList.add('qfc-root');

		var layout = el('div', 'qfc-layout');
		var form = el('div', 'qfc-form');
		var panel = el('div', 'qfc-panel');

		var inputs = {};
		def.fields.forEach(function (field) {
			var wrap = el('div', 'qfc-field');
			var label = el('label', 'qfc-label', field.label);
			label.setAttribute('for', 'qfc-' + id + '-' + field.key);
			wrap.appendChild(label);

			var input;
			if (field.type === 'select') {
				input = el('select', 'qfc-input');
				(field.options || []).forEach(function (opt) {
					var o = el('option', null, String(opt));
					o.value = String(opt);
					input.appendChild(o);
				});
				input.value = String(field.default);
			} else {
				input = el('input', 'qfc-input');
				input.type = 'number';
				if (field.min !== undefined) input.min = field.min;
				if (field.max !== undefined) input.max = field.max;
				input.step = field.step !== undefined ? field.step : 'any';
				input.value = field.default;
			}
			input.id = 'qfc-' + id + '-' + field.key;
			input.setAttribute('inputmode', 'decimal');

			// The unit belongs inside the input box, not on its own grid row —
			// a "$" sitting under the field reads as a rendering bug.
			var row = el('div', 'qfc-input-wrap');
			row.appendChild(input);
			if (field.prefix || field.suffix) {
				var isPrefix = !!field.prefix;
				var unit = el(
					'span',
					isPrefix ? 'qfc-unit qfc-unit-prefix' : 'qfc-unit qfc-unit-suffix',
					field.prefix || field.suffix
				);
				unit.setAttribute('aria-hidden', 'true');
				input.classList.add(isPrefix ? 'qfc-input-has-prefix' : 'qfc-input-has-suffix');
				row.appendChild(unit);
			}
			wrap.appendChild(row);

			inputs[field.key] = { input: input, field: field };
			form.appendChild(wrap);
		});

		function update() {
			var values = {};
			Object.keys(inputs).forEach(function (key) {
				values[key] = readValue(inputs[key].field, inputs[key].input);
			});
			var result;
			try {
				result = compute(values);
			} catch (e) {
				result = {};
			}

			panel.innerHTML = '';
			(def.outputs || []).forEach(function (out) {
				var row = el('div', out.primary ? 'qfc-result qfc-result-primary' : 'qfc-result');
				row.appendChild(el('span', 'qfc-result-label', out.label));
				row.appendChild(el('strong', 'qfc-result-value', format(result[out.key], out.format)));
				panel.appendChild(row);
			});
		}

		form.addEventListener('input', update);
		form.addEventListener('change', update);

		layout.appendChild(form);
		layout.appendChild(panel);
		root.appendChild(layout);

		if (def.description) {
			root.appendChild(el('p', 'qfc-note', def.description));
		}
		if (def.disclaimer) {
			root.appendChild(el('p', 'qfc-disclaimer', def.disclaimer));
		}

		update();
	}

	function boot() {
		var nodes = document.querySelectorAll('[data-calculator]');
		for (var i = 0; i < nodes.length; i++) {
			if (!nodes[i].getAttribute('data-qfc-ready')) {
				nodes[i].setAttribute('data-qfc-ready', '1');
				render(nodes[i]);
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}

	// Expose the maths so the same formulas can be unit-tested outside WordPress.
	window.qfinhubCalculators = { COMPUTE: COMPUTE, format: format };
})();
