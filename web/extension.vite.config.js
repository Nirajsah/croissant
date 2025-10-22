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
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/content/injected.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        offscreen: resolve(__dirname, 'src/background/offscreen/index.html'),
        approval: resolve(__dirname, 'src/approval/index.html'),
        'linera-wasm-client': '@linera/wasm-client',
      },
      preserveEntrySignatures: 'strict',
      output: {
        minifyInternalExports: false,
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx', '.tsx'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  assetsInclude: ['**/*.wasm'],
})
