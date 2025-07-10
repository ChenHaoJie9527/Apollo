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
    })

    it("should work without signal parameter", async () => {
        const promise = abortableDelay(50);
        await expect(promise).resolves.toBeUndefined()
    })
  });
});
