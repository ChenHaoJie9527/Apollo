import { resolveUrl } from "../utils/resolve-url";
import { toStreamable } from "../utils/to-streamable";

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
