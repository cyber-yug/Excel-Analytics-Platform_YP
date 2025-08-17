import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['echarts', 'echarts-for-react', 'chart.js', 'react-chartjs-2'],
          utils: ['axios', 'react-router-dom', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
