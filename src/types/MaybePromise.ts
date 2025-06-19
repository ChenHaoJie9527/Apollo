/**
 * MaybePromise 是工具类型，用于处理可能的Promise
 * T：响应数据类型
 */
export type MaybePromise<T> = T | Promise<T>;
