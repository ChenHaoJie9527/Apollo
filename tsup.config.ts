import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    resolve: ['@standard-schema/spec']
  },
  splitting: true,
  sourcemap: true,
  clean: true,
});