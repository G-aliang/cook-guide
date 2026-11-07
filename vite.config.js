import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // prompt：新版本先等待，由页面弹「有新版本」提示，用户点击后再激活并刷新
      // （不用 autoUpdate，避免用户正在操作时被静默刷新）
      registerType: 'prompt',
      // 关闭自动注入的注册脚本，改由 src/pwa.js 手动注册以接管更新提示
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '家常菜入门指南',
        short_name: '家常菜',
        description: '个人厨房知识库 — 食材与菜品的双向关联导航',
        theme_color: '#FF6B35',
        background_color: '#F7F7F7',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // 新 SW 不自动接管，等用户点「刷新」后通过消息跳过等待；
        // 激活后立即接管页面，保证刷新时加载到新版本
        skipWaiting: false,
        clientsClaim: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('import-data.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'import-data-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
