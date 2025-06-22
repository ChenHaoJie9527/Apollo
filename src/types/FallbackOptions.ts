import type { DefaultRawBody } from "./DefaultRawBody";
import type { MaybePromise } from "./MaybePromise";
import type { ParseRejected } from "./ParseRejected";
import type { ParseResponse } from "./ParseResponse";
import type { RetryOptions } from "./RetryOptions";
import type { SerializeBody } from "./SerializeBody";
import type { SerializeParams } from "./SerializeParams";

/**
 * 定义 fallback 选项
 * 1. parseRejected: 解析拒绝响应的函数
 * 2. parseResponse: 解析响应的函数
 * 3. reject: 拒绝请求的函数
 * 4. retry: 重试选项
 * 5. serializeParams: 序列化参数的函数
 * 6. serializeBody: 序列化请求体的函数
 */
export type FallbackOptions = {
  parseRejected: ParseRejected; // 解析拒绝响应的函数
  parseResponse: ParseResponse<any>;
  reject: (response: Response) => MaybePromise<boolean>;
  retry: Required<RetryOptions>;
  serializeParams: SerializeParams;
  serializeBody: SerializeBody<DefaultRawBody>;
};
