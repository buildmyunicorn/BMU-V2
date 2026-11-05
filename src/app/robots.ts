import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/ie',
          '/uk',
          '/grants',
          '/grants/',
          '/about-founder',
          '/cohorts',
          '/pricing',
          '/register',
          '/login',
          '/redeem',
          '/appsumo',
          '/privacy',
          '/terms',
          '/v/',
        ],
        disallow: ['/admin/', '/api/', '/workspace/', '/account/'],
      },
    ],
    sitemap: 'https://startuppreflight.com/sitemap.xml',
  };
}
