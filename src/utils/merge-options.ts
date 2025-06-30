export function mergeOptions<T1, T2, T3, T4>(
  opt1: T1,
  opt2: T2,
  opt3: T3,
  opt4: T4
) {
  const merged = {
    ...opt1,
    ...opt2,
    ...opt3,
    ...opt4,
  };

  const retryOptions = {
    ...(checkRetryIsObject(opt1) ? (opt1 as any)?.retry : {}),
    ...(checkRetryIsObject(opt2) ? (opt2 as any)?.retry : {}),
    ...(checkRetryIsObject(opt3) ? (opt3 as any)?.retry : {}),
    ...(checkRetryIsObject(opt4) ? (opt4 as any)?.retry : {}),
  };

  if (Object.keys(retryOptions).length > 0) {
    (merged as any).retry = retryOptions;
  }

  return merged;
}

function checkRetryIsObject(opt: any) {
  return Object.prototype.toString.call(opt?.retry) === "[object Object]";
}
