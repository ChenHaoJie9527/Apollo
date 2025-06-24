import type { FallbackOptions } from "../types";
import { ResponseError } from "./response-error";
import { isJsonifiable } from "./isJsonifiable";

/**
 * 默认的 fallback 选项
 * 1. parseResponse: 解析响应的函数
 * 2. parseRejected: 解析拒绝响应的函数
 * 3. serializeParams: 序列化参数的函数
 * 4. serializeBody: 序列化请求体的函数
 * 5. reject: 拒绝请求的函数
 * 6. retry: 重试选项
 */
export const fallbackOptions: FallbackOptions = {
    /**
     * 解析响应的函数
     * 1. 克隆响应
     * 2. 尝试解析为JSON
     * 3. 如果失败，则尝试解析为文本
     * 4. 返回解析后的数据
     */
  parseResponse: (response) => {
    return response
      .clone()
      .json()
      .catch(() => response.text())
      .then((data) => data || null);
  },
  /**
   * 解析拒绝响应的函数
   * 1. 创建一个 ResponseError 实例
   * 2. 返回 ResponseError 实例
   */
  parseRejected: async (response, request) => {
    return new ResponseError(
      response,
      await parseResponseData(response, request),
      request
    );
  },
  /**
   * 序列化参数的函数
   * 1. 将参数转换为URLSearchParams
   * 2. 返回URLSearchParams的字符串表示
   */
  serializeParams: (params) => {
    const stringified = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => {
        return [key, typeof value === "string" ? value : JSON.stringify(value)];
      })
    );
    const result = new URLSearchParams(stringified).toString();
    return result;
  },
  /**
   * 序列化请求体的函数
   * 1. 如果请求体是可序列化的，则返回JSON字符串
   * 2. 否则返回原始请求体
   */
  serializeBody: (body: any) => {
    return isJsonifiable(body) ? JSON.stringify(body) : body;
  },
  /**
   * 拒绝请求的函数
   * 1. 如果响应状态码不是200-299，则返回true
   * 2. 否则返回false
   */
  reject: (response) => {
    return !response.ok;
  },
  retry: {
    when: (ctx) => ctx.response?.ok === false,
    attempts: 0,
    delay: 0,
  },
};

/**
 * 解析响应数据的函数
 * 1. 调用 parseResponse 函数
 * 2. 返回解析后的数据
 */
async function parseResponseData(response: Response, request: Request) {
  return fallbackOptions.parseResponse(response, request);
}
