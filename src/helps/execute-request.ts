import type { MinFetchFn } from "src/types";
import { toStreamable } from "../utils/to-streamable";
import type { MergedOptions } from "src/utils";

/**
 * Helper function: performs a single request
 * @param request - The request to execute
 * @param finalOptions - The final options for the request
 * @param ctx - The context for the request
 * @param _fetch - The fetch function to use
 * @returns The response or error
 */
export const executeRequest = async (
  request: Request,
  finalOptions: MergedOptions,
  ctx: any,
  _fetch: MinFetchFn
) => {
  try {
    const response = await toStreamable(
      await _fetch(
        request,
        // do not override the request body & patch headers again
        // body and headers are already set in the new request
        {
          ...finalOptions,
          body: undefined,
          headers: request.headers,
        },
        ctx
      ),
      // Download progress callback function
      finalOptions.onResponseStreaming
    );
    return {
      response,
    };
  } catch (error: any) {
    return {
      error,
    };
  }
};
