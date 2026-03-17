import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.attackacrack.com', // Use the production domain for SEO
  integrations: [sitemap({
    filter: (page) =>
      !(/\/\d+\/?$/.test(page)) &&
      !page.includes('/partners/capture') &&
      !page.includes('/partners/qr'),
  })],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
