import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { BaseOptions } from "./BaseOptions";
import type { HeadersObject } from "./HeadersObject";
import type { Method } from "./Method";
import type { MinFetchFn } from "./MinFetchFn";
import type { OnRetry } from "./OnRetry";
import type { ParseRejected } from "./ParseRejected";
import type { ParseResponse } from "./ParseResponse";
import type { SerializeBody } from "./SerializeBody";
import type { StreamingEvent } from "./StreamingEvent";

/**
 * FetcherOptions is a tool type used to remove the body, headers, and method properties from the second parameter options of MinFetchFn, and return the remaining type
 * Parameters<T>: TS built-in advanced type, used to read the parameter type of function T, return a tuple, the tuple contains the type of all parameters, [1] represents the second parameter options
 * NonNullable<T>: TS built-in advanced type, used to remove the null and undefined types from T
 * DistributiveOmit: tool type, used to remove the K property from T and return the remaining type
 * NonNullable<Parameters<T>>[1]: represents the type of the second parameter options, NonNullable is used to remove the null and undefined types
 * & {}: used to add an empty object type, indicating that the remaining type must be an object
 */
export type FetcherOptions<
	T extends MinFetchFn,
	TSchema extends StandardSchemaV1,
	TParsedData,
	TRawBody,
> = BaseOptions<T> & {
	baseUrl?: string;
	body?: NoInfer<TRawBody> | undefined | null;
	headers?: HeadersInit | HeadersObject;
	method?: Method;
	params?: Record<string, any>;
	schema?: TSchema;
	parseRejected?: ParseRejected;
	parseResponse?: ParseResponse<TParsedData>;
	serializeBody?: SerializeBody<TRawBody>;
	signal?: AbortSignal;
	timeout?: number;
	onRequest?: (request: Request) => void;
	onError?: (error: {}, request: Request) => void;
	onRetry?: OnRetry;
	onSuccess?: (data: any, request: Request) => void;
	onRequestStreaming?: (event: StreamingEvent, request: Request) => void;
	onResponseStreaming?: (event: StreamingEvent, response: Response) => void;
} & {};
