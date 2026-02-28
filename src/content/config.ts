import { defineCollection, z, reference } from 'astro:content';

// =============================================================================
// SERVICES COLLECTION - Foundation repair services (CT + MA)
// =============================================================================
const servicesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(50).max(200),
    icon: z.enum(['Hammer', 'Droplets', 'ShieldCheck', 'Info', 'Wrench', 'CheckCircle2']),
    order: z.number().default(0),
    beforeImage: z.string().optional(),
    afterImage: z.string().optional(),
    heroImage: z.string().optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    relatedServices: z.array(z.string()).optional(),
  }),
});

// =============================================================================
// RESURFACING COLLECTION - Concrete resurfacing (MA-ONLY)
// =============================================================================
const resurfacingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(50).max(200),
    icon: z.enum(['Hammer', 'Droplets', 'ShieldCheck', 'Wrench', 'CheckCircle2']),
    order: z.number().default(0),
    beforeImage: z.string().optional(),
    afterImage: z.string().optional(),
    heroImage: z.string().optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    relatedServices: z.array(z.string()).optional(),
  }),
});

// =============================================================================
// FOUNDATION TYPES COLLECTION - Educational content
// =============================================================================
const foundationTypesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(50).max(200),
    heroImage: z.string().optional(),
    commonProblems: z.array(z.string()).optional(),
    repairMethods: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }),
});

// =============================================================================
// RESOURCES COLLECTION - Additional educational content
// =============================================================================
const resourcesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(50).max(200),
    heroImage: z.string().optional(),
  }),
});

// =============================================================================
// BLOG COLLECTION - Blog posts
// =============================================================================
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(30).max(80),
    metaTitle: z.string().min(30).max(60).optional(),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(100).max(200),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    category: z.enum(['guides', 'case-studies', 'cost-guides', 'maintenance-tips', 'news']),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().min(10).optional(),
    targetLocation: z.string().optional(), // CT, MA, or specific city
    relatedPosts: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// =============================================================================
// LOCATIONS COLLECTION - City/state pages
// =============================================================================
const locationsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    city: z.string(),
    state: z.enum(['Connecticut', 'Massachusetts']),
    stateAbbr: z.enum(['CT', 'MA']),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    region: z.string().optional(), // e.g., "Metro Boston", "North Shore"
    population: z.number().optional(),
    averageHomeAge: z.string().optional(),
    commonFoundationTypes: z.array(z.string()).optional(),
    neighborhoods: z.array(z.string()).optional(),
    localLandmarks: z.array(z.string()).optional(),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      location: z.string().optional(),
    }).optional(),
    nearbyCities: z.array(z.string()).optional(),
    localKeywords: z.array(z.string()).optional(),
    phoneNumber: z.string().optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    servesResurfacing: z.boolean().default(false), // Only true for MA cities
  }),
});

// =============================================================================
// TEAM COLLECTION - Team member profiles
// =============================================================================
const teamCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    location: z.string(),
    image: z.string().optional(),
    order: z.number().default(0),
    bio: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

// =============================================================================
// FAQS COLLECTION - Service-specific FAQs
// =============================================================================
const faqsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(), // e.g., "wall-cracks", "bulkhead", "general"
    order: z.number().default(0),
    questions: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
  }),
});

// =============================================================================
// PARTNERS COLLECTION - Partner type pages
// =============================================================================
const partnersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().min(30).max(60),
    metaDescription: z.string().min(120).max(160),
    excerpt: z.string().min(50).max(200),
    icon: z.string().optional(),
    order: z.number().default(0),
    benefits: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).optional(),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      company: z.string().optional(),
    }).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }),
});

// =============================================================================
// EXPORT COLLECTIONS
// =============================================================================
export const collections = {
  services: servicesCollection,
  resurfacing: resurfacingCollection,
  'foundation-types': foundationTypesCollection,
  resources: resourcesCollection,
  blog: blogCollection,
  locations: locationsCollection,
  team: teamCollection,
  faqs: faqsCollection,
  partners: partnersCollection,
};
