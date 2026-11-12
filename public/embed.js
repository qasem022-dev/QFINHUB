/**
 * QFINHUB white-label embed installer.
 *
 * Self-serve: the customer pastes two lines and gets a branded calculator.
 *
 *   <div data-qfinhub-calc="mortgage-calculator"
 *        data-brand="Acme Credit Union"
 *        data-color="0b5ea8"
 *        data-leads="1"
 *        data-key="LICENCE_KEY"></div>
 *   <script src="https://www.qfinhub.com/embed.js" async></script>
 *
 * Plain ES5, no dependencies — this runs inside other people's pages and must
 * not assume a build step, a framework, or modern syntax.
 */
(function () {
	"use strict";

	var ORIGIN = "https://www.qfinhub.com";
	var NS = "qfinhub";

	function buildSrc(el) {
		var slug = el.getAttribute("data-qfinhub-calc");
		if (!slug) return null;

		var params = [];
		function add(name, attr) {
			var v = el.getAttribute(attr);
			if (v) params.push(name + "=" + encodeURIComponent(v));
		}
		add("brand", "data-brand");
		add("color", "data-color");
		add("key", "data-key");
		add("leads", "data-leads");

		return (
			ORIGIN +
			"/embed/" +
			encodeURIComponent(slug) +
			(params.length ? "?" + params.join("&") : "")
		);
	}

	function mount(el) {
		if (el.getAttribute("data-qfinhub-mounted") === "1") return;
		var src = buildSrc(el);
		if (!src) return;
		el.setAttribute("data-qfinhub-mounted", "1");

		var frame = document.createElement("iframe");
		frame.src = src;
		frame.title = el.getAttribute("data-title") || "Financial calculator";
		frame.loading = "lazy";
		frame.setAttribute("scrolling", "no");
		frame.style.width = "100%";
		frame.style.border = "0";
		frame.style.display = "block";
		// Sensible default before the resize message arrives.
		frame.style.height = (el.getAttribute("data-height") || "720") + "px";
		frame.setAttribute("allowtransparency", "true");

		el.appendChild(frame);
		if (!el.style.maxWidth) el.style.maxWidth = "100%";
	}

	function mountAll(root) {
		var nodes = (root || document).querySelectorAll("[data-qfinhub-calc]");
		for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
	}

	// The embed reports its own height so we never strand the customer with a
	// scrollbar inside a fixed-height box.
	window.addEventListener("message", function (e) {
		if (typeof e.data !== "object" || e.data === null) return;
		if (e.data.type !== "qfinhub:height") return;
		if (e.origin !== ORIGIN && e.origin !== ORIGIN.replace("www.", "")) return;

		var h = parseInt(e.data.height, 10);
		if (!h || h < 200 || h > 4000) return;

		var frames = document.querySelectorAll('iframe[src*="' + NS + '"]');
		for (var i = 0; i < frames.length; i++) {
			if (frames[i].contentWindow === e.source) {
				frames[i].style.height = h + "px";
				break;
			}
		}
	});

	function start() {
		mountAll(document);

		// Pick up widgets injected later (page builders, tabs, infinite scroll).
		if (window.MutationObserver) {
			var pending = null;
			var observer = new MutationObserver(function () {
				if (pending) return;
				pending = setTimeout(function () {
					pending = null;
					mountAll(document);
				}, 150);
			});
			observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}

	// Public API for customers who render widgets from JavaScript.
	window.QFINHUB = window.QFINHUB || {};
	window.QFINHUB.mount = function () {
		mountAll(document);
	};
})();
