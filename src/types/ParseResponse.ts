import type { MaybePromise } from "./MaybePromise";

/**
 * ParseResponse 是工具类型，用于解析响应数据
 * MaybePromise：工具类型，用于处理可能的Promise
 * T：响应数据类型
 */
export type ParseResponse<T> = (
  response: Response,
  request: Request
) => MaybePromise<T>;
