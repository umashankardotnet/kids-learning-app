import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the site from /kids-learning-app/.
  base: process.env.GITHUB_PAGES ? '/kids-learning-app/' : '/',
  test: { include: ['src/**/*.test.ts'] },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kids Learning App',
        short_name: 'Kids Learn',
        theme_color: '#6c5ce7',
        background_color: '#fff7e6',
        display: 'standalone',
        orientation: 'any',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,mp3,woff2}'] },
    }),
  ],
});
