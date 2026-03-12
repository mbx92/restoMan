import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],

  // @ts-expect-error – @vite-pwa/nuxt augments this type after `nuxt prepare`
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'RestoMan POS',
      short_name: 'RestoMan',
      description: 'Point of Sale untuk Restoran',
      theme_color: '#1a2e1f',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/pos',
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,woff2,ico}'],
      runtimeCaching: [
        {
          // Cache products, categories, settings, and current shift for offline access
          urlPattern: /\/api\/(products|categories|settings|shifts\/current)/,
          handler: 'NetworkFirst' as const,
          options: {
            cacheName: 'api-data',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },

  // HTTPS for local dev — required for Web Bluetooth API
  // Certificates generated via: mkcert localhost 127.0.0.1 (in .certs/ folder)
  devServer: (() => {
    const keyPath = resolve('.certs/localhost+1-key.pem')
    const certPath = resolve('.certs/localhost+1.pem')
    if (existsSync(keyPath) && existsSync(certPath)) {
      return { https: { key: keyPath, cert: certPath } }
    }
    return {} // .certs not found — run: mkcert localhost 127.0.0.1 in .certs/
  })(),

  vite: {
    plugins: [tailwindcss() as any],
  },
  runtimeConfig: {
    authEmail: '',
    authPassword: '',
  },
})
