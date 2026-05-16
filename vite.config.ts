import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-32.png',
        'icon-192.png',
        'icon-512.png',
        'maskable-icon-512.png',
        'apple-touch-icon.png',
        'badge-icon.png',
      ],
      injectManifest: {
        globIgnores: [
          '**/icon-512.png',
          '**/maskable-icon-512.png',
          '**/apple-touch-icon.png',
          'assets/**',
        ],
      },
      manifest: {
        name: 'World Cup 26',
        short_name: 'WC26',
        description: 'Fantasy football prediction app',
        theme_color: '#e6dcc5',
        background_color: '#e6dcc5',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
