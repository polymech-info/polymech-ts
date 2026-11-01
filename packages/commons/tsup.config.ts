import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entryPoints: [
    "src/*.ts"
  ],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  ...options,
  bundle: false
}));
