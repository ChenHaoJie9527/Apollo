import { describe, expect, it } from "vitest";
import { apollo } from "../src/apollo";
import type { DefaultOptions, MinFetchFn } from "../src/types";

describe("apollo", () => {
  // check if apollo function is defined
  it("should be defined", () => {
    expect(apollo).toBeDefined();
  });

  // check if the first parameter of apollo function is compatible with the generic T
  it("should accept a fetch function matching MinFetchFn", () => {
    const fetch: MinFetchFn = (_url: string) =>
      Promise.resolve(Response.json({}));
    const api = apollo(fetch, () => ({}));
    expect(api).toBeDefined();
  });

  // check if getDefaultOptions is called and the return value is correct
  it("should call getDefaultOptions and return its result", async () => {
    const myFetch: MinFetchFn = async (
      input,
      fetchOpts,
      ctx
    ): Promise<Response> => {
      console.log("Fetch called with:", { input, fetchOpts, ctx });
      return Response.json({});
    };

    const getDefaultOptions = (
      input,
      fetchOpts,
      ctx
    ): DefaultOptions<typeof fetch, any, any> => {
      return {
        baseUrl: "https://api.example.com",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 1234567890",
        },
        method: "GET",
        params: {
          name: "John",
          age: 30,
        },
        credentials: "include",
        parseResponse: async (response) => {
          const data = await response.json();
          return data;
        },
        serializeBody: (body) => {
          return JSON.stringify(body);
        },
      };
    };

    const api = apollo(myFetch, getDefaultOptions);
    const result = await api(
      "/users",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        auth: "1234567890",
      }
    );

    expect(result).toEqual({
      parseRejected: expect.any(Function),
      reject: expect.any(Function),
      retry: {
        attempts: 0,
        delay: 0,
        when: expect.any(Function),
      },
      serializeParams: expect.any(Function),
      baseUrl: "https://api.example.com",
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
      params: {
        name: "John",
        age: 30,
      },
      credentials: "include",
      parseResponse: expect.any(Function),
      serializeBody: expect.any(Function),
    });
  });
});

describe("Should receive the apollo arguments (up to 3)", () => {
  const baseUrl = "https://example.com";
  it.each`
    expectedInput       | expectedOptions         | expectedCtx
    ${baseUrl}          | ${{ method: "DELETE" }} | ${{ is: "ctx" }}
    ${new URL(baseUrl)} | ${{ method: "DELETE" }} | ${"context"}
    ${baseUrl}          | ${{ method: "POST" }}   | ${{ name: "John", age: 30 }}
  `("test case %#", async ({ expectedInput, expectedOptions, expectedCtx }) => {
    const fetch: MinFetchFn = async (input, fetchOpts, ctx) => {
      expect(input).toBe(expectedInput);
      expect(fetchOpts).toEqual(expectedOptions);
      expect(ctx).toEqual(expectedCtx);
      return Response.json({});
    };

    const defaultOptions = (input, fetchOpts, ctx) => {
      return {
        baseUrl: expectedInput || expectedInput.href,
        method: expectedOptions.method,
        headers: {
          "Content-Type": "application/json",
        },
        params: expectedOptions.params,
        credentials: expectedOptions.credentials,
        parseResponse: expectedOptions.parseResponse,
        accessToken: "123",
        body: expectedCtx,
      };
    };

    const api = apollo(fetch, defaultOptions);
    const result = await api(expectedInput, expectedOptions, expectedCtx);

    expect(result).toEqual({
      parseRejected: expect.any(Function),
      reject: expect.any(Function),
      retry: {
        attempts: 0,
        delay: 0,
        when: expect.any(Function),
      },
      serializeParams: expect.any(Function),
      serializeBody: expect.any(Function),
      baseUrl: expectedInput,
      method: expectedOptions.method,
      headers: {
        "Content-Type": "application/json",
      },
      params: undefined,
      credentials: undefined,
      parseResponse: undefined,
      accessToken: "123",
      body: expectedCtx,
    });
  });
});

describe("Do not pass in the default options function", () => {
  const baseUrl = "https://example.com";
  it.each`
    expectedInput       | expectedOptions         | expectedCtx
    ${baseUrl}          | ${{ method: "DELETE" }} | ${{ is: "ctx" }}
    ${new URL(baseUrl)} | ${{ method: "DELETE" }} | ${"context"}
    ${baseUrl}          | ${{ method: "POST" }}   | ${{ name: "John", age: 30 }}
  `("test case %#", async ({ expectedInput, expectedOptions, expectedCtx }) => {
    const fetch: MinFetchFn = async (input, fetchOpts, ctx) => {
      expect(input).toBe(expectedInput);
      expect(fetchOpts).toEqual(expectedOptions);
      expect(ctx).toEqual(expectedCtx);
      return Response.json({});
    };

    const api = apollo(fetch);
    const result = await api(expectedInput, expectedOptions, expectedCtx);

    expect(result).toEqual({
      parseRejected: expect.any(Function),
      parseResponse: expect.any(Function),
      reject: expect.any(Function),
      retry: {
        attempts: 0,
        delay: 0,
        when: expect.any(Function),
      },
      serializeBody: expect.any(Function),
      serializeParams: expect.any(Function),
      method: expectedOptions.method,
    });
  });
});
