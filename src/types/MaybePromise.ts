/**
 * MaybePromise is a tool type used to handle possible Promise
 * T: response data type
 */
export type MaybePromise<T> = T | Promise<T>;
