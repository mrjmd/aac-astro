module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/services/index.html',
        'http://localhost/blog/index.html',
        'http://localhost/connecticut/index.html',
        'http://localhost/massachusetts/index.html',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Performance: 0.85 baseline (homepage hero slideshow has ~3.5s render
        // delay in Lighthouse CI simulation; production on Vercel is faster).
        // All non-homepage pages score 1.0.
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        // PRE-LAUNCH: SEO threshold lowered to 0.69 because robots.txt blocks
        // crawling (is-crawlable audit fails with weight ~4x, tanking the score).
        // Lighthouse 12.x increased the is-crawlable weight significantly.
        // POST-LAUNCH TASK: Raise to 0.95 after enabling robots.txt crawling.
        'categories:seo': ['error', { minScore: 0.69 }],
        // STAGING: robots.txt blocks crawling intentionally until launch.
        // PRE-LAUNCH TASK: Remove this line when switching robots.txt to production.
        'is-crawlable': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
