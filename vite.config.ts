import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';
import { devFoldersPlugin } from './dev/listDirs.js';

export default defineConfig((configEnv) => {
  const isDev = configEnv.command === 'serve' && !process.env.VITEST;
  const libraryEntries = {
    index: resolve(__dirname, 'src/index.ts'),
    modules: resolve(__dirname, 'src/modules.ts'),
  };

  return {
    root: isDev ? resolve(__dirname, 'dev') : undefined,
    publicDir: isDev ? resolve(__dirname, 'dev/public') : false,
    server: {
      open: 'index.html',
    },
    plugins: [
      devFoldersPlugin(),
      dts({
        entryRoot: resolve(__dirname, 'src'),
        insertTypesEntry: true,
        exclude: ['src/tests/**', '**/*.test.ts'],
      }),
    ],
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      minify: 'oxc',
      lib: {
        entry: libraryEntries,
        name: 'TonyGL',
        fileName: (_format, entryName) => `${entryName}.js`,
        formats: ['es'],
      },
      rolldownOptions: {
        external: ['wgpu-matrix'],
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
  };
});
