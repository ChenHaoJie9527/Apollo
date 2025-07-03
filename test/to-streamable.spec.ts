import { toStreamable } from "../src/utils/to-streamable";
import { describe, it, expect, vi } from "vitest";
import type { StreamingEvent } from "../src/types/StreamingEvent";

describe("toStreamable", () => {
  describe("Basic functionality", () => {
    it("should return original object when no body or onStream is provided", async () => {
      const req = new Request("https://www.mozilla.org/favicon.ico");
      const callback = vi.fn();

      const result = await toStreamable(req, callback);

      expect(result).toBe(req);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
