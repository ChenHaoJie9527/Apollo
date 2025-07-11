import { describe, it, expect } from "vitest";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { validate, ValidationError } from "../src/utils";

const createMockSuccessSchema = <T>(
  outputValue: T
): StandardSchemaV1<any, T> => {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate(input: any) {
        return Promise.resolve({
          value: outputValue,
          issues: undefined,
        });
      },
    },
  };
};

const createMockFailureSchema = (
  issues: StandardSchemaV1.Issue[]
): StandardSchemaV1 => {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate(value: any) {
        return Promise.resolve({
          value: undefined,
          issues,
        });
      },
    },
  };
};

const createMockSyncSuccessSchema = <T>(
  outputValue: T
): StandardSchemaV1<any, T> => {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate(value: any) {
        return {
          value: outputValue,
          issues: undefined,
        };
      },
    },
  };
};

const createMockSyncFailureSchema = (
  issues: StandardSchemaV1.Issue[]
): StandardSchemaV1 => ({
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (input: any) => ({
      value: undefined,
      issues,
    }),
  },
});

const createMockErrorSchema = (error: Error): StandardSchemaV1 => ({
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (input: any) => Promise.reject(error),
  },
});

describe("validate", () => {
  describe("Successful validation scenarios", () => {
    it("should return validated value for successful async validation", async () => {
      const expectedOutput = {
        id: "1",
        name: "Join",
        email: "join@example.com",
      };
      const schema = createMockSuccessSchema(expectedOutput);
      const input = {
        id: "1",
        name: "Join",
        email: "join@example.com",
      };
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
});
