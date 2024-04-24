import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

// todo: take from properties
const PORT = 3000

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },
  server: {
    proxy: {
      "/api": {
        target: `http://91.92.136.244:${PORT}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
})
