/**
 * Vercel Edge Middleware — Geolocation-based phone number personalization.
 *
 * Reads Vercel's x-vercel-ip-country-region header and sets a `geo_region`
 * cookie for visitors in the 5 target New England states (CT, MA, RI, NH, ME).
 * A blocking <script> in Layout.astro reads this cookie and sets a CSS class
 * on <html> to show/hide the correct phone number via pure CSS.
 */
import { next } from '@vercel/edge';

const STATE_TO_REGION = { CT: 'ct', MA: 'ma', RI: 'ma', NH: 'ma', ME: 'ma' };

export default function middleware(request) {
  const country = request.headers.get('x-vercel-ip-country');
  const region = request.headers.get('x-vercel-ip-country-region');
  const geoRegion = (country === 'US' && region) ? STATE_TO_REGION[region] : null;

  if (!geoRegion) return next();

  return next({
    headers: {
      'Set-Cookie': `geo_region=${geoRegion}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`,
    },
  });
}

export const config = {
  matcher: ['/((?!_astro|api|images|fonts|favicon|robots|sitemap).*)'],
};
