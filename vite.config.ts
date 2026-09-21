import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 部署在子路径 /myday/ 下；本地/其他托管用根路径
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MyDay · 每日面板',
        short_name: 'MyDay',
        description: '一个模块化的每日信息面板：日历、玛雅历、记账、运动跟练、英语学习。',
        theme_color: '#0F6E56',
        background_color: '#FAF7F1',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        lang: 'zh-CN',
        icons: [
          { src: `${base}favicon.svg`, sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: `${base}favicon.svg`, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,json,woff2,pdf}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/player\.bilibili\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'bilibili-embed' },
          },
          {
            urlPattern: /\/essays\/.*\.pdf$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'essays-pdf',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.tianapi\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'tianapi', expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
