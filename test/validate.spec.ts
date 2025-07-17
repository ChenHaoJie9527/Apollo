import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, it } from "vitest";
import { validate } from "../src/utils/validate";
import { ValidationError } from "../src/utils/validation-error";

// Mock schemas for testing
const createMockSuccessSchema = <T>(
	outputValue: T,
): StandardSchemaV1<any, T> => ({
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (_input: any) =>
			Promise.resolve({
				value: outputValue,
				issues: undefined,
			}),
	},
});

const createMockFailureSchema = (
	issues: StandardSchemaV1.Issue[],
): StandardSchemaV1 => ({
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (_input: any) =>
			Promise.resolve({
				value: undefined,
				issues,
			}),
	},
});

const createMockSyncSuccessSchema = <T>(
	outputValue: T,
): StandardSchemaV1<any, T> => ({
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (_input: any) => ({
			value: outputValue,
			issues: undefined,
		}),
	},
});

const createMockSyncFailureSchema = (
	issues: StandardSchemaV1.Issue[],
): StandardSchemaV1 => ({
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (_input: any) => ({
			value: undefined,
			issues,
		}),
	},
});

const createMockErrorSchema = (error: Error): StandardSchemaV1 => ({
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (_input: any) => Promise.reject(error),
	},
});

describe("validate", () => {
	describe("Successful validation scenarios", () => {
		it("should return validated value for successful async validation", async () => {
			const expectedOutput = { id: 1, name: "John", email: "john@example.com" };
			const schema = createMockSuccessSchema(expectedOutput);
			const input = { id: "1", name: "John", email: "john@example.com" };

			const result = await validate(schema, input);

			expect(result).toEqual(expectedOutput);
		});

		it("should return validated value for successful sync validation", async () => {
			const expectedOutput = { id: 1, name: "John", email: "john@example.com" };
			const schema = createMockSyncSuccessSchema(expectedOutput);
			const input = { id: "1", name: "John", email: "john@example.com" };

			const result = await validate(schema, input);

			expect(result).toEqual(expectedOutput);
		});

		it("should handle primitive types", async () => {
			const stringSchema = createMockSuccessSchema("validated-string");
			const numberSchema = createMockSuccessSchema(42);
			const booleanSchema = createMockSuccessSchema(true);

			expect(await validate(stringSchema, "input")).toBe("validated-string");
			expect(await validate(numberSchema, "42")).toBe(42);
			expect(await validate(booleanSchema, "true")).toBe(true);
		});

		it("should handle array types", async () => {
			const expectedArray = [1, 2, 3];
			const schema = createMockSuccessSchema(expectedArray);

			const result = await validate(schema, ["1", "2", "3"]);

			expect(result).toEqual(expectedArray);
		});

		it("should handle null and undefined values", async () => {
			const nullSchema = createMockSuccessSchema(null);
			const undefinedSchema = createMockSuccessSchema(undefined);

			expect(await validate(nullSchema, "")).toBe(null);
			expect(await validate(undefinedSchema, "")).toBe(undefined);
		});

		it("should handle nested objects", async () => {
			const expectedOutput = {
				user: {
					profile: {
						name: "John",
						age: 30,
					},
				},
			};
			const schema = createMockSuccessSchema(expectedOutput);

			const result = await validate(schema, {
				user: {
					profile: {
						name: "John",
						age: "30",
					},
				},
			});

			expect(result).toEqual(expectedOutput);
		});
	});

	describe("Validation failure scenarios", () => {
		it("should throw ValidationError for async validation failure", async () => {
			const issues: StandardSchemaV1.Issue[] = [
				{
					kind: "validation",
					type: "string",
					input: 123,
					expected: "string",
					message: "Expected string, received number",
					path: [{ type: "key", key: "name" }],
				},
			];
			const schema = createMockFailureSchema(issues);
			const input = { name: 123 };

			await expect(validate(schema, input)).rejects.toThrow(ValidationError);

			try {
				await validate(schema, input);
			} catch (error) {
				expect(error).toBeInstanceOf(ValidationError);
				expect((error as ValidationError).issues).toEqual(issues);
				expect((error as ValidationError).value).toEqual(input);
				expect((error as ValidationError).name).toBe("ValidationError");
			}
		});

		it("should throw ValidationError for sync validation failure", async () => {
			const issues: StandardSchemaV1.Issue[] = [
				{
					kind: "validation",
					type: "email",
					input: "invalid-email",
					expected: "valid email format",
					message: "Invalid email format",
					path: [{ type: "key", key: "email" }],
				},
			];
			const schema = createMockSyncFailureSchema(issues);
			const input = { email: "invalid-email" };

			await expect(validate(schema, input)).rejects.toThrow(ValidationError);
		});

		it("should handle multiple validation issues", async () => {
			const issues: StandardSchemaV1.Issue[] = [
				{
					kind: "validation",
					type: "string",
					input: 123,
					expected: "string",
					message: "Expected string, received number",
					path: [{ type: "key", key: "name" }],
				},
				{
					kind: "validation",
					type: "email",
					input: "invalid-email",
					expected: "valid email format",
					message: "Invalid email format",
					path: [{ type: "key", key: "email" }],
				},
			];
			const schema = createMockFailureSchema(issues);
			const input = { name: 123, email: "invalid-email" };

			try {
				await validate(schema, input);
			} catch (error) {
				expect(error).toBeInstanceOf(ValidationError);
				expect((error as ValidationError).issues).toHaveLength(2);
				expect((error as ValidationError).issues).toEqual(issues);
			}
		});

		it("should preserve original input data in ValidationError", async () => {
			const issues: StandardSchemaV1.Issue[] = [
				{
					kind: "validation",
					type: "required",
					input: undefined,
					expected: "defined value",
					message: "Required field missing",
					path: [{ type: "key", key: "requiredField" }],
				},
			];
			const schema = createMockFailureSchema(issues);
			const input = { optionalField: "value" };

			try {
				await validate(schema, input);
			} catch (error) {
				expect((error as ValidationError).value).toBe(input);
				expect((error as ValidationError).value).toEqual({
					optionalField: "value",
				});
			}
		});
	});

	describe("Error handling scenarios", () => {
		it("should propagate schema validation errors", async () => {
			const validationError = new Error("Schema validation failed internally");
			const schema = createMockErrorSchema(validationError);

			await expect(validate(schema, {})).rejects.toThrow(
				"Schema validation failed internally",
			);
		});

		it("should handle schema validation rejections", async () => {
			const schema: StandardSchemaV1 = {
				"~standard": {
					version: 1,
					vendor: "test",
					validate: () => Promise.reject(new Error("Custom schema error")),
				},
			};

			await expect(validate(schema, {})).rejects.toThrow("Custom schema error");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty issues array as success", async () => {
			const schema: StandardSchemaV1<any, string> = {
				"~standard": {
					version: 1,
					vendor: "test",
					validate: (_input: any) =>
						Promise.resolve({
							value: "success",
							issues: [], // Empty array should be treated as no issues
						}),
				},
			};

			const result = await validate(schema, "input");
			expect(result).toBe("success");
		});

		it("should handle complex nested path issues", async () => {
			const issues: StandardSchemaV1.Issue[] = [
				{
					kind: "validation",
					type: "array",
					input: "not-an-array",
					expected: "array",
					message: "Expected array",
					path: [
						{ type: "key", key: "users" },
						{ type: "index", key: 0 },
						{ type: "key", key: "permissions" },
					],
				},
			];
			const schema = createMockFailureSchema(issues);

			try {
				await validate(schema, { users: [{ permissions: "not-an-array" }] });
			} catch (error) {
				expect((error as ValidationError).issues[0].path).toHaveLength(3);
				expect((error as ValidationError).issues[0].path![0]).toEqual({
					type: "key",
					key: "users",
				});
				expect((error as ValidationError).issues[0].path![1]).toEqual({
					type: "index",
					key: 0,
				});
				expect((error as ValidationError).issues[0].path![2]).toEqual({
					type: "key",
					key: "permissions",
				});
			}
		});

		it("should handle large input data", async () => {
			const largeData = {
				users: Array.from({ length: 1000 }, (_, i) => ({
					id: i,
					name: `User ${i}`,
					data: new Array(100).fill(`data-${i}`),
				})),
			};
			const schema = createMockSuccessSchema(largeData);

			const result = await validate(schema, largeData);
			expect(result).toEqual(largeData);
			expect(result.users).toHaveLength(1000);
		});

		it("should handle schema with undefined result value but no issues", async () => {
			const schema: StandardSchemaV1<any, undefined> = {
				"~standard": {
					version: 1,
					vendor: "test",
					validate: (_input: any) =>
						Promise.resolve({
							value: undefined,
							issues: undefined,
						}),
				},
			};

			const result = await validate(schema, "input");
			expect(result).toBeUndefined();
		});
	});

	describe("Type safety scenarios", () => {
		it("should maintain type information for successful validation", async () => {
			interface User {
				id: number;
				name: string;
				email: string;
			}

			const expectedUser: User = {
				id: 1,
				name: "John",
				email: "john@example.com",
			};
			const schema = createMockSuccessSchema(expectedUser);

			const result = await validate(schema, {
				id: "1",
				name: "John",
				email: "john@example.com",
			});

			// TypeScript should infer the correct type
			expect(result.id).toBe(1);
			expect(result.name).toBe("John");
			expect(result.email).toBe("john@example.com");
		});

		it("should work with different input and output types", async () => {
			// Simulating a schema that transforms string to number
			const schema: StandardSchemaV1<string, number> = {
				"~standard": {
					version: 1,
					vendor: "test",
					validate: (input: string) =>
						Promise.resolve({
							value: Number.parseInt(input, 10),
							issues: undefined,
						}),
				},
			};

			const result = await validate(schema, "42");
			expect(result).toBe(42);
			expect(typeof result).toBe("number");
		});
	});
});
