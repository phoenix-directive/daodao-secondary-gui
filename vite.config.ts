import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';

// Plugin to generate a build hash and write it to public/version.json
function versionHashPlugin(): Plugin {
  return {
    name: 'version-hash',
    buildStart() {
      const hash = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const versionInfo = {
        hash,
        timestamp,
      };
      
      const publicDir = path.resolve(__dirname, 'public');
      const versionFile = path.join(publicDir, 'version.json');
      
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
      console.log(`[Version Hash] Generated: ${hash}`);
    },
  };
}

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: [['module:@preact/signals-react-transform']] },
    }),
    svgr(),
    tailwindcss(),
    nodePolyfills({
      include: ['process'],
      globals: { global: true, process: true, Buffer: true },
    }),
    versionHashPlugin(),
  ],
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
