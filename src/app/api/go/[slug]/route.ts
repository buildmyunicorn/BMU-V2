import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  db,
  partnerOffers,
  partnerReferralEvents,
} from '@/db';
import {
  DEFAULT_PARTNER_OFFERS,
  resolvePartnerReferralUrl,
  type PartnerSlotKey,
} from '@/lib/partners/partner-catalog-store';
import { checkRateLimit } from '@/lib/auth/server-auth';
import { getTrustedAppOrigin } from '@/lib/auth/oauth-helpers';

function extractClientIpFromRequest(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return 'unknown';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const cleanSlug = (slug || '').trim().toLowerCase().slice(0, 120);
  const fallbackHome = getTrustedAppOrigin();

  const searchParams = request.nextUrl.searchParams;
  const planId =
    (searchParams.get('planId') || searchParams.get('projectId') || '').trim().slice(0, 64) || undefined;
  const planTitle = (searchParams.get('planTitle') || '').trim().slice(0, 200) || undefined;
  const domain = (searchParams.get('domain') || '').trim().slice(0, 253) || undefined;
  const countryCode = (searchParams.get('country') || 'IE').trim().toUpperCase().slice(0, 8);
  const founderName = (searchParams.get('founderName') || '').trim().slice(0, 120) || undefined;
  const founderEmail = (searchParams.get('founderEmail') || '').trim().slice(0, 254) || undefined;

  let matchedOffer = DEFAULT_PARTNER_OFFERS.find(
    (p) =>
      p.isActive !== false &&
      (p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug)
  );

  try {
    const dbRows = await db
      .select()
      .from(partnerOffers)
      .where(eq(partnerOffers.slug, cleanSlug))
      .limit(1);

    if (dbRows.length > 0) {
      const row = dbRows[0];
      if (!row.isActive) {
        matchedOffer = undefined;
      } else {
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
    }
  } catch {
    // Fall back to default offer catalog if DB is unreachable
  }

  const candidateUrl = resolvePartnerReferralUrl(
    matchedOffer?.referralUrl || fallbackHome,
    {
      planId,
      domain,
      countryCode,
    }
  );
  const targetUrl = /^https?:\/\//i.test(candidateUrl)
    ? candidateUrl
    : fallbackHome;

  // Rate-limit click logging per IP so an attacker cannot flood partner_referral_events
  const clientIp = extractClientIpFromRequest(request);
  const logRl = checkRateLimit(`partner_go_click:${clientIp}`, 30, 60_000);

  if (matchedOffer && logRl.allowed) {
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
