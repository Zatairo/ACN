import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // API del LMS (Express + SQLite + Prisma en web/server, puerto 4000)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Archivos subidos al servidor (comprobantes, entregas, materiales)
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
