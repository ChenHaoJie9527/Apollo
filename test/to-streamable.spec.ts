import { toStreamable } from "../src/utils/to-streamable";
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { StreamingEvent } from "../src/types/StreamingEvent";

// Set up MSW server
const server = setupServer();

// Base URL
const BASE_URL = "https://api.test.com";

describe("toStreamable", () => {
  beforeAll(() => {
    // Starting the simulation server
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    // Shut down the server
    server.close();
  });

  beforeEach(() => {
    // Reset the processor before each test
    server.resetHandlers();
  });

  describe("Basic functionality", () => {
    it("should return original object when no body or onStream is provided", async () => {
      const req = new Request(`${BASE_URL}/test`);
      const callback = vi.fn();

      const result = await toStreamable(req, callback);
      expect(result).toBe(req);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should return original object when no callback provided", async () => {
      const req = new Request(`${BASE_URL}/test`, {
        method: "POST",
        body: "test data",
      });

      const result = await toStreamable(req);

      expect(result).toBe(req);
    });
  });

  describe("Real HTTP Request handling", () => {
    it("should track progress for response with Content-Length", async () => {
      const testData = "Hello, World! This is a test response.";

      // Simulate a response with Content-Length
      server.use(
        http.get(`${BASE_URL}/with-content-length`, () => {
          return new HttpResponse(testData, {
            headers: {
              "Content-Length": testData.length.toString(),
              "Content-Type": "text/plain",
            },
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      const response = await fetch(`${BASE_URL}/with-content-length`);
      const streamableResponse = await toStreamable(response, callback);

      const text = await streamableResponse.text();

      expect(text).toBe(testData);
      expect(callback).toHaveBeenCalled();

      // Verify the initial progress event
      expect(progressEvents[0]).toEqual({
        totalBytes: testData.length,
        transferredBytes: 0,
        chunk: new Uint8Array(),
      });

      // Verify the final progress event
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(testData.length);
      expect(finalEvent.totalBytes).toBe(testData.length);
    });

    it("should handle chunked response without Content-Length", async () => {
      const chunks = ["chunk1", "chunk2", "chunk3"];

      // 模拟分块传输响应
      server.use(
        http.get(`${BASE_URL}/chunked`, () => {
          const stream = new ReadableStream({
            start(controller) {
              chunks.forEach((chunk, index) => {
                setTimeout(() => {
                  // Enqueue the chunk
                  controller.enqueue(new TextEncoder().encode(chunk));
                  if (index === chunks.length - 1) {
                    // Close the stream when all chunks are sent
                    controller.close();
                  }
                }, index * 10);
              });
            },
          });
          return new HttpResponse(stream, {
            headers: {
              "Transfer-Encoding": "chunked",
              "Content-Type": "text/plain",
            },
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      const response = await fetch(`${BASE_URL}/chunked`);
      const streamableResponse = await toStreamable(response, callback);

      const text = await streamableResponse.text();
      expect(text).toBe(chunks.join(""));

      // 验证初始总字节数为0（无Content-Length）
      expect(progressEvents[0].totalBytes).toBe(0);
      // 验证进度递增
      for (let i = 1; i < progressEvents.length; i++) {
        expect(progressEvents[i].transferredBytes).toBeGreaterThanOrEqual(
          progressEvents[i - 1].transferredBytes
        );
      }
    });

    it("should handle large file download simulation", async () => {
      const CHUNK_SIZE = 1024;
      const TOTAL_CHUNKS = 5;
      const expectedSize = CHUNK_SIZE * TOTAL_CHUNKS;

      // Simulate large file downloads
      server.use(
        http.get(`${BASE_URL}/large-file`, () => {
          const stream = new ReadableStream({
            start(controller) {
              let chunkCount = 0;

              const sendChunk = () => {
                if (chunkCount < TOTAL_CHUNKS) {
                  const chunk = new Uint8Array(CHUNK_SIZE).fill(chunkCount);
                  // enqueue the chunk
                  controller.enqueue(chunk);
                  chunkCount++;

                  // Simulate network latency
                  setTimeout(sendChunk, 5);
                } else {
                  // close the stream when all chunks are sent
                  controller.close();
                }
              };

              sendChunk();
            },
          });

          return new HttpResponse(stream, {
            headers: {
              "Content-Length": expectedSize.toString(),
              "Content-Type": "application/octet-stream",
            },
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent, response) => {
        progressEvents.push(event);

        // Verify that each callback contains the correct response object
        expect(response).toBeInstanceOf(Response);
      });

      const response = await fetch(`${BASE_URL}/large-file`);
      const streamableResponse = await toStreamable(response, callback);

      // Read all data
      const arrayBuffer = await streamableResponse.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(expectedSize);

      // Verify progress tracking
      expect(progressEvents.length).toBeGreaterThan(TOTAL_CHUNKS); // At least one initial event + each chunk

      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(expectedSize);
      expect(finalEvent.totalBytes).toBe(expectedSize);
    });
  });

  describe("Real HTTP Request handling", () => {
    it("should track upload progress for POST request", async () => {
      const uploadData = JSON.stringify({
        message: "Hello Server!",
        data: new Array(100).fill("x").join(""),
      });

      let receivedData = "";

      // Simulate upload interface
      server.use(
        http.post(`${BASE_URL}/upload`, async ({ request }) => {
          receivedData = await request.text();
          return HttpResponse.json({
            success: true,
            received: receivedData.length,
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent, request) => {
        progressEvents.push(event);
        expect(request).toBeInstanceOf(Request);
      });

      // Create request
      const request = new Request(`${BASE_URL}/upload`, {
        method: "POST",
        body: uploadData,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": uploadData.length.toString(),
        },
      });

      const streamableRequest = await toStreamable(request, callback);
      // Send request
      const response = await fetch(streamableRequest);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.received).toBe(uploadData.length);
      expect(receivedData).toBe(uploadData);

      // Verify upload progress tracking
      expect(progressEvents[0]).toEqual({
        totalBytes: uploadData.length,
        transferredBytes: 0,
        chunk: new Uint8Array(),
      });

      // Verify final upload completion
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(uploadData.length);
    });

    it("should pre-calculate request size when no Content-Length", async () => {
      // Create a simple text data for testing, not FormData
      const testData = "This is test data for size calculation";

      // Simulate file upload interface
      server.use(
        http.post(`${BASE_URL}/upload-form`, async ({ request }) => {
          const text = await request.text();
          return HttpResponse.json({
            success: true,
            received: text.length,
            data: text,
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      // Create a Request without Content-Length
      const request = new Request(`${BASE_URL}/upload-form`, {
        method: "POST",
        body: testData,
        // Don't set Content-Length to test pre-calculation functionality
      });

      const streamableRequest = await toStreamable(request, callback);

      // Send request
      const response = await fetch(streamableRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.received).toBe(testData.length);
      expect(callback).toHaveBeenCalled();
      // Verify the total size calculated in advance (should be the byte length of the text)
      expect(progressEvents[0].totalBytes).toBe(testData.length);

      // Verify final transmission completion
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(testData.length);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      // Simulate network errors
      server.use(
        http.get(`${BASE_URL}/error`, () => {
          return HttpResponse.error();
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      // This should throw a network error
      await expect(fetch(`${BASE_URL}/error`)).rejects.toThrow();
    });

    it("should handle callback errors without breaking stream", async () => {
      const testData = "test response data";

      server.use(
        http.get(`${BASE_URL}/callback-error`, () => {
          return new HttpResponse(testData);
        })
      );

      let callCount = 0;
      const errorCallback = vi.fn((event: StreamingEvent) => {
        callCount++;
        if (callCount > 1) {
          // Throw an error after the first call
          throw new Error("Callback error");
        }
      });

      const response = await fetch(`${BASE_URL}/callback-error`);
      const streamableResponse = await toStreamable(response, errorCallback);
      // Even if the callback throws an error, the stream should still be readable
      const text = await streamableResponse.text();
      expect(text).toBe(testData);
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle JSON API response with progress", async () => {
      const jsonData = {
        users: new Array(50).fill(null).map((_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
        })),
      };

      const jsonString = JSON.stringify(jsonData);

      server.use(
        http.get(`${BASE_URL}/api/users`, () => {
          return HttpResponse.json(jsonData, {
            headers: {
              "Content-Length": jsonString.length.toString(),
            },
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);

        // Calculate download progress percentage
        const progress =
          event.totalBytes > 0
            ? (event.transferredBytes / event.totalBytes) * 100
            : 0;

        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });

      const response = await fetch(`${BASE_URL}/api/users`);
      const streamableResponse = await toStreamable(response, callback);

      const data = await streamableResponse.json();
      expect(data.users).toHaveLength(50);
      expect(callback).toHaveBeenCalled();

      // Verify complete progress tracking
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(jsonString.length);
    });

    it("should handle concurrent requests", async () => {
      const responses = ["Response 1", "Response 2", "Response 3"];

      responses.forEach((responseText, index) => {
        server.use(
          http.get(`${BASE_URL}/concurrent/${index}`, () => {
            return new HttpResponse(responseText, {
              headers: {
                "Content-Length": responseText.length.toString(),
              },
            });
          })
        );
      });

      const progressTrackers = responses.map(() => ({
        events: [] as StreamingEvent[],
        callback: vi.fn((event: StreamingEvent) => {}),
      }));

      // Set callback for each tracker
      progressTrackers.forEach((tracker) => {
        tracker.callback = vi.fn((event: StreamingEvent) => {
          tracker.events.push(event);
        });
      });

      // Concurrent requests
      const streamableResponses = await Promise.all(
        responses.map(async (_, index) => {
          const response = await fetch(`${BASE_URL}/concurrent/${index}`);
          return toStreamable(response, progressTrackers[index].callback);
        })
      );

      // Concurrent read
      const results = await Promise.all(
        streamableResponses.map((response) => response.text())
      );
      // Verify all responses
      results.forEach((result, index) => {
        expect(result).toBe(responses[index]);
        expect(progressTrackers[index].callback).toHaveBeenCalled();
        expect(progressTrackers[index].events.length).toBeGreaterThan(0);
      });
    });
  });
});
