import { defineConfig } from "rolldown";

export default defineConfig({
  input: ["src/apollo.ts"],
  output: [
    {
      dir: "dist/es",
      format: "es",
      sourcemap: true,
    },
    {
      dir: "dist/cjs",
      format: "cjs",
      sourcemap: true,
    },
  ],
});
