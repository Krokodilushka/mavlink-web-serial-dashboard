import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'MAVLink-Web Serial Dashboard'
    }
  },
  nitro: {
    preset: 'bun'
  },
  plugins: [
    './plugins/node-nextTick.client.ts'
  ],
  vite: {
    plugins: [
      // @ts-ignore
      nodePolyfills({
        exclude: ['crypto'] // Helps for production build
      })
    ]
  },
})