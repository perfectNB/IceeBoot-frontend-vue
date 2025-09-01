import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (content, filename) => {
          // 避免在variables.scss文件中重复引入自己
          if (filename.includes('variables.scss')) {
            return content
          }
          return `@use "@/styles/variables.scss" as *;\n${content}`
        }
      }
    }
  },
  // 构建优化
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus', '@element-plus/icons-vue'],
          utils: ['axios', '@vueuse/core']
        },
        // 资源文件命名
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          let extType = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            extType = 'media'
          } else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name || '')) {
            extType = 'img'
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            extType = 'fonts'
          }
          return `static/${extType}/[name]-[hash][extname]`
        },
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js'
      }
    },
    chunkSizeWarningLimit: 1000,
    // CSS压缩
    cssCodeSplit: true,
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // 压缩配置
    minify: 'terser'
  }
})
