import { resolveUrl } from "../src/utils/resolve-url";
import { describe, it, expect, vi } from "vitest";
import type { SerializeParams } from "../src/types/SerializeParams";

const mockSerializeParams: SerializeParams = vi.fn((params) => {
  const entries = Object.entries(params).filter(
    ([_, value]) => value !== undefined
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
      mockSerializeParams
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
      mockSerializeParams
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
      mockSerializeParams
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
      mockSerializeParams
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
      mockSerializeParams
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
      mockSerializeParams
    );
    expect(result).toBe("https://base.com/users");
  });
});
