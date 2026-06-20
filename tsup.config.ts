import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "wishlist-alerts": "src/index.ts" },
  format: ["iife", "esm", "cjs"],
  globalName: "SmartWishlistAlerts",
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  footer: (ctx) => {
    if (ctx.format === "iife") {
      return {
        js: "window.SmartWishlistAlerts = window.SmartWishlistAlerts.default;",
      };
    }
    return {};
  },
});
