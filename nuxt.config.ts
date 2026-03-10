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
  modules: [],
  css: ['~/assets/css/main.css'],

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
