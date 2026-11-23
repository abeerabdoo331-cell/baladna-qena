import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          '.well-known/assetlinks.json',
        ],
        manifest: {
          id: '/',
          name: 'بلدنا - خدمات قنا',
          short_name: 'بلدنا',
          description: 'خدمات قنا كلها أقرب ليك — دليل الخدمات والإعلانات وفرص العمل بمحافظة قنا.',
          lang: 'ar',
          dir: 'rtl',
          theme_color: '#1E5248',
          background_color: '#F4EFE6',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          prefer_related_applications: false,
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          navigateFallbackDenylist: [/^\/\.well-known\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'serve-well-known-assetlinks',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = (req.url || '').split('?')[0];
            if (urlPath === '/.well-known/assetlinks.json') {
              const filePath = path.resolve(
                __dirname,
                'public/.well-known/assetlinks.json'
              );
              if (fs.existsSync(filePath)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(fs.readFileSync(filePath, 'utf-8'));
                return;
              }
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = (req.url || '').split('?')[0];
            if (urlPath === '/.well-known/assetlinks.json') {
              const distPath = path.resolve(
                __dirname,
                'dist/.well-known/assetlinks.json'
              );
              const publicPath = path.resolve(
                __dirname,
                'public/.well-known/assetlinks.json'
              );
              const filePath = fs.existsSync(distPath) ? distPath : publicPath;
              if (fs.existsSync(filePath)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(fs.readFileSync(filePath, 'utf-8'));
                return;
              }
            }
            next();
          });
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const publicAssetLinks = path.resolve(
            __dirname,
            'public/.well-known/assetlinks.json'
          );
          const distWellKnownDir = path.resolve(distDir, '.well-known');
          if (fs.existsSync(distDir) && fs.existsSync(publicAssetLinks)) {
            fs.mkdirSync(distWellKnownDir, {recursive: true});
            fs.copyFileSync(
              publicAssetLinks,
              path.resolve(distWellKnownDir, 'assetlinks.json')
            );
          }
        },
      },
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
