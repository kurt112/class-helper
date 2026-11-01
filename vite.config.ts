import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Emits dist/sw.js with every built file listed, so the whole app is cached for offline use. */
const serviceWorker = (): Plugin => ({
  name: 'service-worker',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter((f) => f !== 'index.html');
    const source = readFileSync('src/sw.js', 'utf8')
      .replace('__FILES__', JSON.stringify(files))
      .replace('__BUILD__', JSON.stringify(Date.now().toString(36)));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
});

export default defineConfig({ plugins: [react(), tailwindcss(), serviceWorker()] });
