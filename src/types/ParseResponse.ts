import type { MaybePromise } from "./MaybePromise";

/**
 * ParseResponse is a tool type used to parse response data
 * MaybePromise: tool type, used to handle possible Promise
 * T: response data type
 */
export type ParseResponse<T> = (
	response: Response,
	request: Request,
) => MaybePromise<T>;
