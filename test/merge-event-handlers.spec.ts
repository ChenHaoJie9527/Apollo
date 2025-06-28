import { describe, expect, test, vi } from "vitest";
import { mergeEventHandlers } from "../src/apollo";

describe("mergeEventHandlers", () => {
  describe("Merge event handlers that both objects have", () => {
    test("Should execute two onSuccess handlers in order", () => {
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

    test("Should pass parameters to both handlers", () => {
      const defaultSpy = vi.fn();
      const fetchSpy = vi.fn();

      const defaultOptions = {
        onError: defaultSpy,
      };

      const fetchOpts = {
        onError: fetchSpy,
      };

      const result = mergeEventHandlers(defaultOptions, fetchOpts);

      const errorObj = new Error("test error");
      result.onError(errorObj, "additional", 123);

      expect(defaultSpy).toHaveBeenCalledWith(errorObj, "additional", 123);
      expect(fetchSpy).toHaveBeenCalledWith(errorObj, "additional", 123);
    });
  });

  // describe("只有一个对象有事件处理器", () => {
  //   test("只有 defaultOptions 有事件处理器时应该保持不变", () => {
  //     const handler = vi.fn();

  //     const defaultOptions = {
  //       onSuccess: handler,
  //       onClick: handler
  //     };

  //     const fetchOpts = {
  //       normalProp: "value"
  //     };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     expect(result.onSuccess).toBe(handler);
  //     expect(result.onClick).toBe(handler);
  //   });

  //   test("只有 fetchOpts 有事件处理器时应该复制到 defaultOptions", () => {
  //     const handler = vi.fn();

  //     const defaultOptions = {
  //       normalProp: "value"
  //     };

  //     const fetchOpts = {
  //       onSuccess: handler,
  //       onRetry: handler
  //     };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     expect(result.onSuccess).toBe(handler);
  //     expect(result.onRetry).toBe(handler);
  //   });

  //   test("defaultOptions 有非函数值时，应该被 fetchOpts 的函数覆盖", () => {
  //     const handler = vi.fn();

  //     const defaultOptions = {
  //       onSuccess: "not a function",
  //       onError: undefined
  //     };

  //     const fetchOpts = {
  //       onSuccess: handler,
  //       onError: handler
  //     };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     expect(result.onSuccess).toBe(handler);
  //     expect(result.onError).toBe(handler);
  //   });
  // });

  // describe("事件名称识别", () => {
  //   test.each`
  //     eventName       | shouldMatch
  //     ${"onSuccess"}  | ${true}
  //     ${"onClick"}    | ${true}
  //     ${"onError"}    | ${true}
  //     ${"onRetry"}    | ${true}
  //     ${"onAbort"}    | ${true}
  //     ${"success"}    | ${false}
  //     ${"onclick"}    | ${false}
  //     ${"ON_SUCCESS"} | ${false}
  //     ${"on_success"} | ${false}
  //     ${"on"}         | ${false}
  //     ${"onlowercase"} | ${false}
  //   `("$eventName 应该${shouldMatch ? '' : '不'}被识别为事件处理器", ({ eventName, shouldMatch }) => {
  //     const handler = vi.fn();

  //     const defaultOptions = {};
  //     const fetchOpts = { [eventName]: handler };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     if (shouldMatch) {
  //       expect(result[eventName]).toBe(handler);
  //     } else {
  //       expect(result[eventName]).toBeUndefined();
  //     }
  //   });
  // });

  // describe("复杂场景", () => {
  //   test("多个事件处理器的混合场景", () => {
  //     const callLog: string[] = [];

  //     const defaultOptions = {
  //       onSuccess: () => callLog.push("default-success"),
  //       onError: () => callLog.push("default-error"),
  //       onComplete: "not a function",
  //       normalProp: "keep me"
  //     };

  //     const fetchOpts = {
  //       onSuccess: () => callLog.push("fetch-success"),
  //       onComplete: () => callLog.push("fetch-complete"),
  //       onRetry: () => callLog.push("fetch-retry"),
  //       anotherProp: "ignore me"
  //     };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     // 测试合并的事件处理器
  //     result.onSuccess();
  //     expect(callLog).toEqual(["default-success", "fetch-success"]);

  //     // 测试只在 defaultOptions 中的事件处理器
  //     callLog.length = 0;
  //     result.onError();
  //     expect(callLog).toEqual(["default-error"]);

  //     // 测试被覆盖的事件处理器
  //     callLog.length = 0;
  //     result.onComplete();
  //     expect(callLog).toEqual(["fetch-complete"]);

  //     // 测试只在 fetchOpts 中的事件处理器
  //     callLog.length = 0;
  //     result.onRetry();
  //     expect(callLog).toEqual(["fetch-retry"]);

  //     // 测试非事件属性保持不变
  //     expect(result.normalProp).toBe("keep me");
  //     expect(result.anotherProp).toBeUndefined();
  //   });

  //   test("空对象处理", () => {
  //     const result1 = mergeEventHandlers({}, {});
  //     expect(result1).toEqual({});

  //     const handler = vi.fn();
  //     const result2 = mergeEventHandlers({}, { onSuccess: handler });
  //     expect(result2.onSuccess).toBe(handler);

  //     const result3 = mergeEventHandlers({ onSuccess: handler }, {});
  //     expect(result3.onSuccess).toBe(handler);
  //   });

  //   test("函数返回值应该是修改后的 defaultOptions", () => {
  //     const defaultOptions = { onSuccess: vi.fn() };
  //     const fetchOpts = { onError: vi.fn() };

  //     const result = mergeEventHandlers(defaultOptions, fetchOpts);

  //     expect(result).toBe(defaultOptions); // 应该返回同一个对象引用
  //     expect(result.onError).toBe(fetchOpts.onError);
  //   });

  //   test("异步事件处理器", async () => {
  //     const results: string[] = [];

  //     const defaultOptions = {
  //       onSuccess: async () => {
  //         await new Promise(resolve => setTimeout(resolve, 10));
  //         results.push("default");
  //       }
  //     };

  //     const fetchOpts = {
  //       onSuccess: async () => {
  //         await new Promise(resolve => setTimeout(resolve, 5));
  //         results.push("fetch");
  //       }
  //     };

  //     const merged = mergeEventHandlers(defaultOptions, fetchOpts);

  //     // 注意：合并后的函数不会等待异步完成
  //     merged.onSuccess();

  //     // 等待一些时间让异步操作完成
  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     expect(results).toEqual(["default", "fetch"]);
  //   });
  // });
});
