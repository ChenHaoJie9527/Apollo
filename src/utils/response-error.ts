/**
 * 响应错误类
 * 1. 继承自 Error 类
 * 2. 包含请求、响应、状态码、数据等属性
 * 3. 包含一个静态方法 isResponseError 用于检查错误是否是 ResponseError 类型
 */
export class ResponseError<T = any> extends Error {
  readonly request: Request;
  readonly status: number;
  readonly data: T;
  readonly response: Response;
  override name: "ResponseError";

  constructor(response: Response, data: T, request: Request) {
    // 调用父类构造函数，设置错误消息
    // 由于Error 接受一个可选的message参数
    // 格式化错误消息，包含状态码和状态文本
    super(`[${response.status}] ${response.statusText}`);
    this.data = data;
    this.name = "ResponseError";
    this.response = response;
    this.request = request;
    this.status = response.status;
  }
}

/**
 * 检查错误是否是 ResponseError 类型
 * @param error 错误对象
 * @returns 是否是 ResponseError 类型
 */
export const isResponseError = <T = any>(
  error: unknown
): error is ResponseError<T> => {
  return error instanceof ResponseError;
};
