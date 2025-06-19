import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { DefaultOptions } from "./DefaultOptions";
import type { FetcherOptions } from "./FetcherOptions";
import type { GetDefaultParsedData } from "./GetDefaultParsedData";
import type { GetDefaultRawBody } from "./GetDefaultRawBody";
import type { MinFetchFn } from "./MinFetchFn";

export type Apollo<
	TFetch extends MinFetchFn = typeof fetch,
	TDefaultOptions extends DefaultOptions<MinFetchFn, any, any> = DefaultOptions<
		MinFetchFn,
		any,
		any
	>,
> = <
	TParseData = GetDefaultParsedData<TDefaultOptions>,
	TSchema extends StandardSchemaV1<TParseData, any> = StandardSchemaV1<
		TParseData,
		any
	>,
	TRawBody = GetDefaultRawBody<TDefaultOptions>,
>(
	input: Parameters<TFetch>[0],
	fetchOpts: FetcherOptions<TFetch, TSchema, TParseData, TRawBody>,
	ctx?: Parameters<TFetch>[2],
) => Promise<StandardSchemaV1.InferOutput<TSchema>>;
