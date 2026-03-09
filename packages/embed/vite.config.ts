import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AIAgent',
      formats: ['iife'],
      // Output as embed.js (not embed.iife.js)
      fileName: () => 'embed.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: true,
    // Build into dashboard/public so http://localhost:3000/embed.js works out of the box
    outDir: resolve(__dirname, '../../apps/dashboard/public'),
    emptyOutDir: false,
  },
})
