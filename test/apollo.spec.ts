import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterAll,
  afterEach,
  beforeAll,
} from "vitest";
import { apollo } from "../src/apollo";
import type { DefaultOptions, MinFetchFn } from "../src/types";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

// Global MSW server setup for all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("apollo", () => {
  // 基础函数定义测试
  it("should be defined", () => {
    expect(apollo).toBeDefined();
  });

  it("should accept a fetch function matching MinFetchFn", () => {
    const fetch: MinFetchFn = (_url: Request) =>
      Promise.resolve(Response.json({}));
    const api = apollo(fetch, () => ({}));
    expect(api).toBeDefined();
  });
});

describe("apollo http request with msw", () => {
  it.each`
    scenario               | method      | url                               | responseStatus | responseData                   | expectedResult
    ${"GET successful"}    | ${"GET"}    | ${"https://api.test.com/users"}   | ${200}         | ${{ users: ["Alice", "Bob"] }} | ${{ users: ["Alice", "Bob"] }}
    ${"POST successful"}   | ${"POST"}   | ${"https://api.test.com/users"}   | ${201}         | ${{ id: 1, name: "Alice" }}    | ${{ id: 1, name: "Alice" }}
    ${"PUT successful"}    | ${"PUT"}    | ${"https://api.test.com/users/1"} | ${200}         | ${{ id: 1, name: "Updated" }}  | ${{ id: 1, name: "Updated" }}
    ${"DELETE successful"} | ${"DELETE"} | ${"https://api.test.com/users/1"} | ${204}         | ${null}                        | ${null}
    ${"JSON response"}     | ${"GET"}    | ${"https://api.test.com/data"}    | ${200}         | ${{ message: "success" }}      | ${{ message: "success" }}
  `(
    "should $scenario",
    async ({ method, url, responseStatus, responseData, expectedResult }) => {
      server.use(
        http[method.toLowerCase()](url, () => {
          return HttpResponse.json(responseData, { status: responseStatus });
        })
      );
      const api = apollo(fetch);
      const result = await api(url, {
        method,
      });
      expect(result).toEqual(expectedResult);
    }
  );
});

describe("Testing Error Scenarios", () => {
  it.each`
    scenario              | method    | url                             | responseData | shouldThrow
    ${"404 Not Found"}    | ${"GET"}  | ${"https://api.test.com/404"}   | ${404}       | ${true}
    ${"500 Server Error"} | ${"GET"}  | ${"https://api.test.com/500"}   | ${500}       | ${true}
    ${"400 Bad Request"}  | ${"POST"} | ${"https://api.test.com/bad"}   | ${400}       | ${true}
    ${"Network Error"}    | ${"GET"}  | ${"https://api.test.com/error"} | ${null}      | ${true}
    ${"401 Unauthorized"} | ${"GET"}  | ${"https://api.test.com/auth"}  | ${401}       | ${true}
  `(
    "should handle $scenario",
    async ({ method, url, responseData, shouldThrow }) => {
      server.use(
        http[method.toLowerCase()](url, () => {
          if (responseData === null) {
            return HttpResponse.error();
          }
          return HttpResponse.json(
            {
              error: "Something went wrong",
            },
            {
              status: responseData,
            }
          );
        })
      );

      const api = apollo(fetch);

      if (shouldThrow) {
        await expect(api(url, { method })).rejects.toThrow();
      }
    }
  );
});

describe("Testing with custom default options", () => {
  it("should work with custom default options", async () => {
    const testURL = "https://api.test.com/configured";

    server.use(
      http.get(testURL, () => {
        return HttpResponse.json({
          configured: true,
        });
      })
    );

    const getDefaultOptions = (): DefaultOptions<typeof fetch, any, any> => {
      return {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        parseResponse: async (response) => {
          return await response.json();
        },
      };
    };

    const api = apollo(fetch, getDefaultOptions);
    const result = await api(testURL, {});
    expect(result).toEqual({
      configured: true,
    });
  });

  it("should serialize request body correctly", async () => {
    const testURL = "https://api.test.com/serialize";
    const requestBody = {
      name: "Test User",
      age: 25,
    };

    let receiveBody: any;

    server.use(
      http.post(testURL, async ({ request }) => {
        receiveBody = await request.json();
        return HttpResponse.json({
          receive: true,
        });
      })
    );

    const api = apollo(fetch)
    await api(testURL, {
      method: "POST",
      body: requestBody
    })

    expect(receiveBody).toEqual(requestBody);
  });
});
