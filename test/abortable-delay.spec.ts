import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { abortableDelay } from "../src/utils/abortable-delay";

describe("abortableDelay", () => {
  beforeEach(() => {
    // Testing with real timers
    vi.useRealTimers();
  });

  afterEach(() => {
    // Clear any timers that may be present
    vi.clearAllTimers();
  });

  describe("Normal delayed completion", () => {
    it("should resolve after specified delay", async () => {
      const startTime = Date.now();
      await abortableDelay(100);
      const endTime = Date.now();

      // Allow for some timing errors
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allowable -10ms error
      expect(endTime - startTime).toBeLessThan(150); // Allowable +50ms error
    });

    it("should resolve immediately with zero delay", async () => {
      const startTime = performance.now();
      await abortableDelay(0);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
    });

    it("should work without signal parameter", async () => {
      const promise = abortableDelay(50);
      await expect(promise).resolves.toBeUndefined();
    });
  });
});

describe("interrupt function", () => {
  it("should reject if interrupted before delay completes", async () => {
    const controller = new AbortController();
    const promise = abortableDelay(1000, controller.signal);

    // Interrupt before delay completes
    setTimeout(() => controller.abort("Test aborted"), 500);

    await expect(promise).rejects.toBe("Test aborted");
  });

  it("should reject with default reason if no reason provided", async () => {
    const controller = new AbortController();
    const promise = abortableDelay(1000, controller.signal);

    setTimeout(() => controller.abort(), 500);

    await expect(promise).rejects.toBeInstanceOf(DOMException);
  });

  it("should reject with custom error object", async () => {
    const controller = new AbortController();
    const customError = new Error("Custom abort error");
    const promise = abortableDelay(1000, controller.signal);

    setTimeout(() => controller.abort(customError), 500);

    await expect(promise).rejects.toThrow(customError);
  });

  it("should reject immediately if signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort("Already aborted");

    const startTime = Date.now();
    const promise = abortableDelay(1000, controller.signal);

    await expect(promise).rejects.toBe("Already aborted");

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(10);
  });
});

describe("Resource cleanup", () => {
  it("should clean up event listeners when delay completes normally", async () => {
    const controller = new AbortController();
    const addEventListeners = vi.spyOn(controller.signal, "addEventListener");
    const removeEventListeners = vi.spyOn(
      controller.signal,
      "removeEventListener"
    );

    await abortableDelay(50, controller.signal);

    expect(addEventListeners).toHaveBeenCalledWith(
      "abort",
      expect.any(Function),
      { once: true }
    );
    expect(removeEventListeners).toHaveBeenCalledWith(
      "abort",
      expect.any(Function)
    );
  });

  it("should clean up timeout when aborted", async () => {
    const controller = new AbortController();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const promise = abortableDelay(1000, controller.signal);

    // early termination
    setTimeout(() => {
      controller.abort();
    }, 300);
    await expect(promise).rejects.toBeDefined();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe("boundary condition", () => {
  it("should handle negative delay by treating it as zero", async () => {
    const statTime = Date.now();
    await abortableDelay(-10);
    const endTime = Date.now();
    expect(endTime - statTime).toBeLessThan(10);
  });

  it("should handle very large delays", async () => {
    const controller = new AbortController();
    const promise = abortableDelay(Number.MAX_SAFE_INTEGER, controller.signal);

    // Immediate interruptions
    controller.abort("Test large delay");

    await expect(promise).rejects.toBe("Test large delay");
  });
});

describe("Concurrency and multiple calls", () => {
  it("should handle multiple concurrent delays", async () => {
    const promise = [
      abortableDelay(100),
      abortableDelay(150),
      abortableDelay(200),
    ];

    const startTime = Date.now();
    await Promise.all(promise);
    const endTime = Date.now();

    // All latency should be 200ms+ but no more than 250ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(190);
    expect(endTime - startTime).toBeLessThan(250);
  });

  it("should handle multiple delays with same abort signal", async () => {
    const controller = new AbortController();
    const promises = [
      abortableDelay(1000, controller.signal),
      abortableDelay(1500, controller.signal),
      abortableDelay(2000, controller.signal),
    ];

    setTimeout(() => controller.abort("Abort all"), 100);

    const result = await Promise.allSettled(promises);
    result.forEach((res) => {
      expect(res.status).toBe("rejected");
      expect((res as PromiseRejectedResult).reason).toBe("Abort all");
    });
  });
});

describe("performance testing", () => {
  it("should not leak memory with many operations", async () => {
    // Forced garbage collection (requires the --expose-gc flag)
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    // perform a large number of operations
    for (let round = 0; round < 10; round++) {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(abortableDelay(1));
      }
      await Promise.all(promises);
    }

    // forced garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;

    // memory growth should be within a reasonable range (e.g., less than 1MB)
    expect(memoryGrowth).toBeLessThan(1024 * 1024);
  });
  it("should handle rapid abort and delay cycles", async () => {
    for (let i = 0; i < 100; i++) {
      const controller = new AbortController();
      const promises = abortableDelay(100, controller.signal);

      controller.abort(`Cycle ${i}`);

      await expect(promises).rejects.toBe(`Cycle ${i}`);
    }
  });
});

describe("type safety", () => {
  it("should resolve with void type", async () => {
    const result = await abortableDelay(1);
    expect(result).toBeUndefined();
  });

  it("should reject with the correct reason type", async () => {
    const controller = new AbortController();
    const stringReason = "string reason";
    const errorReason = new Error("error reason");

    const promise1 = abortableDelay(100, controller.signal);
    controller.abort(stringReason);
    await expect(promise1).rejects.toBe(stringReason);

    const controller2 = new AbortController();
    const promise2 = abortableDelay(100, controller2.signal);
    controller2.abort(errorReason);
    await expect(promise2).rejects.toBe(errorReason);
  });
});
