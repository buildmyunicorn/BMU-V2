import { MetadataRoute } from 'next';
import { db, grantsDirectory } from '@/db';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://startuppreflight.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ie`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/uk`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/grants`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-founder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    const activeGrants = await db
      .select({
        slug: grantsDirectory.slug,
        countryCode: grantsDirectory.countryCode,
        updatedAt: grantsDirectory.updatedAt,
      })
      .from(grantsDirectory)
      .where(eq(grantsDirectory.status, 'ACTIVE'));

    const grantRoutes: MetadataRoute.Sitemap = activeGrants.flatMap((grant) => {
      const countrySegment = grant.countryCode.toLowerCase();
      const lastMod = grant.updatedAt || new Date();
      return [
        {
          url: `${baseUrl}/grants/${countrySegment}/${grant.slug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        },
        {
          url: `${baseUrl}/grants/${countrySegment}/${grant.slug}/checklist`,
          lastModified: lastMod,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ];
    });

    return [...staticRoutes, ...grantRoutes];
  } catch (err) {
    console.error('[Sitemap] Error querying grants catalog for sitemap:', err);
    return staticRoutes;
  }
}
