import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { apolloStateMachine } from "../src/apollo-state-machine";

const server = setupServer();

beforeAll(() => {
	server.listen();
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});

describe("apolloStateMachine", () => {
	const testURL = "https://jsonplaceholder.typicode.com/posts/1";

	it("should handle successful request", async () => {
		const mockData = { id: 1, title: "Test Post" };

		server.use(
			http.get(testURL, () => {
				return HttpResponse.json(mockData);
			}),
		);

		const api = apolloStateMachine(fetch);
		const result = await api(testURL, {});

		expect(result).toEqual(mockData);
	});

	it("should handle request with retry", async () => {
		const mockData = { id: 1, title: "Test Post" };
		let attemptCount = 0;
		let retryCallbackCalled = false;

		server.use(
			http.get(testURL, () => {
				attemptCount++;
				if (attemptCount === 1) {
					return HttpResponse.error();
				}
				return HttpResponse.json(mockData);
			}),
		);

		const getDefaultOptions = () => ({
			retry: {
				attempts: 2,
				delay: 10,
				when: ({ error }: any) => !!error,
			},
		});

		const api = apolloStateMachine(fetch, getDefaultOptions);
		const result = await api(testURL, {
			onRetry: ({ error, response, request, attempt }: any) => {
				retryCallbackCalled = true;
			},
		});

		expect(result).toEqual(mockData);
		expect(attemptCount).toBe(2);
		expect(retryCallbackCalled).toBe(true);
	});

	it("should handle request failure after max retries", async () => {
		let attemptCount = 0;

		server.use(
			http.get(testURL, () => {
				attemptCount++;
				return HttpResponse.error();
			}),
		);

		const getDefaultOptions = () => ({
			retry: {
				attempts: 2,
				delay: 10,
				when: ({ error }: any) => !!error,
			},
		});

		const api = apolloStateMachine(fetch, getDefaultOptions);

		await expect(api(testURL, {})).rejects.toThrow();

		expect(attemptCount).toBe(3); // 1 initial + 2 retries
	});

	it("should handle response rejection", async () => {
		server.use(
			http.get(testURL, () => {
				return new HttpResponse(null, { status: 404 });
			}),
		);

		const api = apolloStateMachine(fetch);

		// 默认情况下，非2xx响应会被拒绝
		await expect(api(testURL, {})).rejects.toThrow();
	});

	it("should handle schema validation", async () => {
		const mockData = { id: 1, title: "Test Post" };

		server.use(
			http.get(testURL, () => {
				return HttpResponse.json(mockData);
			}),
		);

		const mockSchema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				validate: (data: any) =>
					Promise.resolve({
						value: { ...data, validated: true },
						issues: undefined,
					}),
			},
		};

		const api = apolloStateMachine(fetch);
		const result = await api(testURL, {
			schema: mockSchema,
		});

		expect(result).toEqual({ ...mockData, validated: true });
	});

	it("should handle validation errors", async () => {
		const mockData = { id: 1, title: "Test Post" };

		server.use(
			http.get(testURL, () => {
				return HttpResponse.json(mockData);
			}),
		);

		const mockSchema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				validate: (_data: any) =>
					Promise.resolve({
						value: undefined,
						issues: [{ kind: "validation", message: "Invalid data" }],
					}),
			},
		};

		const api = apolloStateMachine(fetch);

		await expect(
			api(testURL, {
				schema: mockSchema,
			}),
		).rejects.toThrow();
	});

	it("should trigger event callbacks", async () => {
		const mockData = { id: 1, title: "Test Post" };
		const events: {
			onRequest: Request[];
			onSuccess: { data: any; request: Request }[];
			onError: { error: any; request: Request }[];
		} = {
			onRequest: [],
			onSuccess: [],
			onError: [],
		};

		server.use(
			http.get(testURL, () => {
				return HttpResponse.json(mockData);
			}),
		);

		const api = apolloStateMachine(fetch);
		const result = await api(testURL, {
			onRequest: (request) => events.onRequest.push(request),
			onSuccess: (data, request) => events.onSuccess.push({ data, request }),
			onError: (error, request) => events.onError.push({ error, request }),
		});

		expect(result).toEqual(mockData);
		expect(events.onRequest).toHaveLength(1);
		expect(events.onSuccess).toHaveLength(1);
		expect(events.onError).toHaveLength(0);
	});

	it("should handle custom parseResponse", async () => {
		const mockData = { id: 1, title: "Test Post" };

		server.use(
			http.get(testURL, () => {
				return HttpResponse.json(mockData);
			}),
		);

		const api = apolloStateMachine(fetch);
		const result = await api(testURL, {
			parseResponse: async (response) => {
				const data = await response.json();
				return { ...data, customParsed: true };
			},
		});

		expect(result).toEqual({ ...mockData, customParsed: true });
	});

	it("should handle parse errors", async () => {
		server.use(
			http.get(testURL, () => {
				return new HttpResponse("{invalid json", {
					headers: { "Content-Type": "application/json" },
				});
			}),
		);

		const api = apolloStateMachine(fetch);

		await expect(api(testURL, {})).rejects.toThrow();
	});
});
