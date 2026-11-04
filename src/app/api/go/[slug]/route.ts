import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  partnerOffers,
  partnerReferralEvents,
} from '@/db';
import {
  DEFAULT_PARTNER_OFFERS,
  resolvePartnerReferralUrl,
  type PartnerSlotKey,
} from '@/lib/partners/partner-catalog-store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const cleanSlug = (slug || '').trim().toLowerCase();

  const searchParams = request.nextUrl.searchParams;
  const planId =
    searchParams.get('planId') || searchParams.get('projectId') || undefined;
  const planTitle = searchParams.get('planTitle') || undefined;
  const domain = searchParams.get('domain') || undefined;
  const countryCode = (searchParams.get('country') || 'IE').toUpperCase();
  const founderName = searchParams.get('founderName') || undefined;
  const founderEmail = searchParams.get('founderEmail') || undefined;

  let matchedOffer = DEFAULT_PARTNER_OFFERS.find(
    (p) => p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug
  );

  try {
    await ensureDatabaseSchemaSynced();
    const dbRows = await db
      .select()
      .from(partnerOffers)
      .where(eq(partnerOffers.slug, cleanSlug))
      .limit(1);

    if (dbRows.length > 0) {
      const row = dbRows[0];
      matchedOffer = {
        id: row.id,
        slug: row.slug,
        slotKey: row.slotKey as PartnerSlotKey,
        name: row.name,
        logoEmoji: row.logoEmoji,
        category: row.category,
        headline: row.headline,
        perkDescription: row.perkDescription,
        badgeText: row.badgeText,
        promoCode: row.promoCode,
        countryScope: (row.countryScope as 'ALL' | 'IE' | 'GB') || 'ALL',
        actionType:
          (row.actionType as 'AFFILIATE_LINK' | 'WARM_INTRO_MODAL') ||
          'AFFILIATE_LINK',
        actionLabel: row.actionLabel,
        referralUrl: row.referralUrl,
        trustFactor: row.trustFactor,
        warmIntroRecipientEmail: row.warmIntroRecipientEmail,
        warmIntroQuestionsJson: row.warmIntroQuestionsJson || [],
        commissionBountySummary: row.commissionBountySummary,
        partnerContactNotes: row.partnerContactNotes,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
  } catch {
    // Fall back to default offer catalog if DB is unreachable
  }

  const targetUrl = resolvePartnerReferralUrl(
    matchedOffer?.referralUrl || 'https://startuppreflight.com',
    {
      planId,
      domain,
      countryCode,
    }
  );

  // Fire-and-forget click log to PostgreSQL
  if (matchedOffer) {
    (async () => {
      try {
        await db.insert(partnerReferralEvents).values({
          partnerId: matchedOffer.id,
          partnerName: matchedOffer.name,
          partnerSlug: matchedOffer.slug,
          slotKey: matchedOffer.slotKey,
          eventType: 'AFFILIATE_CLICK',
          planId: planId || null,
          planTitle: planTitle || null,
          founderName: founderName || null,
          founderEmail: founderEmail || null,
          countryCode,
          selectedDomain: domain || null,
          destinationUrl: targetUrl,
          intakeAnswersJson: domain ? { claimed_domain: domain } : {},
          leadStatus: 'CLICKED',
          estimatedBountyAmount: matchedOffer.commissionBountySummary || null,
        });
      } catch {
        // Non-fatal if DB is offline
      }
    })();
  }

  return NextResponse.redirect(targetUrl, { status: 307 });
}
