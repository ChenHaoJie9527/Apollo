export const getRetryConfigValue = async <T>(
  value: T | ((context: any) => Promise<T> | T),
  context: any
): Promise<T> => {
  return typeof value === "function"
    ? await (value as Function)(context)
    : value;
};
