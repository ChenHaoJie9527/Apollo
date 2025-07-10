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
import type { MinFetchFn } from "../src/types";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

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
