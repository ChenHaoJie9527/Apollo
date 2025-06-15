import type { MinFetchFn } from "./MinFetchFn";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { BaseOptions } from "./BaseOptions";
import type { HeadersObject } from "./HeadersObject";
import type { Method } from "./Method";
import type { ParseResponse } from "./ParseResponse";
import type { SerializeBody } from "./SerializeBody";

export type FetcherOptions<
  T extends MinFetchFn,
  TSchema extends StandardSchemaV1,
  TParsedData,
  TRawBody
> = BaseOptions<T> & {
  baseUrl?: string;
  body?: NoInfer<TRawBody> | undefined | null;
  headers?: HeadersInit | HeadersObject;
  method?: Method;
  params?: Record<string, any>;
  schema?: TSchema
  parseResponse?: ParseResponse<TParsedData>
  serializeBody?: SerializeBody<TRawBody>
};
