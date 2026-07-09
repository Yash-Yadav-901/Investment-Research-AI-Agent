import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      '@heroui/react',
      'react-aria',
      'react-stately',
    ],
    force: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-aria', 'react-stately'],
  },
})


