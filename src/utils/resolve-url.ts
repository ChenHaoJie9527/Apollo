import type { SerializeParams } from "src/types/SerializeParams";
import { omit } from "./omit";

type Params = Record<string, any>;

export const resolveUrl = (
  base: string | undefined = "",
  input: URL | string,
  defaultOptsParams: Params | undefined,
  fetcherOptsParams: Params | undefined,
  serializeParams: SerializeParams
): string => {
  // URL/String Conversion
  const inputStr = input instanceof URL ? input.href : input;
  // Safe URL construction, handling relative paths
  let parsedUrl: URL;
  try {
    // Try direct URL construction (absolute URL)
    parsedUrl = new URL(inputStr);
  } catch {
    // If failed, try using base as the base URL
    try {
      parsedUrl = new URL(inputStr, base || "http://localhost");
    } catch {
      // If both fail, create a virtual URL to parse parameters
      parsedUrl = new URL(
        "http://localhost" +
          (inputStr.startsWith("/") ? inputStr : "/" + inputStr)
      );
    }
  }

  // Extract existing query parameter keys from the URL
  const existingParamKeys = Array.from(parsedUrl.searchParams.keys());

  // Safely exclude existing keys from defaultOptsParams
  const filteredDefaultParams = defaultOptsParams
    ? omit(defaultOptsParams, existingParamKeys)
    : {};

  // Serialize the merged parameters
  const qs = serializeParams({
    ...filteredDefaultParams,
    ...fetcherOptsParams,
  });

  // clearer URL construction logic
  let finalUrl: string;

  if (/^https?:\/\//.test(inputStr)) {
    // Absolute URL: use directly
    finalUrl = inputStr;
  } else if (!base) {
    // No base URL: use input directly
    finalUrl = inputStr;
  } else if (!inputStr) {
    // Empty input: use base URL
    finalUrl = base;
  } else {
    // Relative URL: concatenate base and input
    const cleanBase = base.replace(/\/+$/, ""); // Remove trailing slash
    const cleanInput = inputStr.replace(/^\/+/, ""); // Remove leading slash
    finalUrl = `${cleanBase}/${cleanInput}`;
  }

  // Add query parameters
  if (qs) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl += separator + qs.replace(/^\?/, "");
  }

  return finalUrl;
};
