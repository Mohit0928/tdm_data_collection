import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tdm_data_collection/', // This should match your repository name
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 