import { describe, expect, it } from "vitest";
import { mergeOptions } from "../src/utils/merge-options";

describe("mergeOptions", () => {
	describe("Basic object consolidation", () => {
		it("Should merge four objects in order (later overrides earlier)", () => {
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

		it("Should handle undefined and null values", () => {
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

		it("Should handle empty objects", () => {
			const result1 = mergeOptions({}, {}, {}, {});
			expect(result1).toEqual({});

			const result2 = mergeOptions({ a: 1 }, {}, {}, {});
			expect(result2).toEqual({ a: 1 });

			const result3 = mergeOptions({}, {}, {}, { a: 1 });
			expect(result3).toEqual({ a: 1 });
		});

		it("Should handle different data types", () => {
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
	it("should deep merge all objects' retry property", () => {
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
	it("should handle partial objects with retry property", () => {
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
	it("should handle retry property as undefined or null", () => {
		const opt1 = {
			retry: {
				attempts: 3,
			},
		};
		const opt2 = {
			retry: undefined,
		};
		const opt3 = {
			retry: {
				delay: 1000,
			},
		};
		const opt4 = {
			retry: null,
		};

		const result = mergeOptions(opt1, opt2, opt3, opt4);

		expect(result).toEqual({
			retry: {
				attempts: 3,
				delay: 1000,
			},
		});
	});

	it("should handle non-object retry values - show actual behavior", () => {
		const opt1 = {
			retry: 3,
		};
		const opt2 = {
			retry: "not-object",
		};
		const opt3 = {
			retry: [1, 2, 3],
		};
		const opt4 = {
			delay: 1000,
		};
		const result = mergeOptions(opt1, opt2, opt3, opt4);
		expect(result).toEqual({
			retry: [1, 2, 3],
			delay: 1000,
		});
	});

	it("if there is no retry property, an empty retry object should not be added", () => {
		const opt1 = {
			a: 1,
		};
		const opt2 = {
			b: 2,
		};
		const opt3 = {
			c: 3,
		};
		const opt4 = {
			d: {},
		};
		const result = mergeOptions(opt1, opt2, opt3, opt4);
		expect(result).toEqual({
			a: 1,
			b: 2,
			c: 3,
			d: {},
		});

		expect(result).not.toHaveProperty("retry");
	});
});

describe("Complex scenarios", () => {
	it("should handle deeply nested objects (except retry)", () => {
		const opt1 = {
			nested: {
				a: 1,
				b: {
					x: "deep1",
				},
			},
			retry: {
				a: 1,
				attempts: 1,
			},
		};
		const opt2 = {
			nested: {
				b: {
					y: "deep2",
				},
			},
			retry: {
				attempts: 3,
				factor: 2,
			},
		};
		const result = mergeOptions(opt1, opt2, {}, {});

		// Ordinary nested objects are shallowly merged and then overwritten
		expect(result.nested).toEqual({
			b: {
				y: "deep2",
			},
		});

		// retry property is deeply merged and then overwritten
		expect(result.retry).toEqual({
			attempts: 3,
			factor: 2,
			a: 1,
		});
	});

	it("should handle large number of properties", () => {
		const createLargeObject = (prefix: string, count: number) => {
			const obj: Record<string, string> = {};
			for (let i = 0; i < count; i++) {
				obj[`${prefix}_${i}`] = `value_${i}`;
			}
			return obj;
		};
		const opt1 = createLargeObject("opt1", 100);
		const opt2 = createLargeObject("opt2", 100);
		const opt3 = createLargeObject("opt3", 100);
		const opt4 = createLargeObject("opt4", 100);

		const result = mergeOptions(opt1, opt2, opt3, opt4);

		// Verify all properties exist
		expect(Object.keys(result)).toHaveLength(400);

		// Verify priority
		expect(result.opt1_0).toBe("value_0");
		expect(result.opt4_99).toBe("value_99");
	});
});

describe("Edge cases", () => {
	it("should handle circular references (within allowed range)", () => {
		const obj1: Record<string, any> = {
			a: 1,
		};
		obj1.self = obj1;

		const obj2: Record<string, any> = {
			b: 2,
		};

		expect(() => {
			mergeOptions(obj1, obj2, {}, {});
		}).not.toThrow();
	});
	it("should handle property descriptors", () => {
		const obj1: Record<string, any> = {};
		const obj2: Record<string, any> = {};

		Object.defineProperty(obj1, "readOnly", {
			value: "original",
			writable: false,
			enumerable: true,
		});

		Object.defineProperty(obj2, "readOnly", {
			value: "updated",
			writable: false,
			enumerable: true,
		});
		const result = mergeOptions(obj1, obj2, {}, {});
		expect(result.readOnly).toBe("updated");
	});
});

describe("Practical recommendations for use", () => {
	it("Best practice: retry property should always be an object or undefined", () => {
		// Show recommended usage
		const baseConfig = {
			retry: {
				attempts: 3,
				delay: 1000,
			},
		};
		const userConfig = {
			retry: {
				attempts: 5,
			},
		};
		const envOverride = {};
		const finalOverride = {
			retry: {
				delay: 2000,
			},
		};
		const result = mergeOptions(
			baseConfig,
			userConfig,
			envOverride,
			finalOverride,
		);
		expect(result.retry).toEqual({
			attempts: 5,
			delay: 2000,
		});
	});
});
