import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AIAgent',
      fileName: 'embed',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Single file, no external deps — must work as a standalone script tag
        inlineDynamicImports: true,
      },
    },
    minify: true,
    outDir: 'dist',
  },
})
