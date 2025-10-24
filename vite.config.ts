import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
      '@': '/src'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  define: {
    global: 'window',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})