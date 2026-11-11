import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

const appVersion = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  plugins: [
    vue(),
    {
      name: 'emit-app-version',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: appVersion })
        })
      }
    },
    // PWA配置
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          }
        ]
      },
      manifest: {
        name: 'IceeBoot 管理系统',
        short_name: 'IceeBoot',
        description: '现代化企业级后台管理平台',
        theme_color: '#409EFF',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      }
    }),
    // 兼容性支持
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 静态资源服务配置
  publicDir: 'public',
  // 开发服务器配置
  server: {
    host: true,
    port: 4396,
    strictPort: true,
    fs: {
      // 允许访问document目录
      allow: ['..', 'document']
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
          // 核心框架
          vendor: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          // UI组件库
          elementPlus: ['element-plus', '@element-plus/icons-vue'],
          // 工具库
          utils: ['axios', '@vueuse/core'],
          // 图表库
          charts: ['echarts', 'vue-echarts'],
          // Markdown相关
          markdown: ['markdown-it', 'marked', 'highlight.js']
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
    // 提高chunk大小警告阈值
    chunkSizeWarningLimit: 1500,
    // CSS代码分割
    cssCodeSplit: true,
    // 资源内联阈值 - 小于8KB的资源内联
    assetsInlineLimit: 8192,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console - 暂时禁用以便调试
        drop_console: false,
        // 移除debugger
        drop_debugger: true,
        // 移除无用代码
        pure_funcs: []
      },
      format: {
        // 移除注释
        comments: false
      }
    },
    // 启用gzip压缩
    reportCompressedSize: true,
    // 源码映射
    sourcemap: false
  }
})
