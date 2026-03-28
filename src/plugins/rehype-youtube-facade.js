/**
 * Rehype plugin that replaces YouTube <iframe> embeds in markdown content
 * with lightweight facade elements (thumbnail + play button).
 *
 * The actual YouTube player loads only when the user clicks.
 * The facade handler script lives in Layout.astro.
 */
import { visit } from 'unist-util-visit';

const YT_EMBED_RE = /youtube\.com\/embed\/([^?&"]+)/;

export default function rehypeYouTubeFacade() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'iframe') return;
      const src = node.properties?.src;
      if (!src || typeof src !== 'string') return;

      const match = src.match(YT_EMBED_RE);
      if (!match) return;

      const videoId = match[1];
      const title = node.properties.title || '';

      // Capture inline styles to pass through (for the overflow crop pattern)
      const iframeStyle = node.properties.style || '';
      const iframeClass = node.properties.className
        ? (Array.isArray(node.properties.className)
            ? node.properties.className.join(' ')
            : node.properties.className)
        : '';

      // Build the facade element tree
      // Don't set aspect-ratio — the parent container already handles sizing.
      // Use w-full h-full so the facade fills whatever container wraps it.
      const facade = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['yt-facade', 'group', 'relative', 'cursor-pointer', 'bg-zinc-900', 'overflow-hidden', 'w-full', 'h-full'],
          'data-video-id': videoId,
          'data-video-title': title,
          'data-iframe-style': iframeStyle,
          'data-iframe-class': iframeClass,
          role: 'button',
          tabindex: '0',
          'aria-label': `Play video: ${title}`,
        },
        children: [
          // Thumbnail
          {
            type: 'element',
            tagName: 'img',
            properties: {
              src: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              srcset: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg 480w, https://i.ytimg.com/vi/${videoId}/sddefault.jpg 640w, https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg 1280w`,
              sizes: '(max-width: 640px) 100vw, 640px',
              alt: title,
              className: ['w-full', 'h-full', 'object-cover', 'opacity-80', 'group-hover:opacity-100', 'transition-opacity'],
              loading: 'lazy',
              referrerpolicy: 'no-referrer',
            },
            children: [],
          },
          // Play button overlay
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['absolute', 'inset-0', 'flex', 'items-center', 'justify-center'],
            },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: {
                  className: ['w-16', 'h-12', 'bg-red-600', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'group-hover:bg-red-500', 'transition-colors', 'shadow-lg'],
                },
                children: [
                  {
                    type: 'element',
                    tagName: 'svg',
                    properties: {
                      viewBox: '0 0 24 24',
                      fill: 'white',
                      className: ['w-7', 'h-7', 'ml-1'],
                    },
                    children: [
                      {
                        type: 'element',
                        tagName: 'path',
                        properties: { d: 'M8 5v14l11-7z' },
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      // Replace the iframe node with the facade
      parent.children.splice(index, 1, facade);
    });
  };
}
