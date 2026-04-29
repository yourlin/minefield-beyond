import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  base: '/minefield-beyond/',
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../core'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/game'),
  },
});
