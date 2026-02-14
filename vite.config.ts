import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: "/d-regi-editor/",
  plugins: [
    vue(),
    Icons({
      compiler: "vue3",
      autoInstall: true,
      scale: 0,
    }),
    Components({
      resolvers: [
        IconsResolver({
          prefix: "i",
          enabledCollections: ["octicon"],
        }),
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dレジエディター',
        short_name: 'Dレジエディター',
        description: 'Dレジ専用頒布物エディター',
        theme_color: '#131416',
        background_color: '#131416',
        lang: "ja",
        icons: [
          { src: "/d-regi-editor/icon-192.png", sizes: '192x192', type: 'image/png' },
          { src: "/d-regi-editor/icon-512.png", sizes: '512x512', type: 'image/png' }
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
  }
});
