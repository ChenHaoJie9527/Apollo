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
