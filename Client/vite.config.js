import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  server: {
    historyApiFallback: true, // 🔥 هذا 
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/candidate/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/hr/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/admin/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(),
  ],
})
