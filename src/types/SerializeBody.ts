/**
 * SerializeBody 是工具类型，用于序列化请求体
 * T：请求体类型
 */
export type SerializeBody<T> = (body: T) => BodyInit | null | undefined;