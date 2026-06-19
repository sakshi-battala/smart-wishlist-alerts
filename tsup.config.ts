import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "wishlist-alerts": "src/index.ts" },
  format: ["iife", "esm", "cjs"],
  globalName: "SmartWishlistAlerts",
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
});
