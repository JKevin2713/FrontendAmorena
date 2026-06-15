import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: ["@tanstack/*", "nitro"],
    },
    plugins: [
      nitro({
        preset: "vercel",
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
      }),
    ],
    build: {
      rollupOptions: {
        input: {
          server: "src/server.ts",
          client: "src/client.tsx",
        },
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});