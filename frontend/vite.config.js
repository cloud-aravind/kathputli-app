import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local development routing for Kathputli's eight Go services.
// Keep the more-specific cross-service routes before /api/artists and /api/orders.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Artist categories/artworks are implemented by Artwork Service, not Artist Service.
      '^/api/artists/[^/]+/(categories|artworks)(/|$)': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },

      // Payment Service owns this cross-service lookup route.
      '^/api/orders/[^/]+/payment$': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },

      '/api/auth': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/users': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/artists': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/artworks': { target: 'http://localhost:8085', changeOrigin: true },
      '/api/orders': { target: 'http://localhost:8086', changeOrigin: true },
      '/api/payments': { target: 'http://localhost:8087', changeOrigin: true },
      '/api/notifications': { target: 'http://localhost:8088', changeOrigin: true },
      '/api/deliveries': { target: 'http://localhost:8089', changeOrigin: true },
    },
  },
})
