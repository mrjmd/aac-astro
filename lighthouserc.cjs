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
        'http://localhost/connecticut/hartford/index.html',
        'http://localhost/blog/signs-of-foundation-problems/index.html',
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
        'categories:seo': ['error', { minScore: 0.93 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
