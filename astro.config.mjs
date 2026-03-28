import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeRaw from 'rehype-raw';
import rehypeResponsiveImages from './src/plugins/rehype-responsive-images.js';
import rehypeYouTubeFacade from './src/plugins/rehype-youtube-facade.js';
import rehypeGeoPhones from './src/plugins/rehype-geo-phones.js';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeRaw, rehypeResponsiveImages, rehypeYouTubeFacade, rehypeGeoPhones],
  },
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
