import { resolveUrl } from "../utils/resolve-url";
import { toStreamable } from "../utils/to-streamable";

/**
 * Helper function: creates a request
 * @param input - The input for the request
 * @param finalOptions - The final options for the request
 * @param defaultOptions - The default options for the request
 * @param fetchOpts - The fetch options for the request
 * @returns The request
 */
export const createRequest = async (
  input: any,
  finalOptions: any,
  defaultOptions: any,
  fetchOpts: any
): Promise<Request> => {
  const url = input?.url
    ? input
    : resolveUrl(
        finalOptions.baseUrl,
        input as unknown as string | URL,
        defaultOptions.params,
        fetchOpts.params,
        finalOptions.serializeParams
      );
  const request = new Request(url, finalOptions as any);
  return toStreamable(request, finalOptions.onRequestStreaming);
};
