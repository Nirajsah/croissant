import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'mpa',
  build: {
    outDir: 'dist/extension',
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      //   input: {
      //     popup: resolve(__dirname, 'src/popup/welcome.html'),
      //   },
      preserveEntrySignatures: 'strict',
      output: {
        minifyInternalExports: false,
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
