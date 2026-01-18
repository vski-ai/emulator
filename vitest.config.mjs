/// <reference types="vitest" />
import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";

export default defineConfig({
  plugins: [deno()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      //"npm:@preact/signals@^2.5.1": "@preact/signals",
    },
  },
});
