import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) return 'react'
            if (id.includes('antd') || id.includes('@ant-design/icons')) return 'antd'
            if (id.includes('i18next')) return 'i18n'
            if (id.includes('echarts')) return 'charts'
          }
        },
      },
    },
  },
})
