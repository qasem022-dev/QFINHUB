=== QFINHUB Financial Calculators ===
Contributors: qfinhub
Tags: calculator, mortgage calculator, loan calculator, finance, compound interest
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Financial calculators as blocks and shortcodes — mortgage, loans, investing, retirement, debt and savings. No iframe, no jQuery, no external requests.

== Description ==

Adds financial calculators to any post or page as a Gutenberg block or a shortcode.

**Why this plugin is different**

Most calculator plugins are form builders that you have to configure with your own maths. This one ships the maths already done and checked, per calculator, against independent reference values.

Also unlike most calculator plugins:

* **No iframe.** Calculators render directly in your page, so they inherit your typography and colours and cannot be blocked by frame-busting scripts.
* **No jQuery.** A single small script, loaded only on pages that actually contain a calculator.
* **No external requests.** Everything runs in the visitor's browser. No data is sent anywhere, no API keys, no account.
* **No tracking.** The plugin collects nothing and stores nothing.
* **Theme-agnostic.** Styles are scoped and use CSS custom properties, so nothing leaks into your theme. Dark mode is handled automatically.

**Included calculators (version 0.1.0)**

* Mortgage Payment
* Home Affordability
* Auto Loan
* Personal Loan Payment
* Refinance Break-Even
* Compound Interest
* Savings Goal
* Retirement Savings
* Debt Payoff
* Credit Card Minimum Trap
* Return on Investment
* Inflation Impact

More calculators are added in minor releases. The registry is data-driven, so each addition is a definition plus a verified formula.

**Usage — block**

Insert the "Financial Calculator" block, then pick a calculator in the sidebar.

**Usage — shortcode**

`[qfinhub_calculator id="mortgage-payment"]`

Optional heading override:

`[qfinhub_calculator id="auto-loan" title="Estimate your car payment"]`

List every available calculator:

`[qfinhub_calculators]`

**Calculator IDs**

`mortgage-payment`, `mortgage-affordability`, `auto-loan`, `loan-payment`, `refinance-breakeven`, `compound-interest`, `savings-goal`, `retirement-savings`, `debt-payoff`, `credit-card-minimum`, `roi`, `inflation`

== Installation ==

1. Upload the `qfinhub-calculators` folder to `/wp-content/plugins/`, or install the zip through Plugins → Add New → Upload Plugin.
2. Activate the plugin.
3. Add the block to a page, or use the shortcode.

No settings screen is required. There is nothing to configure and no account to create.

== Frequently Asked Questions ==

= Does this send any data to an external service? =

No. All calculations run in the browser. The plugin makes no network requests and stores nothing.

= Does it work with any theme? =

Yes. Markup uses `.qfc-` prefixed classes and CSS custom properties, and no global selectors are modified. You can restyle it by overriding the custom properties on `.qfc-wrap`.

= Does it work without Gutenberg? =

Yes. The shortcodes work regardless of editor, including the Classic editor and page builders that accept shortcodes.

= Are the calculations financial advice? =

No. They are arithmetic. Results are estimates based on the inputs provided and exclude fees, taxes and insurance unless stated.

= Why is the payment different from my bank's? =

Most published calculators show principal and interest only. This plugin does the same by default. If your lender quotes a higher figure it is normally because property tax, insurance or mortgage insurance are included.

= Can I add my own calculator? =

Not without code changes in 0.1.0. The registry is data-driven and a public extension API is planned.

== Screenshots ==

1. The Mortgage Payment calculator rendered on the front end.
2. Choosing a calculator in the block editor.

== Changelog ==

= 0.1.0 =
* Initial release. Twelve calculators, block and shortcode support.
* Formulas verified against independent closed-form references, including the 0% interest case where the standard amortisation formula divides by zero.
