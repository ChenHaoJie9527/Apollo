import { toStreamable } from "../src/utils/to-streamable";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { StreamingEvent } from "../src/types/StreamingEvent";

// 设置 MSW 服务器
const server = setupServer();

// 基础 URL
const BASE_URL = 'https://api.test.com';

describe("toStreamable", () => {
  beforeAll(() => {
    // 启动模拟服务器
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    // 关闭服务器
    server.close();
  });

  beforeEach(() => {
    // 每个测试前重置处理器
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
        body: "test data"
      });

      const result = await toStreamable(req);
      expect(result).toBe(req);
    });
  });

  describe("Real HTTP Response handling", () => {
    it("should track progress for response with Content-Length", async () => {
      const testData = "Hello, World! This is a test response.";
      
      // 模拟带 Content-Length 的响应
      server.use(
        http.get(`${BASE_URL}/with-content-length`, () => {
          return new HttpResponse(testData, {
            headers: {
              'Content-Length': testData.length.toString(),
              'Content-Type': 'text/plain'
            }
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      // 发起真实请求
      const response = await fetch(`${BASE_URL}/with-content-length`);
      const streamableResponse = await toStreamable(response, callback);

      // 读取响应内容
      const text = await streamableResponse.text();
      
      expect(text).toBe(testData);
      expect(callback).toHaveBeenCalled();
      
      // 验证初始进度事件
      expect(progressEvents[0]).toEqual({
        totalBytes: testData.length,
        transferredBytes: 0,
        chunk: new Uint8Array()
      });

      // 验证最终进度
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
                  controller.enqueue(new TextEncoder().encode(chunk));
                  if (index === chunks.length - 1) {
                    controller.close();
                  }
                }, index * 10);
              });
            }
          });

          return new HttpResponse(stream, {
            headers: {
              'Transfer-Encoding': 'chunked',
              'Content-Type': 'text/plain'
            }
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
      expect(text).toBe(chunks.join(''));

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
      
      // 模拟大文件下载
      server.use(
        http.get(`${BASE_URL}/large-file`, () => {
          const stream = new ReadableStream({
            start(controller) {
              let chunkCount = 0;
              
              const sendChunk = () => {
                if (chunkCount < TOTAL_CHUNKS) {
                  const chunk = new Uint8Array(CHUNK_SIZE).fill(chunkCount);
                  controller.enqueue(chunk);
                  chunkCount++;
                  
                  // 模拟网络延迟
                  setTimeout(sendChunk, 5);
                } else {
                  controller.close();
                }
              };
              
              sendChunk();
            }
          });

          return new HttpResponse(stream, {
            headers: {
              'Content-Length': expectedSize.toString(),
              'Content-Type': 'application/octet-stream'
            }
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent, response) => {
        progressEvents.push(event);
        
        // 验证每次回调都包含正确的响应对象
        expect(response).toBeInstanceOf(Response);
      });

      const response = await fetch(`${BASE_URL}/large-file`);
      const streamableResponse = await toStreamable(response, callback);

      // 读取所有数据
      const arrayBuffer = await streamableResponse.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(expectedSize);

      // 验证进度追踪
      expect(progressEvents.length).toBeGreaterThan(TOTAL_CHUNKS); // 至少有初始事件+每个chunk
      
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(expectedSize);
      expect(finalEvent.totalBytes).toBe(expectedSize);
    });
  });

  describe("Real HTTP Request handling", () => {
    it("should track upload progress for POST request", async () => {
      const uploadData = JSON.stringify({ 
        message: "Hello Server!", 
        data: new Array(100).fill("x").join("") 
      });
      
      let receivedData = "";
      
      // 模拟上传接口
      server.use(
        http.post(`${BASE_URL}/upload`, async ({ request }) => {
          receivedData = await request.text();
          
          return HttpResponse.json({ 
            success: true, 
            received: receivedData.length 
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent, request) => {
        progressEvents.push(event);
        expect(request).toBeInstanceOf(Request);
      });

      // 创建请求
      const request = new Request(`${BASE_URL}/upload`, {
        method: 'POST',
        body: uploadData,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': uploadData.length.toString()
        }
      });

      const streamableRequest = await toStreamable(request, callback);
      
      // 发送请求
      const response = await fetch(streamableRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.received).toBe(uploadData.length);
      expect(receivedData).toBe(uploadData);

      // 验证上传进度追踪
      expect(progressEvents[0]).toEqual({
        totalBytes: uploadData.length,
        transferredBytes: 0,
        chunk: new Uint8Array()
      });

      // 验证最终上传完成
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(uploadData.length);
    });

    it("should pre-calculate request size when no Content-Length", async () => {
      // 创建一个简单的文本数据进行测试，而不是 FormData
      const testData = "This is test data for size calculation";
      
      // 模拟文件上传接口
      server.use(
        http.post(`${BASE_URL}/upload-form`, async ({ request }) => {
          const text = await request.text();
          
          return HttpResponse.json({ 
            success: true, 
            received: text.length,
            data: text
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      // 创建一个没有 Content-Length 的 Request
      const request = new Request(`${BASE_URL}/upload-form`, {
        method: 'POST',
        body: testData
        // 故意不设置 Content-Length 来测试预计算功能
      });

      const streamableRequest = await toStreamable(request, callback);
      
      // 发送请求
      const response = await fetch(streamableRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.received).toBe(testData.length);
      expect(callback).toHaveBeenCalled();
      
      // 验证预计算的总大小（应该是文本的字节长度）
      expect(progressEvents[0].totalBytes).toBe(testData.length);
      
      // 验证最终传输完成
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(testData.length);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      // 模拟网络错误
      server.use(
        http.get(`${BASE_URL}/error`, () => {
          return HttpResponse.error();
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
      });

      // 这应该抛出网络错误
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
        if (callCount > 1) { // 第一次调用后开始抛错
          throw new Error("Callback error");
        }
      });

      const response = await fetch(`${BASE_URL}/callback-error`);
      const streamableResponse = await toStreamable(response, errorCallback);

      // 即使回调出错，流应该仍然可读
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
          email: `user${i}@example.com`
        }))
      };
      
      const jsonString = JSON.stringify(jsonData);
      
      server.use(
        http.get(`${BASE_URL}/api/users`, () => {
          return HttpResponse.json(jsonData, {
            headers: {
              'Content-Length': jsonString.length.toString()
            }
          });
        })
      );

      const progressEvents: StreamingEvent[] = [];
      const callback = vi.fn((event: StreamingEvent) => {
        progressEvents.push(event);
        
        // 计算下载进度百分比
        const progress = event.totalBytes > 0 
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
      
      // 验证完整的进度追踪
      const finalEvent = progressEvents[progressEvents.length - 1];
      expect(finalEvent.transferredBytes).toBe(jsonString.length);
    });

    it("should handle concurrent requests", async () => {
      const responses = ['Response 1', 'Response 2', 'Response 3'];
      
      responses.forEach((responseText, index) => {
        server.use(
          http.get(`${BASE_URL}/concurrent/${index}`, () => {
            return new HttpResponse(responseText, {
              headers: {
                'Content-Length': responseText.length.toString()
              }
            });
          })
        );
      });

      const progressTrackers = responses.map(() => ({
        events: [] as StreamingEvent[],
        callback: vi.fn((event: StreamingEvent) => {})
      }));

      // 给每个tracker设置回调
      progressTrackers.forEach(tracker => {
        tracker.callback = vi.fn((event: StreamingEvent) => {
          tracker.events.push(event);
        });
      });

      // 并发请求
      const streamableResponses = await Promise.all(
        responses.map(async (_, index) => {
          const response = await fetch(`${BASE_URL}/concurrent/${index}`);
          return toStreamable(response, progressTrackers[index].callback);
        })
      );

      // 并发读取
      const results = await Promise.all(
        streamableResponses.map(response => response.text())
      );

      // 验证所有响应
      results.forEach((result, index) => {
        expect(result).toBe(responses[index]);
        expect(progressTrackers[index].callback).toHaveBeenCalled();
        expect(progressTrackers[index].events.length).toBeGreaterThan(0);
      });
    });
  });
});
