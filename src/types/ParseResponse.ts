import type { MaybePromise } from "./MaybePromise";

export type ParseResponse<T> = (
  response: Response,
  request: Request
) => MaybePromise<T>;
