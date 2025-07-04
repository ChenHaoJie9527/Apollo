import type { SerializeParams } from "src/types/SerializeParams";

type Params = Record<string, any>;
export const resolveUrl = (
  base: string | undefined = "",
  input: URL | string,
  defaultOptsParams: Params | undefined,
  fetcherOptsParams: Params | undefined,
  serializeParams: SerializeParams
) => {
  input = (input as URL).href ?? input;
  const qs = serializeParams({
    
  })
};
