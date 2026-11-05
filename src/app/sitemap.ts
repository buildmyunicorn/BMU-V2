import { MetadataRoute } from 'next';
import { db, grantsDirectory } from '@/db';
import { eq } from 'drizzle-orm';
import {
  ensureDefaultGrantsSeededInDb,
  getFallbackGrantRecords,
} from '@/lib/grants/ensure-grants';

const BASE_URL = 'https://startuppreflight.com';

const hreflangAlternates = {
  languages: {
    'x-default': `${BASE_URL}/`,
    en: `${BASE_URL}/`,
    'en-IE': `${BASE_URL}/ie`,
    'en-GB': `${BASE_URL}/uk`,
  },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: hreflangAlternates,
    },
    {
      url: `${BASE_URL}/ie`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: hreflangAlternates,
    },
    {
      url: `${BASE_URL}/uk`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: hreflangAlternates,
    },
    {
      url: `${BASE_URL}/grants`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about-founder`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cohorts`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
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

  let activeDbGrants: { slug: string; countryCode: string; updatedAt: Date | null }[] = [];

  try {
    await ensureDefaultGrantsSeededInDb();

    activeDbGrants = await db
      .select({
        slug: grantsDirectory.slug,
        countryCode: grantsDirectory.countryCode,
        updatedAt: grantsDirectory.updatedAt,
      })
      .from(grantsDirectory)
      .where(eq(grantsDirectory.status, 'ACTIVE'));
  } catch (err) {
    console.error('[Sitemap] Error querying grants catalog for sitemap:', err);
  }

  // Combine seed fallback catalog and live DB records by slug to guarantee 100% comprehensive coverage
  const grantMap = new Map<string, { slug: string; countryCode: string; updatedAt: Date | null }>();

  // 1. Seed with default code catalog
  for (const fallback of getFallbackGrantRecords()) {
    grantMap.set(fallback.slug.trim(), {
      slug: fallback.slug.trim(),
      countryCode: fallback.countryCode.trim(),
      updatedAt: fallback.updatedAt,
    });
  }

  // 2. Overwrite / augment with live active DB grants (including newer timestamps and admin additions)
  for (const dbGrant of activeDbGrants) {
    if (dbGrant.slug) {
      grantMap.set(dbGrant.slug.trim(), {
        slug: dbGrant.slug.trim(),
        countryCode: (dbGrant.countryCode || 'IE').trim(),
        updatedAt: dbGrant.updatedAt,
      });
    }
  }

  const allGrants = Array.from(grantMap.values());

  const grantRoutes: MetadataRoute.Sitemap = allGrants.flatMap((grant) => {
    const countrySegment = grant.countryCode.toLowerCase();
    const lastMod = grant.updatedAt || now;
    return [
      {
        url: `${BASE_URL}/grants/${countrySegment}/${grant.slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      },
      {
        url: `${BASE_URL}/grants/${countrySegment}/${grant.slug}/checklist`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ];
  });

  return [...staticRoutes, ...grantRoutes];
}
