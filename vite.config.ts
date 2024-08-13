import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  //resolve: {
  //  alias : {
  //    "@": process.env.NODE_ENV === 'production' ? path.resolve(__dirname, './') : path.resolve(__dirname, './public'),
  //  }
  //},
  //base: process.env.NODE_ENV === 'production' ? 'https://chenxch.github.io/xlegex/' : '/',
  //assetsInclude: ["**/*.png", "**/*.mp3", "**/*..css", "**/*.ttf", "**/*.svg", ],
  base: "/",
  server: {
    port: 80,
    host: '0.0.0.0'
  },
  optimizeDeps: { // 👈 optimizedeps
    esbuildOptions: {
      target: "esnext", 
      // Node.js global to browser g lobalThis
      define: {
        global: 'globalThis'
      },
      supported: { 
        bigint: true 
      },
    }
  }, 

  build: {
    target: ["esnext"], // 👈 build.target
    //assetsDir: "public"
  },
})
