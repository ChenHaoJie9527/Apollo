import { describe, expect, test } from "vitest";
import { mergeOptions } from "../src/utils/merge-options";

describe("mergeOptions", () => {
  describe("Basic object consolidation", () => {
    test("Should merge four objects in order (later overrides earlier)", () => {
      const opt1 = { a: 1, b: "first", shared: "from-opt1" };
      const opt2 = { b: "second", c: true, shared: "from-opt2" };
      const opt3 = { c: false, d: [1, 2, 3], shared: "from-opt3" };
      const opt4 = { d: [4, 5], e: { nested: "value" }, shared: "from-opt4" };

      const result = mergeOptions(opt1, opt2, opt3, opt4);
      expect(result).toEqual({
        a: 1,
        b: "second",
        c: false,
        d: [4, 5],
        e: { nested: "value" },
        shared: "from-opt4",
      });
    });

    test("Should handle undefined and null values", () => {
      const opt1 = { a: 1, b: "keep", c: "will-be-null" };
      const opt2 = { a: undefined, b: null, c: null };
      const opt3 = { d: "new" };
      const opt4 = {};

      const result = mergeOptions(opt1, opt2, opt3, opt4);
      expect(result).toEqual({
        a: undefined,
        b: null,
        c: null,
        d: "new",
      });
    });

    test("Should handle empty objects", () => {
      const result1 = mergeOptions({}, {}, {}, {});
      expect(result1).toEqual({});

      const result2 = mergeOptions({ a: 1 }, {}, {}, {});
      expect(result2).toEqual({ a: 1 });

      const result3 = mergeOptions({}, {}, {}, { a: 1 });
      expect(result3).toEqual({ a: 1 });
    });
  });
});
