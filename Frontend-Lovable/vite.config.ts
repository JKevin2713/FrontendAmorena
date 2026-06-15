import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// 1. Elimina la importación manual de nitro: import { nitro } from "nitro/vite";

export default defineConfig({
  // 2. Mueve la configuración de nitro al nivel raíz para forzar su activación
  nitro: {
    preset: "vercel"
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: ["@tanstack/*", "nitro"],
    },

  }
});