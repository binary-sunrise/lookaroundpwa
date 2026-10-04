import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

// PWA Imports
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import type { RouteMatchCallback } from 'workbox-core';
import type { RuntimeCaching } from 'workbox-build';

// Prefer localhost
import dns from 'dns';
dns.setDefaultResultOrder('verbatim');

// Helper function for runtime cachine
const getCache = ({
  cacheName,
  urlPattern,
}: {
  cacheName: string;
  urlPattern: string | RegExp | RouteMatchCallback;
}): RuntimeCaching => ({
  urlPattern,
  handler: 'CacheFirst' as const,
  options: {
    cacheName,
    expiration: {
      maxEntries: 500,
      maxAgeSeconds: 60 * 60 * 24 * 7 * 2, // 2 weeks
    },
    cacheableResponse: {
      statuses: [200],
    },
  },
});

// const pwaOptions: Partial<VitePWAOptions> = {
//   workbox: {
//     runtimeCaching: [
//       getCache({
//         urlPattern: /^https:\/\/biocollect(-dev|-test|-)*.ala.org.au\/document/,
//         cacheName: 'biocollect-documents',
//       }),
//     ],
//   },
//   includeAssets: ['index.css', 'icon/*.png', 'fonts/*.woff', 'fonts/*.woff2', 'assets/*.png'],
//   manifest: {
//     name: 'BioCollect',
//     short_name: 'BioCollect',
//     theme_color: '#e13535',
//     background_color: '#212120',
//     icons: [
//       {
//         src: 'icon/192x192.png',
//         sizes: '192x192',
//         type: 'image/png',
//       },
//       {
//         src: 'icon/256x256.png',
//         sizes: '256x256',
//         type: 'image/png',
//       },
//       {
//         src: 'icon/384x384.png',
//         sizes: '384x384',
//         type: 'image/png',
//       },
//       {
//         src: 'icon/512x512.png',
//         sizes: '512x512',
//         type: 'image/png',
//       },
//     ],
//   },
//   registerType: 'autoUpdate',
//   injectRegister: 'auto',
//   devOptions: {
//     enabled: false,
//   },
// };

const pwaOptions: Partial<VitePWAOptions> = {
  workbox: {
    runtimeCaching: [
      getCache({
        urlPattern: /^https:\/\/biocollect(-dev|-test|-)*.ala.org.au\/document/,
        cacheName: 'biocollect-documents',
      }),
    ],
  },
  includeAssets: ['**/*.{png,woff,woff2,css}'], // Use glob pattern instead
  manifest: {
    name: 'LookAround',
    short_name: 'LookAround',
    theme_color: '#e13535',
    background_color: '#212120',
    icons: [
      {
        src: 'icon/192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icon/256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: 'icon/384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: 'icon/512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  devOptions: {
    enabled: false,
  },
};


const mockPwaPlugin = {
  name: 'mock-pwa-routes',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url || '';
      const cleanUrl = rawUrl.replace(/^\/(?:mobile-app|lookaroundpwa)/, '').split('?')[0];

      let targetFile: string | null = null;
      if (cleanUrl === '/pwa/sync' || cleanUrl === '/pwa/sync.html') {
        targetFile = path.resolve(__dirname, 'public/pwa/sync.html');
      } else if (
        cleanUrl.startsWith('/pwa/bioActivity/edit') ||
        cleanUrl.startsWith('/pwa/bioActivity/view') ||
        cleanUrl === '/pwa/edit.html'
      ) {
        targetFile = path.resolve(__dirname, 'public/pwa/edit.html');
      } else if (cleanUrl === '/pwa/settings' || cleanUrl === '/pwa/settings.html') {
        targetFile = path.resolve(__dirname, 'public/pwa/settings.html');
      } else if (cleanUrl === '/pwa' || cleanUrl === '/pwa/index.html') {
        targetFile = path.resolve(__dirname, 'public/pwa/index.html');
      }

      if (targetFile && fs.existsSync(targetFile)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(targetFile));
        return;
      }

      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    VitePWA(pwaOptions),
    mockPwaPlugin,
  ],
  assetsInclude: ['**/*.lottie'],
  envDir: './config',
  devtools: {
    enabled: false, // Enable for profiling
  },
  resolve: {
    tsconfigPaths: true,
  },
});
