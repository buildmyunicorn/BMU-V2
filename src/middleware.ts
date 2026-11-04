import { NextResponse, type NextRequest } from 'next/server';

const SUPPORTED_REGIONS = new Set([
  'IE',
  'GB',
  'US',
  'AU',
  'CA',
  'EU',
  'ROW',
]);

function normalizeGeoHeader(rawCountry: string | null): string {
  if (!rawCountry) return 'GLOBAL';
  const code = rawCountry.trim().toUpperCase();
  if (code === 'IE') return 'IE';
  if (code === 'GB' || code === 'UK') return 'GB';
  if (code === 'US') return 'US';
  if (code === 'AU') return 'AU';
  if (code === 'CA') return 'CA';
  if (
    [
      'DE',
      'FR',
      'NL',
      'ES',
      'IT',
      'PT',
      'BE',
      'AT',
      'FI',
      'SE',
      'DK',
      'PL',
      'CZ',
      'EE',
      'LT',
      'LV',
      'LU',
      'MT',
      'CY',
      'GR',
      'HR',
      'HU',
      'RO',
      'BG',
      'SK',
      'SI',
    ].includes(code)
  ) {
    return 'EU';
  }
  return SUPPORTED_REGIONS.has(code) ? code : 'ROW';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect country from standard CDN / Cloud Run / Cloudflare / Vercel edge headers
  const edgeCountry =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-appengine-country') ||
    request.headers.get('x-client-region');

  const detectedRegion = normalizeGeoHeader(edgeCountry);

  // Explicit route overrides cookie region so /ie and /uk pre-select country in onboarding
  let activeRegionCookie = request.cookies.get('spf_region')?.value;
  if (pathname === '/ie' || pathname.startsWith('/ie/')) {
    activeRegionCookie = 'IE';
  } else if (pathname === '/uk' || pathname.startsWith('/uk/')) {
    activeRegionCookie = 'GB';
  } else if (!activeRegionCookie && detectedRegion !== 'GLOBAL') {
    activeRegionCookie = detectedRegion;
  }

  const response = NextResponse.next();

  if (detectedRegion !== 'GLOBAL') {
    response.headers.set('x-spf-region', detectedRegion);
  }

  if (activeRegionCookie) {
    response.cookies.set('spf_region', activeRegionCookie, {
      path: '/',
      maxAge: 60 * 60 * 24 * 90, // 90 days
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/', '/ie', '/uk', '/register', '/onboarding'],
};
