import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "client",
  plugins: [
    {
      name: "gasflow-stale-client-entry-redirect",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.startsWith("/client/src/")) {
            request.url = request.url.replace(/^\/client/, "");
          }
          next();
        });
      },
    },
    react(),
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5000,
  },
  preview: {
    host: "127.0.0.1",
    port: 5000,
  },
});
