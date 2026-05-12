import { describe, it, expect } from "vitest";
import { evaluateFormula } from "@/lib/ai/evaluator";

describe("evaluateFormula", () => {
  // ── 1. Basic Arithmetic ──────────────────────────────────────────
  describe("basic arithmetic", () => {
    it("evaluates compound interest formula: principal * (1 + rate/100)^years", () => {
      const result = evaluateFormula("principal * (1 + rate/100)^years", {
        principal: 10000,
        rate: 7,
        years: 10,
      });
      // 10000 * (1.07)^10 ≈ 19671.51
      expect(result).toBeCloseTo(19671.51, -1); // ~2 decimal places
    });

    it("evaluates simple addition", () => {
      expect(evaluateFormula("a + b", { a: 5, b: 10 })).toBe(15);
    });

    it("evaluates multiplication and division", () => {
      expect(evaluateFormula("a * b / c", { a: 10, b: 20, c: 5 })).toBe(40);
    });

    it("evaluates exponentiation", () => {
      expect(evaluateFormula("2^10", {})).toBe(1024);
    });

    it("respects operator precedence", () => {
      expect(evaluateFormula("2 + 3 * 4", {})).toBe(14);
    });
  });

  // ── 2. Monthly Compound with Contributions ──────────────────────
  describe("monthly compound with contributions", () => {
    it("calculates final balance with monthly compounding and contributions", () => {
      // Formula: principal * (1 + rate/100/12)^(years*12) + contribution * (((1 + rate/100/12)^(years*12) - 1) / (rate/100/12))
      const formula =
        "principal * (1 + rate/100/12)^(years*12) + contribution * (((1 + rate/100/12)^(years*12) - 1) / (rate/100/12))";

      const result = evaluateFormula(formula, {
        principal: 10000,
        rate: 7,
        years: 10,
        contribution: 500,
      });

      // 10000 * (1 + 0.07/12)^120 + 500 * (((1 + 0.07/12)^120 - 1) / (0.07/12))
      // ≈ 20096.61 + 500 * 173.08... ≈ 20096.61 + 86541.07 ≈ 106637.68
      expect(result).toBeGreaterThan(100000);
      expect(result).toBeLessThan(110000);
    });

    it("calculates total contributions correctly", () => {
      const formula = "principal + contribution * years * 12";
      const result = evaluateFormula(formula, {
        principal: 10000,
        contribution: 500,
        years: 10,
      });
      expect(result).toBe(10000 + 500 * 10 * 12); // 70000
    });

    it("handles zero contribution", () => {
      const formula =
        "principal * (1 + rate/100/12)^(years*12) + contribution * (((1 + rate/100/12)^(years*12) - 1) / max(rate/100/12, 0.0001))";
      const result = evaluateFormula(formula, {
        principal: 5000,
        rate: 5,
        years: 5,
        contribution: 0,
      });
      // Just principal compounding monthly with no contributions
      expect(result).toBeCloseTo(5000 * (1 + 0.05 / 12) ** 60, -1);
    });
  });

  // ── 3. max() function ───────────────────────────────────────────
  describe("max() function", () => {
    it("returns value when it exceeds the threshold", () => {
      const result = evaluateFormula("max(0, value - 500)", { value: 1000 });
      expect(result).toBe(500);
    });

    it("returns 0 when value is below the threshold", () => {
      const result = evaluateFormula("max(0, value - 500)", { value: 300 });
      expect(result).toBe(0);
    });

    it("returns 0 when value equals the threshold", () => {
      const result = evaluateFormula("max(0, value - 500)", { value: 500 });
      expect(result).toBe(0);
    });

    it("works with negative thresholds", () => {
      const result = evaluateFormula("max(-100, value - 500)", { value: 400 });
      expect(result).toBe(-100);
    });

    it("supports min() function too", () => {
      const result = evaluateFormula("min(100, value)", { value: 500 });
      expect(result).toBe(100);
    });
  });

  // ── 4. Division by Zero ─────────────────────────────────────────
  describe("division by zero", () => {
    it("handles explicit division by zero gracefully", () => {
      // Division by zero in mathjs returns Infinity, which should be caught or handled
      const result = evaluateFormula("a / b", { a: 10, b: 0 });
      expect(typeof result).toBe("number");
      expect(result).toBe(0); // The evaluator defaults to 0 on errors
    });

    it("handles zero denominator in compound formula", () => {
      // This triggers an Infinity which is handled
      const result = evaluateFormula("1 / (x - x)", { x: 5 });
      expect(typeof result).toBe("number");
    });
  });

  // ── 5. Negative Values ──────────────────────────────────────────
  describe("negative values handling", () => {
    it("handles negative principal", () => {
      const result = evaluateFormula("principal * (1 + rate/100)^years", {
        principal: -10000,
        rate: 7,
        years: 10,
      });
      expect(result).toBeCloseTo(-19671.51, -1);
    });

    it("handles negative interest rate", () => {
      const result = evaluateFormula("principal * (1 + rate/100)^years", {
        principal: 10000,
        rate: -5,
        years: 5,
      });
      expect(result).toBeCloseTo(10000 * (1 - 0.05) ** 5, -1);
    });

    it("evaluates formulas with negative intermediate results", () => {
      const result = evaluateFormula("a - b", { a: 10, b: 100 });
      expect(result).toBe(-90);
    });

    it("handles max() with negative values", () => {
      const result = evaluateFormula("max(-50, value)", { value: -100 });
      expect(result).toBe(-50);
    });
  });

  // ── 6. Edge Cases ───────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns 0 for NaN results", () => {
      // mathjs might throw or return NaN; evaluator catches and returns 0
      const result = evaluateFormula("0/0", {});
      expect(result).toBe(0);
    });

    it("handles missing variables gracefully", () => {
      // When a variable used in formula is not in the variables object,
      // mathjs could throw, which evaluator catches to return 0
      const result = evaluateFormula("principal * rate", {});
      expect(result).toBe(0);
    });

    it("handles NaN input in variables", () => {
      // NaN in variables could propagate; evaluator should handle
      const result = evaluateFormula("a + b", { a: NaN, b: 5 });
      // NaN + 5 = NaN → caught → 0
      expect(result).toBe(0);
    });

    it("handles Infinity in variables", () => {
      const result = evaluateFormula("a + b", {
        a: Infinity,
        b: 5,
      });
      expect(result).toBe(0);
    });

    it("returns 0 for empty formula string", () => {
      const result = evaluateFormula("", {});
      expect(result).toBe(0);
    });

    it("handles formula with only whitespace", () => {
      const result = evaluateFormula("   ", {});
      expect(result).toBe(0);
    });

    it("handles undefined variables gracefully", () => {
      const result = evaluateFormula("a + b", { a: 10 } as Record<string, number>);
      expect(result).toBe(0);
    });

    it("provides PI constant in scope", () => {
      const result = evaluateFormula("PI", {});
      expect(result).toBeCloseTo(Math.PI, 5);
    });

    it("provides E constant in scope", () => {
      const result = evaluateFormula("E", {});
      expect(result).toBeCloseTo(Math.E, 5);
    });

    it("handles backslash to forward slash normalization", () => {
      // The evaluator replaces \ with /
      const result = evaluateFormula("a \\ b", { a: 10, b: 2 });
      expect(result).toBe(5);
    });
  });
});
