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
});
