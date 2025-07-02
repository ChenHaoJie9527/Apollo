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
});
