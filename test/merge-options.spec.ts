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

    test("Should handle different data types", () => {
      const opt1 = { value: "string" };
      const opt2 = { value: 123 };
      const opt3 = { value: true };
      const opt4 = { value: { nested: "object" } };

      const result = mergeOptions(opt1, opt2, opt3, opt4);
      expect(result).toEqual({
        value: { nested: "object" },
      });
    });
  });
});

describe("retry property deep merge", () => {
  test("should deep merge all objects' retry property", () => {
    const opt1 = {
      retry: {
        attempts: 3,
        factor: 2,
        maxDelay: 1000,
        minDelay: 100,
      },
      other: "value1",
    };
    const opt2 = {
      retry: {
        attempts: 5,
        // TODO: This is an error because when is a function and cannot be merged.
        // when: () => true
      },
      other: "value2",
    };
    const opt3 = {
      retry: {
        attempts: 7,
        backoff: "exponential",
        maxDelay: 2000,
      },
      other: "value3",
    };
    const opt4 = {
      retry: {
        attempts: 9,
        factor: 3,
        backoff: "linear",
      },
      other: "value4",
    };

    const result = mergeOptions(opt1, opt2, opt3, opt4);
    console.log("result =>", result);
    expect(result).toEqual({
      retry: {
        attempts: 9,
        factor: 3,
        maxDelay: 2000,
        minDelay: 100,
        // when: () => true,
        backoff: "linear",
      },
      other: "value4",
    });
  });
  test("should handle partial objects with retry property", () => {
    const opt1 = {
      normal: "prop1",
    };
    const opt2 = {
      retry: {
        attempts: 3,
      },
    };
    const opt3 = {
      normal: "updated",
    };
    const opt4 = {
      retry: {
        attempts: 4,
        delay: 1000,
      },
    };
    const result = mergeOptions(opt1, opt2, opt3, opt4);
    expect(result).toEqual({
      normal: "updated",
      retry: {
        attempts: 4,
        delay: 1000,
      },
    });
  });
});
