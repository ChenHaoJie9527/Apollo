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
    const fetch: MinFetchFn = (_url: Request) =>
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
      new Request("https://api.example.com/users"),
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
      serializeBody: expect.any(Function),
      baseUrl: "https://api.example.com",
      headers: {
        "content-type": "application/json",
      },
      method: "GET",
      params: {
        name: "John",
        age: 30,
      },
      credentials: "include",
      parseResponse: expect.any(Function),
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
        "content-type": "application/json",
      },
      params: undefined,
      credentials: undefined,
      parseResponse: undefined,
      accessToken: "123",
      body:
        typeof expectedCtx === "object"
          ? JSON.stringify(expectedCtx)
          : expectedCtx,
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
      headers: {},
      method: expectedOptions.method,
    });
  });
});

describe("withTimeout integration", () => {
  it("should handle timeout in finalOptions", async () => {
    const myFetch: MinFetchFn = async (
      input,
      fetchOpts,
      ctx
    ): Promise<Response> => {
      // Here we don't actually execute fetch, because we are only testing the options processing of apollo
      return Response.json({});
    };

    // getDefaultOptions returns a configuration containing timeout
    const getDefaultOptions = (): DefaultOptions<typeof myFetch, any, any> => {
      return {
        method: "GET",
        timeout: 5000, // 5 seconds timeout
        headers: {
          "Content-Type": "application/json",
        },
        parseResponse: async (response) => {
          return await response.json();
        },
        serializeBody: (body) => {
          return JSON.stringify(body);
        },
      };
    };

    const api = apollo(myFetch, getDefaultOptions);
    const result = await api(new Request("https://api.example.com/test"), {});
    // Verify that the result contains the signal property
    expect(result).toHaveProperty("signal");

    // If the environment supports AbortSignal.timeout and AbortSignal.any, signal should not be undefined
    // If not supported, signal should be undefined (fallback behavior)
    if ("any" in AbortSignal && "timeout" in AbortSignal) {
      expect(result.signal).toBeDefined();
      expect(result.signal).toBeInstanceOf(AbortSignal);
    } else {
      // In unsupported environments, withTimeout should return undefined
      expect(result.signal).toBeUndefined();
    }

    // Verify that other basic properties still exist
    expect(result).toEqual(
      expect.objectContaining({
        method: "GET",
        timeout: 5000,
        headers: expect.any(Object),
        parseResponse: expect.any(Function),
        serializeBody: expect.any(Function),
        signal: expect.anything(), // signal may be AbortSignal or undefined
      })
    );
  });

  it("should handle timeout with user provided signal", async () => {
    const myFetch: MinFetchFn = async (
      input,
      fetchOpts,
      ctx
    ): Promise<Response> => {
      return Response.json({});
    };

    const getDefaultOptions = (): DefaultOptions<typeof myFetch, any, any> => {
      return {
        method: "POST",
        timeout: 3000, // 3 seconds timeout
        headers: {
          "Content-Type": "application/json",
        },
      };
    };

    // User provided AbortController
    const userController = new AbortController();

    const api = apollo(myFetch, getDefaultOptions);
    const result = await api(new Request("https://api.example.com/test"), {
      signal: userController.signal,
      body: { test: "data" },
    });

    // Verify the result
    expect(result).toHaveProperty("signal");
    expect(result).toHaveProperty("timeout", 3000);

    // Verify that the body is correctly serialized
    expect(result.body).toBe('{"test":"data"}');

    // Verify that Content-Type is automatically added (because the body is serialized)
    expect(result.headers).toEqual(
      expect.objectContaining({
        "content-type": "application/json",
      })
    );
  });

  it("should not add signal when timeout is not provided", async () => {
    const myFetch: MinFetchFn = async (
      input,
      fetchOpts,
      ctx
    ): Promise<Response> => {
      return Response.json({});
    };

    // getDefaultOptions does not contain timeout
    const getDefaultOptions = (): DefaultOptions<typeof myFetch, any, any> => {
      return {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };
    };

    const api = apollo(myFetch, getDefaultOptions);
    const result = await api(new Request("https://api.example.com/test"), {});

    // When there is no timeout, signal should be undefined
    expect(result.signal).toBeUndefined();

    // Verify that other properties are normal
    expect(result).toEqual(
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Object),
      })
    );
  });
});
