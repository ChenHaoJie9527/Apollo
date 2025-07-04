import type { SerializeParams } from "src/types/SerializeParams";
import { omit } from "./omit";

type Params = Record<string, any>;

export const resolveUrl = (
  base: string | undefined = "",
  input: URL | string,
  defaultOptsParams: Params | undefined,
  fetcherOptsParams: Params | undefined,
  serializeParams: SerializeParams
): string => {
  // 修复：安全的URL/字符串转换
  const inputStr = input instanceof URL ? input.href : input;
  
  // 修复：安全的URL构造，处理相对路径
  let parsedUrl: URL;
  try {
    // 尝试直接构造URL（绝对URL）
    parsedUrl = new URL(inputStr);
  } catch {
    // 如果失败，尝试使用base作为基础URL
    try {
      parsedUrl = new URL(inputStr, base || 'http://localhost');
    } catch {
      // 如果都失败，创建一个虚拟URL来解析参数
      parsedUrl = new URL('http://localhost' + (inputStr.startsWith('/') ? inputStr : '/' + inputStr));
    }
  }

  // 提取URL中已存在的查询参数键
  const existingParamKeys = Array.from(parsedUrl.searchParams.keys());
  
  // 安全地从defaultOptsParams中排除已存在的键
  const filteredDefaultParams = defaultOptsParams 
    ? omit(defaultOptsParams, existingParamKeys)
    : {};

  // 序列化合并后的参数
  const qs = serializeParams({
    ...filteredDefaultParams,
    ...fetcherOptsParams,
  });

  // 修复：更清晰的URL构建逻辑
  let finalUrl: string;
  
  if (/^https?:\/\//.test(inputStr)) {
    // 绝对URL：直接使用
    finalUrl = inputStr;
  } else if (!base) {
    // 无基础URL：直接使用输入
    finalUrl = inputStr;
  } else if (!inputStr) {
    // 空输入：使用基础URL
    finalUrl = base;
  } else {
    // 相对URL：拼接base和input
    const cleanBase = base.replace(/\/+$/, ''); // 移除末尾的斜杠
    const cleanInput = inputStr.replace(/^\/+/, ''); // 移除开头的斜杠
    finalUrl = `${cleanBase}/${cleanInput}`;
  }

  // 添加查询参数
  if (qs) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += separator + qs.replace(/^\?/, '');
  }

  return finalUrl;
};
