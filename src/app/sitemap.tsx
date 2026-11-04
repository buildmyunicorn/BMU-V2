import type { MetadataRoute } from 'next';

const BASE_URL = 'https://startuppreflight.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/`,
          en: `${BASE_URL}/`,
          'en-IE': `${BASE_URL}/ie`,
          'en-GB': `${BASE_URL}/uk`,
        },
      },
    },
    {
      url: `${BASE_URL}/ie`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/`,
          en: `${BASE_URL}/`,
          'en-IE': `${BASE_URL}/ie`,
          'en-GB': `${BASE_URL}/uk`,
        },
      },
    },
    {
      url: `${BASE_URL}/uk`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
      alternates: {
        languages: {
          'x-default': `${BASE_URL}/`,
          en: `${BASE_URL}/`,
          'en-IE': `${BASE_URL}/ie`,
          'en-GB': `${BASE_URL}/uk`,
        },
      },
    },
    {
      url: `${BASE_URL}/about-founder`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/redeem`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/appsumo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
