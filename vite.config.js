import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [solid()],
  clearScreen: false,
  server: {
    port: 4000,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 4001 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
})
