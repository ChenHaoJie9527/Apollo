import type { MinFetchFn } from "./MinFetchFn";
import type { DefaultOptions } from "./DefaultOptions";
import { FetcherOptions } from "./FetcherOptions";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { GetDefaultParsedData } from "./GetDefaultParsedData";

export type Apollo<
  TFetch extends MinFetchFn = typeof fetch,
  TDefaultOptions extends DefaultOptions<MinFetchFn, any, any> = DefaultOptions<
    MinFetchFn,
    any,
    any
  >
> = <
  TParseData = GetDefaultParsedData<TDefaultOptions>,
  TSchema extends StandardSchemaV1<TParseData, any> = StandardSchemaV1<
    TParseData,
    any
  >,
  TRawBody = DefaultRawBody<TDefaultOptions>
>(
  input: Parameters<TFetch>[0],
  fetchOpts: FetcherOptions<TFetch, any, any, any>,
  ctx?: Parameters<TFetch>[2]
) => Promise<void>;
