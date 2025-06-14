/**
 * 定义基本Fetch函数类型
 * @param input 请求地址
 * @param options 请求选项
 * @param ctx 请求上下文
 * @returns 响应Promise
 */
export type MinFetchFn = (
  input: string,
  options?: any,
  ctx?: any
) => Promise<Response>;
