# Image Assets Directory

This directory contains all optimized images for the Attack A Crack website.

## Directory Structure

```
images/
├── services/          # Foundation repair service images
│   ├── wall-crack-repair/
│   ├── leaky-bulkhead-repair/
│   ├── sewer-well-conduit-line-repair/
│   ├── foundation-crack-injection/
│   ├── carbon-fiber-stitches/
│   └── free-foundation-consultations/
├── resurfacing/       # Concrete resurfacing images (MA only)
│   ├── stairway/
│   ├── walkway/
│   ├── driveway/
│   ├── garage/
│   ├── pool-deck/
│   └── patio/
├── blog/              # Blog post images
├── team/              # Team member photos
├── locations/         # Location/city images
├── foundation-types/  # Foundation type educational images
├── partners/          # Partner-related images
└── hero/              # Hero section images
```

## Image Requirements

### Formats
- Use WebP or AVIF for photos (Astro will auto-convert)
- Use SVG for logos and icons
- PNG for images requiring transparency

### Sizes
- Hero images: 1920x1080 (16:9) or 2400x1350
- Service cards: 600x400 (3:2)
- Blog thumbnails: 800x450 (16:9)
- Team photos: 400x400 (1:1, square)
- Before/After images: 800x600 (4:3)

### Naming Convention
- Use lowercase with hyphens: `wall-crack-before.webp`
- Include variant suffix: `hero-mobile.webp`, `hero-desktop.webp`
- Before/after pairs: `driveway-before.webp`, `driveway-after.webp`

## Using Images in Astro

Always use Astro's Image component for automatic optimization:

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/images/hero/home-hero.webp';
---

<Image
  src={heroImage}
  alt="Foundation repair in Connecticut"
  width={1920}
  height={1080}
/>
```

## Migration Checklist

### From Squarespace
- [ ] Download all service page images
- [ ] Download all blog images
- [ ] Download team photos
- [ ] Download before/after galleries
- [ ] Download any location-specific images

### Optimization
- [ ] Compress images (TinyPNG or similar)
- [ ] Convert to WebP format
- [ ] Create responsive variants if needed
- [ ] Add appropriate alt text in content files

### Placeholder Replacement
Replace all `picsum.photos` URLs in content files with local images:
- [ ] Services collection
- [ ] Resurfacing collection
- [ ] Blog collection
- [ ] Location pages
- [ ] Foundation types collection
