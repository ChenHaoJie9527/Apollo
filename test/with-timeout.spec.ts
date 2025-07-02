import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "../src/utils/with-timeout";

describe("withTimeout", () => {
  // Save the original AbortSignal method
  let originalAny: typeof AbortSignal.any | undefined;
  let originalTimeout: typeof AbortSignal.timeout | undefined;

  // Each test is preceded by a call to
  beforeEach(() => {
    originalAny = AbortSignal.any;
    originalTimeout = AbortSignal.timeout;
  });

  // Each test is followed by a call to
  afterEach(() => {
    // Restore the original methods
    if (originalAny) {
      (AbortSignal as any).any = originalAny;
    } else {
      delete (AbortSignal as any).any;
    }

    if (originalTimeout) {
      (AbortSignal as any).timeout = originalTimeout;
    } else {
      delete (AbortSignal as any).timeout;
    }
  });

  describe("Browser compatibility detection", () => {
    it("should handle environments without AbortSignal.any support", () => {
      // Simulate an environment without AbortSignal.any support
      delete (AbortSignal as any).any;

      // Create an instance of AbortController
      const controller = new AbortController();
      const result = withTimeout(controller.signal, 1000);
      // In unsupported environments, the original signal should be returned
      expect(result).toBe(controller.signal);
    });

    it("should handle environments without AbortSignal.timeout support", () => {
      // Simulate an environment without AbortSignal.timeout support
      delete (AbortSignal as any).timeout;

      const controller = new AbortController();
      const result = withTimeout(controller.signal, 1000);
      // In unsupported environments, the original signal should be returned
      expect(result).toBe(controller.signal);
    });

    it("should handle environments without both methods", () => {
      // Simulate an environment without both methods
      delete (AbortSignal as any).any;
      delete (AbortSignal as any).timeout;

      const controller = new AbortController();
      const result = withTimeout(controller.signal, 1000);
      // In unsupported environments, the original signal should be returned
      expect(result).toBe(controller.signal);
    });
  });

  describe("Signal composition in supported environments", () => {
    beforeEach(() => {
      // 保证模拟的方法是存在的
      if (!AbortSignal.any) {
        (AbortSignal as any).any = vi
          .fn()
          .mockImplementation((signals: AbortSignal[]) => {
            // 模拟：返回第一个信号
            return signals[0];
          });
      }

      if (!AbortSignal.timeout) {
        (AbortSignal as any).timeout = vi
          .fn()
          .mockImplementation((ms: number) => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), ms);
            return controller.signal;
          });
      }
    });
    it("should combine user signal and timeout signal", () => {
      const controller = new AbortController();
      const anySpy = vi.spyOn(AbortSignal, "any");
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

      const result = withTimeout(controller.signal, 1000);

      expect(timeoutSpy).toHaveBeenCalledWith(1000);
      expect(anySpy).toHaveBeenCalledWith([
        controller.signal,
        expect.any(AbortSignal),
      ]);
      expect(result).toBeDefined();
    });

    it("should handle only user signal (no timeout)", () => {
      const controller = new AbortController();
      const anySpy = vi.spyOn(AbortSignal, "any");
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

      withTimeout(controller.signal);

      // Determine that the method has not been called
      expect(timeoutSpy).not.toHaveBeenCalled();
      // Determines that the method was called and the passed parameter is controller.signal
      expect(anySpy).toHaveBeenCalledWith([controller.signal]);
    });

    it("should return undefined when no signals provided", () => {
      const result = withTimeout();
      expect(result).toBeUndefined();
    });

    it("should return undefined when timeout is 0", () => {
      const result = withTimeout(undefined, 0);
      expect(result).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle zero timeout", () => {
      const controller = new AbortController();
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
      withTimeout(controller.signal, 0);

      // Zero timeout should be ignored
      expect(timeoutSpy).not.toHaveBeenCalled();
    });

    it("should handle negative timeout", () => {
      const controller = new AbortController();
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
      withTimeout(controller.signal, -1000);

      // Negative timeout should be ignored
      expect(timeoutSpy).not.toHaveBeenCalled();
    });

    it("should handle already aborted signal", () => {
      const controller = new AbortController();
      // Simulating a signal that has been terminated
      controller.abort();
      const anySpy = vi.spyOn(AbortSignal, "any");
      withTimeout(controller.signal, 1000);

      // Even if the signal has been terminated, it should still be combined normally
      expect(anySpy).toHaveBeenCalled();
    });
  });

  describe("Type safety", () => {
    it("should return AbortSignal or undefined", () => {
      const result1 = withTimeout();
      const result2 = withTimeout(new AbortController().signal);
      const result3 = withTimeout(undefined, 1000);

      // TypeScript type check - these should compile
      expect(
        typeof result1 === "undefined" || result1 instanceof AbortSignal
      ).toBe(true);
      expect(
        typeof result2 === "undefined" || result2 instanceof AbortSignal
      ).toBe(true);
      expect(
        typeof result3 === "undefined" || result3 instanceof AbortSignal
      ).toBe(true);
    });
  });

  describe("Real timeout behavior (integration test)", () => {
    it("should actually abort after timeout", async () => {
      // Skip in unsupported environments
      if (!AbortSignal.timeout || !AbortSignal.any) {
        return;
      }

      const signal = withTimeout(undefined, 100); // 100ms timeout
      console.log("signal1=>", signal);
      expect(signal?.aborted).toBe(false);

      // Wait for timeout to trigger
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(signal?.aborted).toBe(true);
    }, 5000);
  });
});
