/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';
import * as path from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'packages/template/*'],
    globals: true,
    reporters: 'verbose',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src'),
      '~root': path.resolve(__dirname, '.'),
    },
  },
  plugins: [swc.vite()],
});
