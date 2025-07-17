import { describe, expect, it, vi } from "vitest";
import type { SerializeParams } from "../src/types/SerializeParams";
import { resolveUrl } from "../src/utils/resolve-url";

const mockSerializeParams: SerializeParams = vi.fn((params) => {
	const entries = Object.entries(params).filter(
		([_, value]) => value !== undefined,
	);
	if (entries.length === 0) {
		return "";
	}
	return entries
		.map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
		.join("&");
});

describe("URL input handling", () => {
	it("should handle string input", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});
	it("should handle URL object input", () => {
		const url = new URL("https://example.com/users");
		const result = resolveUrl(
			"",
			url,
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});
});

describe("absolute URL handling", () => {
	it("should use absolute URL as-is regardless of base", () => {
		const result = resolveUrl(
			"https://base.com",
			"https://example.com",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});
	it("should handle https URLs", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});
	it("should handle http URLs", () => {
		const result = resolveUrl(
			"",
			"http://example.com/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("http://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});
});

describe("relative URL handling", () => {
	it("should combine base and relative path", () => {
		const result = resolveUrl(
			"https://base.com",
			"/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://base.com/users");
	});

	it("should handle base with trailing slash", () => {
		const result = resolveUrl(
			"https://base.com/",
			"users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://base.com/users");
	});

	it("should handle relative path without leading slash", () => {
		const result = resolveUrl(
			"https://base.com",
			"users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://base.com/users");
	});

	it("should handle multiple slashes correctly", () => {
		const result = resolveUrl(
			"https://base.com///",
			"//users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://base.com/users");
	});

	it("should use input as-is when no base provided", () => {
		const result = resolveUrl(
			"",
			"/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("/users");
	});

	it("should use input as-is when base is undefined", () => {
		const result = resolveUrl(
			undefined,
			"/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("/users");
	});

	it("should use base when input is empty", () => {
		const result = resolveUrl(
			"https://base.com",
			"",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://base.com");
	});
});

describe("query parameters handling", () => {
	it("should add parameters when URL has no existing query", () => {
		const fetchParams = {
			userId: 1,
			type: "active",
		};
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			fetchParams,
			mockSerializeParams,
		);

		expect(result).toBe("https://example.com/users?userId=1&type=active");
		expect(mockSerializeParams).toHaveBeenCalledWith(fetchParams);
	});

	it("should append parameters when URL already has query", () => {
		const fetcherParams = {
			type: "active",
		};
		const result = resolveUrl(
			"",
			"https://example.com/users?userId=1",
			undefined,
			fetcherParams,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users?userId=1&type=active");
	});

	it("should merge defaultOptsParams and fetcherOptsParams", () => {
		const defaultParams = {
			limit: 10,
			sort: "name",
		};
		const fetcherParams = {
			userId: 1,
		};
		const result = resolveUrl(
			"",
			"https://example.com/users",
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);

		expect(result).toBe(
			"https://example.com/users?limit=10&sort=name&userId=1",
		);
		expect(mockSerializeParams).toHaveBeenCalledWith({
			limit: 10,
			sort: "name",
			userId: 1,
		});
	});

	it("should prioritize fetcherOptsParams over defaultOptsParams", () => {
		const defaultParams = {
			limit: 10,
			userId: 999,
		};

		const fetcherParams = {
			userId: 1,
		};

		const result = resolveUrl(
			"",
			"https://example.com/users",
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);

		expect(result).toBe("https://example.com/users?limit=10&userId=1");
		expect(mockSerializeParams).toHaveBeenCalledWith({
			limit: 10,
			userId: 1,
		});
	});

	it("should exclude defaultOptsParams keys that exist in URL", () => {
		const defaultParams = {
			page: 2,
			limit: 100,
			sort: "name",
		};
		const fetcherParams = {
			userId: 1,
		};

		const result = resolveUrl(
			"",
			"https://example.com/users?page=1",
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);

		expect(result).toBe(
			"https://example.com/users?page=1&limit=100&sort=name&userId=1",
		);
		expect(mockSerializeParams).toHaveBeenCalledWith({
			limit: 100,
			sort: "name",
			userId: 1,
		});
	});

	it("should handle complex query parameter scenarios", () => {
		const defaultParams = {
			page: 1,
			limit: 20,
			sort: "create_id",
			filter: "active",
		};

		const fetcherParams = {
			userId: 123,
			limit: 50,
			search: "john",
		};

		const result = resolveUrl(
			"",
			"https://example.com/users?page=2&extra=value",
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);

		expect(result).toBe(
			"https://example.com/users?page=2&extra=value&limit=50&sort=create_id&filter=active&userId=123&search=john",
		);
		expect(mockSerializeParams).toHaveBeenCalledWith({
			limit: 50, // fetcherParams override
			sort: "create_id", // from defaultParams
			filter: "active", // from defaultParams
			userId: 123, // from fetcherParams
			search: "john", // from fetcherParams
		});
	});

	it("should handle empty parameters gracefully", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users",
			{},
			{},
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});

	it("should handle undefined parameters", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users");
		expect(mockSerializeParams).toHaveBeenCalledWith({});
	});

	it("should remove leading ? from serialized params", () => {
		const mockSerializeWithQuestionMark = vi.fn(() => "?userId=123&type=1");
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			undefined,
			mockSerializeWithQuestionMark,
		);

		expect(result).toBe("https://example.com/users?userId=123&type=1");
	});
});

describe("URL parsing edge cases", () => {
	it("should handle malformed URLs gracefully", () => {
		const result = resolveUrl(
			"",
			"not-a-valid-url",
			undefined,
			{
				test: "value",
			},
			mockSerializeParams,
		);
		expect(result).toBe("not-a-valid-url?test=value");
	});

	it("should handle relative paths with query parameters", () => {
		const defaultParams = {
			from: "default",
			to: "test1", // to will be filtered out because it already exists in the URL.
		};
		const result = resolveUrl(
			"https://example.com",
			"/users?to=test2",
			defaultParams,
			undefined,
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users?to=test2&from=default");
		expect(mockSerializeParams).toHaveBeenCalledWith({
			from: "default",
		});
	});

	it("should handle URL with fragment", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users#fragment",
			undefined,
			{ test: "value" },
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com/users#fragment?test=value");
		expect(mockSerializeParams).toHaveBeenCalledWith({
			test: "value",
		});
	});

	it("should handle URL with port", () => {
		const result = resolveUrl(
			"",
			"https://example.com:8080/users",
			undefined,
			{
				test: "value",
			},
			mockSerializeParams,
		);
		expect(result).toBe("https://example.com:8080/users?test=value");
	});
});

describe("integration scenarios", () => {
	it("should handle complete real-world scenario", () => {
		const base = "https://api.myapp.com/v1";
		const input = "/users?page=1&sort=name";
		const defaultParams = {
			apiKey: "default-key",
			page: 999, // should be excluded because exists in URL
			limit: 20,
			version: "v1",
		};
		const fetcherParams = {
			userId: 123,
			limit: 50, // should override default
			includeDelete: false,
		};

		const result = resolveUrl(
			base,
			input,
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);
		expect(result).toBe(
			"https://api.myapp.com/v1/users?page=1&sort=name&apiKey=default-key&limit=50&version=v1&userId=123&includeDelete=false",
		);
		expect(mockSerializeParams).toHaveBeenCalledWith({
			apiKey: "default-key",
			limit: 50,
			version: "v1",
			userId: 123,
			includeDelete: false,
		});
	});

	it("should work with omit function for parameter exclusion", () => {
		const input = new URL("https://api.example.com/search?q=test&format=json");
		const defaultParams = {
			q: "should-be-excluded", // should be excluded because exists in URL
			format: "should-be-excluded", // should be excluded because exists in URL
			limit: 10,
			apiKey: "secret",
		};
		const fetcherParams = {
			page: 1,
		};

		const result = resolveUrl(
			"",
			input,
			defaultParams,
			fetcherParams,
			mockSerializeParams,
		);
		expect(result).toBe(
			"https://api.example.com/search?q=test&format=json&limit=10&apiKey=secret&page=1",
		);
		expect(mockSerializeParams).toHaveBeenCalledWith({
			limit: 10,
			apiKey: "secret",
			page: 1,
		});
	});
});

describe("return type and format", () => {
	it("should always return a string", () => {
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			undefined,
			mockSerializeParams,
		);
		expect(typeof result).toBe("string");
	});

	it("should handle when serializeParams returns empty string", () => {
		const emptySerialize: SerializeParams = vi.fn(() => "");
		const result = resolveUrl(
			"",
			"https://example.com/users",
			undefined,
			{
				test: "value",
			},
			emptySerialize,
		);
		expect(result).toBe("https://example.com/users");
	});
});
