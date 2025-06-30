import { describe, expect, it, vi } from "vitest";
import { mergeEventHandlers } from "../src/utils";

describe("mergeEventHandlers", () => {
  describe("Merge event handlers that both objects have", () => {
    it("Should execute two onSuccess handlers in order", () => {
      const callOrder: string[] = [];

      const defaultOptions = {
        onSuccess: () => callOrder.push("default"),
        normalProp: "value1",
      };

      const fetchOpts = {
        onSuccess: () => callOrder.push("fetch"),
        normalProp: "value2",
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);
      // Call the merged event handler
      result.onSuccess();

      expect(callOrder).toEqual(["default", "fetch"]);
      expect(result.normalProp).toBe("value1"); // Non-event properties are not affected
    });

    it("Should pass parameters to both handlers", () => {
      const defaultSpy = vi.fn();
      const fetchSpy = vi.fn();

      const defaultOptions = {
        onError: defaultSpy,
      };

      const fetchOpts = {
        onError: fetchSpy,
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      const errorObj = new Error("it error");
      result.onError(errorObj, "additional", 123);

      expect(defaultSpy).toHaveBeenCalledWith(errorObj, "additional", 123);
      expect(fetchSpy).toHaveBeenCalledWith(errorObj, "additional", 123);
    });
  });

  describe("Only one object has an event handler", () => {
    it("When only defaultOptions has an event handler, it should remain unchanged", () => {
      const handler = vi.fn();

      const defaultOptions = {
        onSuccess: handler,
        onClick: handler
      };

      const fetchOpts = {
        normalProp: "value"
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      expect(result.onSuccess).toBe(handler);
      expect(result.onClick).toBe(handler);
    });

    it("Only fetchOpts with event handlers should be copied to defaultOptions.", () => {
      const handler = vi.fn();

      const defaultOptions = {
        normalProp: "value"
      };

      const fetchOpts = {
        onSuccess: handler,
        onRetry: handler
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      expect(result.onSuccess).toBe(handler);
      expect(result.onRetry).toBe(handler);
    });

    it("When defaultOptions has a non-function value, it should be overridden by the function in fetchOpts", () => {
      const handler = vi.fn();

      const defaultOptions = {
        onSuccess: "not a function",
        onError: undefined
      };

      const fetchOpts = {
        onSuccess: handler,
        onError: handler
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      expect(result.onSuccess).toBe(handler);
      expect(result.onError).toBe(handler);
    });
  });

  describe("Event name recognition", () => {
    it.each`
      eventName       | shouldMatch
      ${"onSuccess"}  | ${true}
      ${"onClick"}    | ${true}
      ${"onError"}    | ${true}
      ${"onRetry"}    | ${true}
      ${"onAbort"}    | ${true}
      ${"success"}    | ${false}
      ${"onclick"}    | ${false}
      ${"ON_SUCCESS"} | ${false}
      ${"on_success"} | ${false}
      ${"on"}         | ${false}
      ${"onlowercase"} | ${false}
    `("$eventName should ${shouldMatch ? '' : 'no'} be recognized as an event handler", ({ eventName, shouldMatch }) => {
      const handler = vi.fn();

      const defaultOptions = {};
      const fetchOpts = { [eventName]: handler };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      if (shouldMatch) {
        expect(result[eventName]).toBe(handler);
      } else {
        expect(result[eventName]).toBeUndefined();
      }
    });
  });

  describe("Complex scenarios", () => {
    it("Mixed event handler scenarios", () => {
      const callLog: string[] = [];

      const defaultOptions = {
        onSuccess: () => callLog.push("default-success"),
        onError: () => callLog.push("default-error"),
        onComplete: "not a function",
        normalProp: "keep me"
      };

      const fetchOpts = {
        onSuccess: () => callLog.push("fetch-success"),
        onComplete: () => callLog.push("fetch-complete"),
        onRetry: () => callLog.push("fetch-retry"),
        anotherProp: "ignore me"
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);
      // it merged event handlers
      result.onSuccess();
      expect(callLog).toEqual(["default-success", "fetch-success"]);

      // it event handlers only in defaultOptions
      callLog.length = 0;
      result.onError();
      expect(callLog).toEqual(["default-error"]);

      // it event handlers only in fetchOpts
      callLog.length = 0;
      result.onComplete();
      expect(callLog).toEqual(["fetch-complete"]);

      // it event handlers only in fetchOpts
      callLog.length = 0;
      result.onRetry();
      expect(callLog).toEqual(["fetch-retry"]);

      // it non-event properties remain unchanged
      expect(result.normalProp).toBe("keep me");
      expect(result.anotherProp).toBeUndefined();
    });

    it("Empty object handling", () => {
      const result1 = mergeEventHandlers({}, {});
      expect(result1).toEqual({});

      const handler = vi.fn();
      const result2 = mergeEventHandlers({}, { onSuccess: handler });
      expect(result2.onSuccess).toBe(handler);

      const result3 = mergeEventHandlers({ onSuccess: handler }, {});
      expect(result3.onSuccess).toBe(handler);
    });

    it("The return value should be the new modified object", () => {
      const defaultOptions = { onSuccess: vi.fn() };
      const fetchOpts = { onError: vi.fn() };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);
      expect(result).not.toBe(defaultOptions); // should not return the same object reference
      expect(result.onError).toBe(fetchOpts.onError);
    });

    // it("异步事件处理器", async () => {
    //   const results: string[] = [];

    //   const defaultOptions = {
    //     onSuccess: async () => {
    //       await new Promise(resolve => setTimeout(resolve, 10));
    //       results.push("default");
    //     }
    //   };

    //   const fetchOpts = {
    //     onSuccess: async () => {
    //       await new Promise(resolve => setTimeout(resolve, 5));
    //       results.push("fetch");
    //     }
    //   };

    //   const merged = mergeEventHandlers(defaultOptions, fetchOpts);

    //   // 注意：合并后的函数不会等待异步完成
    //   merged.onSuccess();

    //   // 等待一些时间让异步操作完成
    //   await new Promise(resolve => setTimeout(resolve, 50));

    //   expect(results).toEqual(["default", "fetch"]);
    // });
  });
});
