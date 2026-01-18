import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [deno(), react(), tailwindcss()],
  publicDir: "public",
  resolve: {
    alias: {
      "@rocketbase/client": new URL("../client/exports.ts", import.meta.url).pathname,
      "@rocketbase/emulator": new URL("../apps/emularor/index.ts", import.meta.url).pathname,
    },
  },
});
