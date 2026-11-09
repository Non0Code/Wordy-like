import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: { "/api": process.env.PARLA_API ?? "http://localhost:8787" },
  },
  build: { chunkSizeWarningLimit: 900 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
} as any);
