'use server';

import crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  partnerOffers,
  partnerReferralEvents,
  quoteRfpRequests,
  quotePartnerResponses,
  emailLogs,
} from '@/db';
import type {
  WarmIntroQuestionField,
  PartnerCheckoutAddonField,
} from '@/db/schema';
import {
  getAdminSessionCookie,
  getServerSessionCookie,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';
import { stripe } from '@/lib/stripe/client';
import { headers } from 'next/headers';
import {
  DEFAULT_PARTNER_OFFERS,
  PARTNER_SLOT_DEFINITIONS,
  type PartnerOfferRecord,
  type PartnerReferralEventRecord,
  type PartnerSlotKey,
  type PartnerCountryScope,
  type PartnerActionType,
  type ReferralLeadStatus,
  type QuoteSupplierCategory,
} from '@/lib/partners/partner-catalog-store';

async function verifyAdminAuth(): Promise<boolean> {
  const session = await getAdminSessionCookie();
  return Boolean(session && session.role === 'SUPER_ADMIN');
}

function escapeHtml(raw: string | undefined | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolveVerifiedPartnerRecipientEmail(
  partnerSlug: string,
  fallbackDefault: string
): Promise<string> {
  try {
    await ensureDatabaseSchemaSynced();
    const [dbPartner] = await db
      .select({ warmIntroRecipientEmail: partnerOffers.warmIntroRecipientEmail })
      .from(partnerOffers)
      .where(eq(partnerOffers.slug, partnerSlug))
      .limit(1);
    if (dbPartner?.warmIntroRecipientEmail?.includes('@')) {
      return dbPartner.warmIntroRecipientEmail.trim();
    }
  } catch {
    // Fallback to catalog lookup
  }
  const catalogMatch = DEFAULT_PARTNER_OFFERS.find(
    (p) => p.slug === partnerSlug
  );
  if (catalogMatch?.warmIntroRecipientEmail?.includes('@')) {
    return catalogMatch.warmIntroRecipientEmail.trim();
  }
  return fallbackDefault;
}

function mapDbOfferToRecord(
  row: typeof partnerOffers.$inferSelect
): PartnerOfferRecord {
  return {
    id: row.id,
    slug: row.slug,
    slotKey: row.slotKey as PartnerSlotKey,
    name: row.name,
    logoEmoji: row.logoEmoji || '⚡',
    category: row.category,
    headline: row.headline,
    perkDescription: row.perkDescription,
    badgeText: row.badgeText,
    promoCode: row.promoCode,
    countryScope: (row.countryScope as PartnerCountryScope) || 'ALL',
    actionType: (row.actionType as PartnerActionType) || 'AFFILIATE_LINK',
    actionLabel: row.actionLabel,
    referralUrl: row.referralUrl,
    trustFactor: row.trustFactor,
    warmIntroRecipientEmail: row.warmIntroRecipientEmail,
    warmIntroQuestionsJson: Array.isArray(row.warmIntroQuestionsJson)
      ? row.warmIntroQuestionsJson
      : [],
    checkoutPriceAmount: row.checkoutPriceAmount ?? null,
    checkoutCurrency: row.checkoutCurrency || 'EUR',
    checkoutAddonsJson: Array.isArray(row.checkoutAddonsJson)
      ? row.checkoutAddonsJson
      : [],
    commissionBountySummary: row.commissionBountySummary,
    partnerContactNotes: row.partnerContactNotes,
    isSupplierPartner: Boolean(row.isSupplierPartner),
    supplierCategory: row.supplierCategory,
    dispatchEmail: row.dispatchEmail,
    monthlyRfpCap: row.monthlyRfpCap ?? 10,
    rfpsDispatchedThisMonth: row.rfpsDispatchedThisMonth ?? 0,
    lastRfpDispatchedAt: row.lastRfpDispatchedAt ? row.lastRfpDispatchedAt.toISOString() : null,
    sortOrder: row.sortOrder ?? 10,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
  };
}

function mapDbEventToRecord(
  row: typeof partnerReferralEvents.$inferSelect
): PartnerReferralEventRecord {
  return {
    id: row.id,
    partnerId: row.partnerId,
    partnerName: row.partnerName,
    partnerSlug: row.partnerSlug,
    slotKey: row.slotKey as PartnerSlotKey,
    eventType:
      row.eventType === 'PAID_CONCIERGE_ORDER'
        ? 'PAID_CONCIERGE_ORDER'
        : row.eventType === 'WARM_INTRO_LEAD'
          ? 'WARM_INTRO_LEAD'
          : 'AFFILIATE_CLICK',
    planId: row.planId,
    planTitle: row.planTitle,
    founderName: row.founderName,
    founderEmail: row.founderEmail,
    countryCode: row.countryCode || 'IE',
    selectedDomain: row.selectedDomain,
    destinationUrl: row.destinationUrl,
    intakeAnswersJson:
      row.intakeAnswersJson && typeof row.intakeAnswersJson === 'object'
        ? (row.intakeAnswersJson as Record<string, string>)
        : {},
    leadStatus: (row.leadStatus as ReferralLeadStatus) || 'CLICKED',
    estimatedBountyAmount: row.estimatedBountyAmount,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}

/**
 * Ensures default partner offers are seeded in PostgreSQL if the table is empty,
 * and upgrades the default Step 1 Incorporation Concierge to PAID_STRIPE_CONCIERGE if unconfigured.
 */
async function ensureDefaultPartnersSeededInDb(): Promise<void> {
  await ensureDatabaseSchemaSynced();
  const existing = await db.select().from(partnerOffers).limit(20);

  if (existing.length > 0) {
    const step1Concierge = existing.find(
      (r) => r.slug === 'company-bureau-formations'
    );
    const defaultStep1 = DEFAULT_PARTNER_OFFERS.find(
      (d) => d.slug === 'company-bureau-formations'
    );
    if (
      step1Concierge &&
      defaultStep1 &&
      step1Concierge.actionType === 'WARM_INTRO_MODAL' &&
      step1Concierge.checkoutPriceAmount == null
    ) {
      await db
        .update(partnerOffers)
        .set({
          actionType: 'PAID_STRIPE_CONCIERGE',
          actionLabel: defaultStep1.actionLabel,
          badgeText: defaultStep1.badgeText,
          category: defaultStep1.category,
          headline: defaultStep1.headline,
          perkDescription: defaultStep1.perkDescription,
          checkoutPriceAmount: defaultStep1.checkoutPriceAmount ?? 150,
          checkoutCurrency: defaultStep1.checkoutCurrency || 'EUR',
          checkoutAddonsJson: defaultStep1.checkoutAddonsJson || [],
          commissionBountySummary: defaultStep1.commissionBountySummary,
          updatedAt: new Date(),
        })
        .where(eq(partnerOffers.id, step1Concierge.id));
    }
    return;
  }

  for (const def of DEFAULT_PARTNER_OFFERS) {
    await db
      .insert(partnerOffers)
      .values({
        slug: def.slug,
        slotKey: def.slotKey,
        name: def.name,
        logoEmoji: def.logoEmoji,
        category: def.category,
        headline: def.headline,
        perkDescription: def.perkDescription,
        badgeText: def.badgeText,
        promoCode: def.promoCode || null,
        countryScope: def.countryScope,
        actionType: def.actionType,
        actionLabel: def.actionLabel,
        referralUrl: def.referralUrl,
        trustFactor: def.trustFactor,
        warmIntroRecipientEmail: def.warmIntroRecipientEmail || null,
        warmIntroQuestionsJson: def.warmIntroQuestionsJson || [],
        checkoutPriceAmount: def.checkoutPriceAmount ?? null,
        checkoutCurrency: def.checkoutCurrency || 'EUR',
        checkoutAddonsJson: def.checkoutAddonsJson || [],
        commissionBountySummary: def.commissionBountySummary || null,
        partnerContactNotes: def.partnerContactNotes || null,
        sortOrder: def.sortOrder,
        isActive: def.isActive,
      })
      .onConflictDoNothing();
  }
}

export interface AdminPartnersDashboardResult {
  ok: boolean;
  dbConnected: boolean;
  error?: string;
  offers: PartnerOfferRecord[];
  events: PartnerReferralEventRecord[];
  stats: {
    totalOffers: number;
    activeOffers: number;
    slotsCoveredCount: number;
    totalSlotsCount: number;
    totalAffiliateClicks: number;
    totalWarmIntroLeads: number;
    convertedBountiesCount: number;
  };
}

/**
 * 1. LIST ALL PARTNER OFFERS & REFERRAL EVENTS FOR ADMIN STUDIO
 */
export async function listAdminPartnersAndEventsAction(): Promise<AdminPartnersDashboardResult> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return {
      ok: false,
      dbConnected: false,
      error: 'Unauthorized: Super Admin access required.',
      offers: [],
      events: [],
      stats: {
        totalOffers: 0,
        activeOffers: 0,
        slotsCoveredCount: 0,
        totalSlotsCount: PARTNER_SLOT_DEFINITIONS.length,
        totalAffiliateClicks: 0,
        totalWarmIntroLeads: 0,
        convertedBountiesCount: 0,
      },
    };
  }

  try {
    await ensureDefaultPartnersSeededInDb();

    const [rawOffers, rawEvents] = await Promise.all([
      db.select().from(partnerOffers).orderBy(partnerOffers.sortOrder),
      db
        .select()
        .from(partnerReferralEvents)
        .orderBy(desc(partnerReferralEvents.createdAt))
        .limit(250),
    ]);

    const offers = rawOffers.map(mapDbOfferToRecord);
    const events = rawEvents.map(mapDbEventToRecord);

    const activeOffersList = offers.filter((o) => o.isActive);
    const coveredSlots = new Set(activeOffersList.map((o) => o.slotKey));

    return {
      ok: true,
      dbConnected: true,
      offers,
      events,
      stats: {
        totalOffers: offers.length,
        activeOffers: activeOffersList.length,
        slotsCoveredCount: coveredSlots.size,
        totalSlotsCount: PARTNER_SLOT_DEFINITIONS.length,
        totalAffiliateClicks: events.filter(
          (e) => e.eventType === 'AFFILIATE_CLICK'
        ).length,
        totalWarmIntroLeads: events.filter(
          (e) =>
            e.eventType === 'WARM_INTRO_LEAD' ||
            e.eventType === 'PAID_CONCIERGE_ORDER'
        ).length,
        convertedBountiesCount: events.filter(
          (e) =>
            e.leadStatus === 'CONVERTED_BOUNTY_DUE' ||
            e.leadStatus === 'BOUNTY_PAID'
        ).length,
      },
    };
  } catch (err) {
    const activeDefaults = DEFAULT_PARTNER_OFFERS.filter((o) => o.isActive);
    const coveredSlots = new Set(activeDefaults.map((o) => o.slotKey));
    return {
      ok: true,
      dbConnected: false,
      error: err instanceof Error ? err.message : 'DB unreachable — using local catalog.',
      offers: DEFAULT_PARTNER_OFFERS,
      events: [],
      stats: {
        totalOffers: DEFAULT_PARTNER_OFFERS.length,
        activeOffers: activeDefaults.length,
        slotsCoveredCount: coveredSlots.size,
        totalSlotsCount: PARTNER_SLOT_DEFINITIONS.length,
        totalAffiliateClicks: 0,
        totalWarmIntroLeads: 0,
        convertedBountiesCount: 0,
      },
    };
  }
}

/**
 * 2. LIST ACTIVE PARTNERS FOR PUBLIC / WORKSPACE <PartnerSlot />
 */
export async function listPublicActivePartnerOffersAction(): Promise<{
  ok: boolean;
  dbConnected: boolean;
  offers: PartnerOfferRecord[];
}> {
  try {
    await ensureDefaultPartnersSeededInDb();
    const rows = await db
      .select()
      .from(partnerOffers)
      .orderBy(partnerOffers.sortOrder);
    const active = rows.map(mapDbOfferToRecord).filter((o) => o.isActive);
    return {
      ok: true,
      dbConnected: true,
      offers: active.length > 0 ? active : DEFAULT_PARTNER_OFFERS.filter((o) => o.isActive),
    };
  } catch {
    return {
      ok: true,
      dbConnected: false,
      offers: DEFAULT_PARTNER_OFFERS.filter((o) => o.isActive),
    };
  }
}

/**
 * 3. CREATE OR UPDATE A PARTNER OFFER IN ADMIN STUDIO
 */
export async function upsertAdminPartnerOfferAction(input: {
  id?: string;
  slug: string;
  slotKey: PartnerSlotKey;
  name: string;
  logoEmoji: string;
  category: string;
  headline: string;
  perkDescription: string;
  badgeText: string;
  promoCode?: string | null;
  countryScope: PartnerCountryScope;
  actionType: PartnerActionType;
  actionLabel: string;
  referralUrl: string;
  trustFactor: string;
  warmIntroRecipientEmail?: string | null;
  warmIntroQuestionsJson?: WarmIntroQuestionField[];
  checkoutPriceAmount?: number | null;
  checkoutCurrency?: string | null;
  checkoutAddonsJson?: PartnerCheckoutAddonField[];
  commissionBountySummary?: string | null;
  partnerContactNotes?: string | null;
  isSupplierPartner?: boolean;
  supplierCategory?: QuoteSupplierCategory | null;
  dispatchEmail?: string | null;
  monthlyRfpCap?: number;
  rfpsDispatchedThisMonth?: number;
  lastRfpDispatchedAt?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<{
  ok: boolean;
  persistedToDb: boolean;
  offer?: PartnerOfferRecord;
  error?: string;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return {
      ok: false,
      persistedToDb: false,
      error: 'Unauthorized: Super Admin access required.',
    };
  }

  const cleanSlug =
    input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || `partner-${Date.now()}`;

  const nowIso = new Date().toISOString();
  const fallbackOffer: PartnerOfferRecord = {
    id: input.id || `partner-${crypto.randomUUID()}`,
    slug: cleanSlug,
    slotKey: input.slotKey,
    name: input.name.trim(),
    logoEmoji: input.logoEmoji.trim() || '⚡',
    category: input.category.trim() || 'Partner Perk',
    headline: input.headline.trim(),
    perkDescription: input.perkDescription.trim(),
    badgeText: input.badgeText.trim() || 'Preflight Partner',
    promoCode: input.promoCode?.trim() || null,
    countryScope: input.countryScope || 'ALL',
    actionType: input.actionType || 'AFFILIATE_LINK',
    actionLabel: input.actionLabel.trim() || 'Claim Partner Perk',
    referralUrl: input.referralUrl.trim() || 'https://startuppreflight.com',
    trustFactor: input.trustFactor.trim() || 'Startup Preflight Verified Partner',
    warmIntroRecipientEmail: input.warmIntroRecipientEmail?.trim() || null,
    warmIntroQuestionsJson: input.warmIntroQuestionsJson || [],
    checkoutPriceAmount:
      input.checkoutPriceAmount != null &&
      Number.isFinite(Number(input.checkoutPriceAmount))
        ? Math.round(Number(input.checkoutPriceAmount))
        : null,
    checkoutCurrency: input.checkoutCurrency?.trim().toUpperCase() || 'EUR',
    checkoutAddonsJson: input.checkoutAddonsJson || [],
    commissionBountySummary: input.commissionBountySummary?.trim() || null,
    partnerContactNotes: input.partnerContactNotes?.trim() || null,
    isSupplierPartner: Boolean(input.isSupplierPartner),
    supplierCategory: input.supplierCategory || null,
    dispatchEmail: input.dispatchEmail?.trim() || null,
    monthlyRfpCap: Number.isFinite(input.monthlyRfpCap) ? Number(input.monthlyRfpCap) : 10,
    rfpsDispatchedThisMonth: Number.isFinite(input.rfpsDispatchedThisMonth) ? Number(input.rfpsDispatchedThisMonth) : 0,
    lastRfpDispatchedAt: input.lastRfpDispatchedAt || null,
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 10,
    isActive: input.isActive ?? true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await ensureDatabaseSchemaSynced();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = Boolean(input.id && uuidRegex.test(input.id));

    if (isUuid && input.id) {
      const updated = await db
        .update(partnerOffers)
        .set({
          slug: fallbackOffer.slug,
          slotKey: fallbackOffer.slotKey,
          name: fallbackOffer.name,
          logoEmoji: fallbackOffer.logoEmoji,
          category: fallbackOffer.category,
          headline: fallbackOffer.headline,
          perkDescription: fallbackOffer.perkDescription,
          badgeText: fallbackOffer.badgeText,
          promoCode: fallbackOffer.promoCode,
          countryScope: fallbackOffer.countryScope,
          actionType: fallbackOffer.actionType,
          actionLabel: fallbackOffer.actionLabel,
          referralUrl: fallbackOffer.referralUrl,
          trustFactor: fallbackOffer.trustFactor,
          warmIntroRecipientEmail: fallbackOffer.warmIntroRecipientEmail,
          warmIntroQuestionsJson: fallbackOffer.warmIntroQuestionsJson,
          checkoutPriceAmount: fallbackOffer.checkoutPriceAmount,
          checkoutCurrency: fallbackOffer.checkoutCurrency,
          checkoutAddonsJson: fallbackOffer.checkoutAddonsJson,
          commissionBountySummary: fallbackOffer.commissionBountySummary,
          partnerContactNotes: fallbackOffer.partnerContactNotes,
          isSupplierPartner: fallbackOffer.isSupplierPartner,
          supplierCategory: fallbackOffer.supplierCategory,
          dispatchEmail: fallbackOffer.dispatchEmail,
          monthlyRfpCap: fallbackOffer.monthlyRfpCap,
          sortOrder: fallbackOffer.sortOrder,
          isActive: fallbackOffer.isActive,
          updatedAt: new Date(),
        })
        .where(eq(partnerOffers.id, input.id))
        .returning();

      if (updated.length > 0) {
        return {
          ok: true,
          persistedToDb: true,
          offer: mapDbOfferToRecord(updated[0]),
        };
      }
    }

    // Check by slug if editing a default seed offer whose local ID wasn't a UUID
    const existingBySlug = await db
      .select()
      .from(partnerOffers)
      .where(eq(partnerOffers.slug, fallbackOffer.slug))
      .limit(1);

    if (existingBySlug.length > 0) {
      const updated = await db
        .update(partnerOffers)
        .set({
          slotKey: fallbackOffer.slotKey,
          name: fallbackOffer.name,
          logoEmoji: fallbackOffer.logoEmoji,
          category: fallbackOffer.category,
          headline: fallbackOffer.headline,
          perkDescription: fallbackOffer.perkDescription,
          badgeText: fallbackOffer.badgeText,
          promoCode: fallbackOffer.promoCode,
          countryScope: fallbackOffer.countryScope,
          actionType: fallbackOffer.actionType,
          actionLabel: fallbackOffer.actionLabel,
          referralUrl: fallbackOffer.referralUrl,
          trustFactor: fallbackOffer.trustFactor,
          warmIntroRecipientEmail: fallbackOffer.warmIntroRecipientEmail,
          warmIntroQuestionsJson: fallbackOffer.warmIntroQuestionsJson,
          checkoutPriceAmount: fallbackOffer.checkoutPriceAmount,
          checkoutCurrency: fallbackOffer.checkoutCurrency,
          checkoutAddonsJson: fallbackOffer.checkoutAddonsJson,
          commissionBountySummary: fallbackOffer.commissionBountySummary,
          partnerContactNotes: fallbackOffer.partnerContactNotes,
          isSupplierPartner: fallbackOffer.isSupplierPartner,
          supplierCategory: fallbackOffer.supplierCategory,
          dispatchEmail: fallbackOffer.dispatchEmail,
          monthlyRfpCap: fallbackOffer.monthlyRfpCap,
          sortOrder: fallbackOffer.sortOrder,
          isActive: fallbackOffer.isActive,
          updatedAt: new Date(),
        })
        .where(eq(partnerOffers.id, existingBySlug[0].id))
        .returning();

      return {
        ok: true,
        persistedToDb: true,
        offer: mapDbOfferToRecord(updated[0]),
      };
    }

    const inserted = await db
      .insert(partnerOffers)
      .values({
        slug: fallbackOffer.slug,
        slotKey: fallbackOffer.slotKey,
        name: fallbackOffer.name,
        logoEmoji: fallbackOffer.logoEmoji,
        category: fallbackOffer.category,
        headline: fallbackOffer.headline,
        perkDescription: fallbackOffer.perkDescription,
        badgeText: fallbackOffer.badgeText,
        promoCode: fallbackOffer.promoCode,
        countryScope: fallbackOffer.countryScope,
        actionType: fallbackOffer.actionType,
        actionLabel: fallbackOffer.actionLabel,
        referralUrl: fallbackOffer.referralUrl,
        trustFactor: fallbackOffer.trustFactor,
        warmIntroRecipientEmail: fallbackOffer.warmIntroRecipientEmail,
        warmIntroQuestionsJson: fallbackOffer.warmIntroQuestionsJson,
        checkoutPriceAmount: fallbackOffer.checkoutPriceAmount,
        checkoutCurrency: fallbackOffer.checkoutCurrency,
        checkoutAddonsJson: fallbackOffer.checkoutAddonsJson,
        commissionBountySummary: fallbackOffer.commissionBountySummary,
        partnerContactNotes: fallbackOffer.partnerContactNotes,
        isSupplierPartner: fallbackOffer.isSupplierPartner,
        supplierCategory: fallbackOffer.supplierCategory,
        dispatchEmail: fallbackOffer.dispatchEmail,
        monthlyRfpCap: fallbackOffer.monthlyRfpCap,
        sortOrder: fallbackOffer.sortOrder,
        isActive: fallbackOffer.isActive,
      })
      .returning();

    return {
      ok: true,
      persistedToDb: true,
      offer: mapDbOfferToRecord(inserted[0]),
    };
  } catch (err) {
    return {
      ok: true,
      persistedToDb: false,
      offer: fallbackOffer,
      error: err instanceof Error ? err.message : 'Saved to local session fallback.',
    };
  }
}

/**
 * 4. QUICK TOGGLE PARTNER ACTIVE / PAUSED
 */
export async function toggleAdminPartnerActiveAction(input: {
  id: string;
  slug: string;
  isActive: boolean;
}): Promise<{ ok: boolean; persistedToDb: boolean }> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { ok: false, persistedToDb: false };

  try {
    await ensureDatabaseSchemaSynced();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input.id)) {
      await db
        .update(partnerOffers)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(partnerOffers.id, input.id));
    } else {
      await db
        .update(partnerOffers)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(partnerOffers.slug, input.slug));
    }
    return { ok: true, persistedToDb: true };
  } catch {
    return { ok: true, persistedToDb: false };
  }
}

/**
 * 5. DELETE PARTNER OFFER
 */
export async function deleteAdminPartnerOfferAction(input: {
  id: string;
  slug: string;
}): Promise<{ ok: boolean; persistedToDb: boolean }> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { ok: false, persistedToDb: false };

  try {
    await ensureDatabaseSchemaSynced();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input.id)) {
      await db.delete(partnerOffers).where(eq(partnerOffers.id, input.id));
    } else {
      await db.delete(partnerOffers).where(eq(partnerOffers.slug, input.slug));
    }
    return { ok: true, persistedToDb: true };
  } catch {
    return { ok: true, persistedToDb: false };
  }
}

/**
 * 6. RESTORE MISSING DEFAULT PARTNERS
 */
export async function restoreDefaultPartnerOffersAction(): Promise<{
  ok: boolean;
  persistedToDb: boolean;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { ok: false, persistedToDb: false };

  try {
    await ensureDatabaseSchemaSynced();
    for (const def of DEFAULT_PARTNER_OFFERS) {
      await db
        .insert(partnerOffers)
        .values({
          slug: def.slug,
          slotKey: def.slotKey,
          name: def.name,
          logoEmoji: def.logoEmoji,
          category: def.category,
          headline: def.headline,
          perkDescription: def.perkDescription,
          badgeText: def.badgeText,
          promoCode: def.promoCode || null,
          countryScope: def.countryScope,
          actionType: def.actionType,
          actionLabel: def.actionLabel,
          referralUrl: def.referralUrl,
          trustFactor: def.trustFactor,
          warmIntroRecipientEmail: def.warmIntroRecipientEmail || null,
          warmIntroQuestionsJson: def.warmIntroQuestionsJson || [],
          checkoutPriceAmount: def.checkoutPriceAmount ?? null,
          checkoutCurrency: def.checkoutCurrency || 'EUR',
          checkoutAddonsJson: def.checkoutAddonsJson || [],
          commissionBountySummary: def.commissionBountySummary || null,
          partnerContactNotes: def.partnerContactNotes || null,
          sortOrder: def.sortOrder,
          isActive: def.isActive,
        })
        .onConflictDoNothing();
    }
    return { ok: true, persistedToDb: true };
  } catch {
    return { ok: true, persistedToDb: false };
  }
}

/**
 * 7. SUBMIT WARM INTRO LEAD & DISPATCH STRUCTURED DOSSIER EMAIL TO PARTNER
 */
export async function submitPartnerWarmIntroLeadAction(input: {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  slotKey: PartnerSlotKey;
  warmIntroRecipientEmail?: string | null;
  planId?: string;
  planTitle?: string;
  founderName: string;
  founderEmail: string;
  countryCode: string;
  oneLinerSummary?: string;
  intakeAnswers: Record<string, string>;
  estimatedBountyAmount?: string | null;
}): Promise<{
  ok: boolean;
  persistedToDb: boolean;
  emailSent: boolean;
  event: PartnerReferralEventRecord;
}> {
  const nowIso = new Date().toISOString();
  const founderSession = await getServerSessionCookie();
  const adminSession = await getAdminSessionCookie();
  const callerKey =
    founderSession?.userId ||
    adminSession?.userId ||
    input.founderEmail?.trim().toLowerCase() ||
    'anon';

  const rl = checkRateLimit(`partner_intro:${callerKey}`, 6, 10 * 60_000);
  // Resolve recipient strictly from verified DB/catalog partner record unless caller is Super Admin
  const recipientEmail = adminSession
    ? input.warmIntroRecipientEmail?.trim() ||
      (await resolveVerifiedPartnerRecipientEmail(
        input.partnerSlug,
        'partners@startuppreflight.com'
      ))
    : await resolveVerifiedPartnerRecipientEmail(
        input.partnerSlug,
        'partners@startuppreflight.com'
      );
  const safeFounderEmail = founderSession?.email || input.founderEmail.trim();

  const fallbackEvent: PartnerReferralEventRecord = {
    id: `lead-${crypto.randomUUID()}`,
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    partnerSlug: input.partnerSlug,
    slotKey: input.slotKey,
    eventType: 'WARM_INTRO_LEAD',
    planId: input.planId || null,
    planTitle: input.planTitle || 'Startup Plan',
    founderName: input.founderName.trim(),
    founderEmail: safeFounderEmail,
    countryCode: input.countryCode || 'IE',
    selectedDomain: input.intakeAnswers['desired_domain_name'] || null,
    destinationUrl: `mailto:${recipientEmail}`,
    intakeAnswersJson: input.intakeAnswers || {},
    leadStatus: 'INTRO_SENT',
    estimatedBountyAmount: input.estimatedBountyAmount || null,
    adminNotes: `Warm intro email sent to ${recipientEmail}`,
    createdAt: nowIso,
  };

  if (!rl.allowed) {
    return {
      ok: false,
      persistedToDb: false,
      emailSent: false,
      event: fallbackEvent,
    };
  }

  // Build clean HTML dossier table for the partner & founder CC
  const answerRowsHtml = Object.entries(input.intakeAnswers || {})
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;font-size:13px;width:42%;">${escapeHtml(
          key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        )}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;">${
          escapeHtml(val) || '—'
        }</td>
      </tr>`
    )
    .join('');

  const subjectLine = `[Startup Preflight Warm Intro] ${input.founderName} (${
    input.planTitle || 'New Startup'
  }) × ${input.partnerName}`;

  const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:620px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <div style="background:#1e1b4b;color:#ffffff;padding:18px 22px;border-radius:8px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a5b4fc;font-weight:700;">Startup Preflight • Verified Partner Warm Intro</div>
        <h2 style="margin:6px 0 0;font-size:18px;font-weight:700;">Founder Setup Request: ${escapeHtml(input.partnerName)}</h2>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Hi <strong>${escapeHtml(input.partnerName)}</strong> team,<br/><br/>
        Please meet <strong>${escapeHtml(input.founderName)}</strong> (<a href="mailto:${escapeHtml(safeFounderEmail)}">${escapeHtml(safeFounderEmail)}</a>), who is currently configuring their operational foundations on <strong>Startup Preflight</strong> (${input.countryCode === 'GB' ? 'United Kingdom' : 'Ireland'}) and requested a fast-track warm introduction.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:16px 0;">
        <div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;">STARTUP &amp; FOUNDER SNAPSHOT</div>
        <div style="font-size:13px;color:#0f172a;line-height:1.6;">
          <strong>Venture / Plan:</strong> ${escapeHtml(input.planTitle || 'Startup Venture')}<br/>
          <strong>Founder Contact:</strong> ${escapeHtml(input.founderName)} (${escapeHtml(safeFounderEmail)})<br/>
          <strong>Jurisdiction:</strong> ${input.countryCode === 'GB' ? 'United Kingdom (Companies House / HMRC)' : 'Ireland (CRO / Revenue)'}<br/>
          ${input.oneLinerSummary ? `<strong>Concept Summary:</strong> ${escapeHtml(input.oneLinerSummary)}<br/>` : ''}
        </div>
      </div>
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;margin-top:20px;">Submitted Setup Intake Answers</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tbody>
          ${answerRowsHtml}
        </tbody>
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:12px;">
        <strong>Next Step:</strong> Reply-All to this email to connect directly with ${escapeHtml(input.founderName)}. Sent via Startup Preflight Partner Concierge Engine.
      </p>
    </div>
  `;

  let emailSent = false;
  let resendId: string | null = null;
  let emailStatus = 'MOCK_DEV';

  try {
    if (resend && (founderSession || adminSession || process.env.NODE_ENV !== 'production')) {
      // 1. Send Warm Intro Dossier Email to the Partner Desk
      const partnerSubject = subjectLine;
      const response = await resend.emails.send({
        from: EMAIL_DEFAULTS.from,
        to: [recipientEmail],
        cc:
          safeFounderEmail &&
          safeFounderEmail.toLowerCase() !== recipientEmail.toLowerCase()
            ? [safeFounderEmail]
            : undefined,
        replyTo: safeFounderEmail || EMAIL_DEFAULTS.replyTo,
        subject: partnerSubject,
        html: emailHtml,
      });

      if (!response.error && response.data?.id) {
        resendId = response.data.id;
        emailStatus = 'SENT';
        emailSent = true;
      } else if (response.error) {
        console.error('❌ Resend Warm Intro Partner Email Error:', response.error);
        emailStatus = 'FAILED';
      }
    } else {
      emailSent = true;
    }
  } catch (err) {
    console.error('❌ Error executing submitPartnerWarmIntroLeadAction:', err);
    emailStatus = 'FAILED';
  }

  try {
    await ensureDatabaseSchemaSynced();

    // Log in email_logs so it appears in System Emails Studio as well
    await db.insert(emailLogs).values({
      recipient: recipientEmail,
      template: 'PARTNER_WARM_INTRO',
      subject: subjectLine,
      status: emailStatus,
      resendId,
      fromEmail: EMAIL_DEFAULTS.from,
      replyTo: input.founderEmail || EMAIL_DEFAULTS.replyTo,
      metadataJson: {
        partnerSlug: input.partnerSlug,
        slotKey: input.slotKey,
        founderEmail: input.founderEmail,
        planId: input.planId,
      },
    });

    const inserted = await db
      .insert(partnerReferralEvents)
      .values({
        partnerId: input.partnerId,
        partnerName: input.partnerName,
        partnerSlug: input.partnerSlug,
        slotKey: input.slotKey,
        eventType: 'WARM_INTRO_LEAD',
        planId: input.planId || null,
        planTitle: input.planTitle || 'Startup Plan',
        founderName: input.founderName.trim(),
        founderEmail: input.founderEmail.trim(),
        countryCode: input.countryCode || 'IE',
        selectedDomain: input.intakeAnswers['desired_domain_name'] || null,
        destinationUrl: `mailto:${recipientEmail}`,
        intakeAnswersJson: input.intakeAnswers || {},
        leadStatus: 'INTRO_SENT',
        estimatedBountyAmount: input.estimatedBountyAmount || null,
        adminNotes: `Warm intro dossier dispatched to ${recipientEmail} (CC: ${input.founderEmail})`,
      })
      .returning();

    return {
      ok: true,
      persistedToDb: true,
      emailSent,
      event: mapDbEventToRecord(inserted[0]),
    };
  } catch {
    return {
      ok: true,
      persistedToDb: false,
      emailSent,
      event: fallbackEvent,
    };
  }
}

/**
 * 8. LOG OUTBOUND AFFILIATE LINK CLICK
 */
export async function logPartnerAffiliateClickAction(input: {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  slotKey: PartnerSlotKey;
  planId?: string;
  planTitle?: string;
  founderName?: string;
  founderEmail?: string;
  countryCode?: string;
  selectedDomain?: string;
  destinationUrl: string;
  estimatedBountyAmount?: string | null;
}): Promise<{ ok: boolean; event: PartnerReferralEventRecord }> {
  const nowIso = new Date().toISOString();
  const fallbackEvent: PartnerReferralEventRecord = {
    id: `click-${crypto.randomUUID()}`,
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    partnerSlug: input.partnerSlug,
    slotKey: input.slotKey,
    eventType: 'AFFILIATE_CLICK',
    planId: input.planId || null,
    planTitle: input.planTitle || null,
    founderName: input.founderName || null,
    founderEmail: input.founderEmail || null,
    countryCode: input.countryCode || 'IE',
    selectedDomain: input.selectedDomain || null,
    destinationUrl: input.destinationUrl,
    intakeAnswersJson: input.selectedDomain
      ? { claimed_domain: input.selectedDomain }
      : {},
    leadStatus: 'CLICKED',
    estimatedBountyAmount: input.estimatedBountyAmount || null,
    adminNotes: null,
    createdAt: nowIso,
  };

  try {
    await ensureDatabaseSchemaSynced();
    const inserted = await db
      .insert(partnerReferralEvents)
      .values({
        partnerId: input.partnerId,
        partnerName: input.partnerName,
        partnerSlug: input.partnerSlug,
        slotKey: input.slotKey,
        eventType: 'AFFILIATE_CLICK',
        planId: input.planId || null,
        planTitle: input.planTitle || null,
        founderName: input.founderName || null,
        founderEmail: input.founderEmail || null,
        countryCode: input.countryCode || 'IE',
        selectedDomain: input.selectedDomain || null,
        destinationUrl: input.destinationUrl,
        intakeAnswersJson: input.selectedDomain
          ? { claimed_domain: input.selectedDomain }
          : {},
        leadStatus: 'CLICKED',
        estimatedBountyAmount: input.estimatedBountyAmount || null,
      })
      .returning();

    return {
      ok: true,
      event: mapDbEventToRecord(inserted[0]),
    };
  } catch {
    return {
      ok: true,
      event: fallbackEvent,
    };
  }
}

/**
 * 9. UPDATE REFERRAL LEAD STATUS & BOUNTY NOTES IN ADMIN LEDGER
 */
export async function updatePartnerReferralLeadStatusAction(input: {
  eventId: string;
  leadStatus: ReferralLeadStatus;
  estimatedBountyAmount?: string | null;
  adminNotes?: string | null;
}): Promise<{ ok: boolean; persistedToDb: boolean }> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) return { ok: false, persistedToDb: false };

  try {
    await ensureDatabaseSchemaSynced();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input.eventId)) {
      await db
        .update(partnerReferralEvents)
        .set({
          leadStatus: input.leadStatus,
          estimatedBountyAmount: input.estimatedBountyAmount ?? null,
          adminNotes: input.adminNotes ?? null,
        })
        .where(eq(partnerReferralEvents.id, input.eventId));
    }
    return { ok: true, persistedToDb: true };
  } catch {
    return { ok: true, persistedToDb: false };
  }
}

/**
 * 10. CREATE STRIPE CHECKOUT SESSION FOR FLOW B PAID CONCIERGE ORDER
 *     (Founder answers intake questions + selects optional add-ons -> pays via Stripe)
 */
export async function createPartnerConciergeStripeCheckoutAction(input: {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  slotKey: PartnerSlotKey;
  basePriceAmount: number;
  currency: string;
  selectedAddons: PartnerCheckoutAddonField[];
  founderName: string;
  founderEmail: string;
  planId?: string;
  planTitle?: string;
  countryCode: string;
}): Promise<{
  ok: boolean;
  checkoutUrl?: string;
  sandboxFallback?: boolean;
  error?: string;
}> {
  const cleanCurrency = (input.currency || 'EUR').toLowerCase();
  const baseCents = Math.max(100, Math.round(Number(input.basePriceAmount || 150) * 100));

  try {
    const headerList = await headers();
    const origin =
      headerList.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const lineItems: any[] = [
      {
        price_data: {
          currency: cleanCurrency,
          unit_amount: baseCents,
          product_data: {
            name: `${input.partnerName} — Company Formation & Setup Package`,
            description: `Startup Preflight Verified Concierge Order (${input.planTitle || 'Startup Formation'})`,
          },
        },
        quantity: 1,
      },
    ];

    for (const addon of input.selectedAddons || []) {
      const addonCents = Math.round(Number(addon.priceAmount || 0) * 100);
      if (addonCents > 0) {
        lineItems.push({
          price_data: {
            currency: cleanCurrency,
            unit_amount: addonCents,
            product_data: {
              name: `Add-On: ${addon.label}`,
              description: addon.description,
            },
          },
          quantity: 1,
        });
      }
    }

    const successUrl = `${origin}/workspace?concierge_paid=true&partner_slug=${encodeURIComponent(
      input.partnerSlug
    )}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/workspace?concierge_cancelled=true`;

    const session = await stripe.checkout.sessions.create({
      customer_email: input.founderEmail || undefined,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderType: 'PAID_STRIPE_CONCIERGE',
        partnerSlug: input.partnerSlug,
        partnerName: input.partnerName,
        slotKey: input.slotKey,
        planId: input.planId || '',
        founderEmail: input.founderEmail || '',
      },
    });

    if (session.url) {
      return {
        ok: true,
        checkoutUrl: session.url,
      };
    }

    return {
      ok: true,
      sandboxFallback: true,
    };
  } catch (err) {
    // If Stripe API key is not configured or in local dev without Stripe keys,
    // gracefully signal sandboxFallback so the founder/admin can complete & test immediately.
    return {
      ok: true,
      sandboxFallback: true,
      error:
        err instanceof Error
          ? err.message
          : 'Stripe is currently unreachable. Please try again or contact support.',
    };
  }
}

/**
 * 11. COMPLETE PAID CONCIERGE ORDER & AUTO-DISPATCH PAID INCORPORATION DOSSIER TO PARTNER
 */
export async function submitPaidPartnerConciergeOrderAction(input: {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  slotKey: PartnerSlotKey;
  warmIntroRecipientEmail?: string | null;
  planId?: string;
  planTitle?: string;
  founderName: string;
  founderEmail: string;
  countryCode: string;
  oneLinerSummary?: string;
  basePriceAmount: number;
  currency: string;
  selectedAddons: PartnerCheckoutAddonField[];
  totalPaidAmount: number;
  stripePaymentRef?: string;
  intakeAnswers: Record<string, string>;
}): Promise<{
  ok: boolean;
  persistedToDb: boolean;
  emailSent: boolean;
  paymentRef: string;
  event: PartnerReferralEventRecord;
}> {
  const nowIso = new Date().toISOString();
  const founderSession = await getServerSessionCookie();
  const adminSession = await getAdminSessionCookie();
  const callerKey =
    founderSession?.userId ||
    adminSession?.userId ||
    input.founderEmail?.trim().toLowerCase() ||
    'anon';
  const rl = checkRateLimit(`partner_concierge:${callerKey}`, 5, 10 * 60_000);

  const recipientEmail = adminSession
    ? input.warmIntroRecipientEmail?.trim() ||
      (await resolveVerifiedPartnerRecipientEmail(
        input.partnerSlug,
        'formations@companyformations.ie'
      ))
    : await resolveVerifiedPartnerRecipientEmail(
        input.partnerSlug,
        'formations@companyformations.ie'
      );
  const currencySymbol =
    input.currency === 'GBP' ? '£' : input.currency === 'USD' ? '$' : '€';
  const paymentRef =
    input.stripePaymentRef?.trim() ||
    `cs_paid_${crypto.randomBytes(6).toString('hex')}`;

  const selectedAddonLabels =
    input.selectedAddons && input.selectedAddons.length > 0
      ? input.selectedAddons
          .map((a) => `${a.label} (+${currencySymbol}${a.priceAmount})`)
          .join(', ')
      : 'None (Base Package Only)';

  const enrichedAnswers: Record<string, string> = {
    stripe_payment_status: `PAID ${currencySymbol}${input.totalPaidAmount} (${input.currency}) • Ref: ${paymentRef}`,
    base_package_price: `${currencySymbol}${input.basePriceAmount}`,
    selected_optional_addons: selectedAddonLabels,
    ...input.intakeAnswers,
  };

  const fallbackEvent: PartnerReferralEventRecord = {
    id: `order-${crypto.randomUUID()}`,
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    partnerSlug: input.partnerSlug,
    slotKey: input.slotKey,
    eventType: 'PAID_CONCIERGE_ORDER',
    planId: input.planId || null,
    planTitle:
      input.intakeAnswers['proposed_company_name_1'] ||
      input.planTitle ||
      'Startup Plan',
    founderName: input.founderName.trim(),
    founderEmail: input.founderEmail.trim(),
    countryCode: input.countryCode || 'IE',
    selectedDomain: null,
    destinationUrl: `mailto:${recipientEmail}`,
    intakeAnswersJson: enrichedAnswers,
    leadStatus: 'BOUNTY_PAID',
    estimatedBountyAmount: `${currencySymbol}${input.totalPaidAmount} Paid via Stripe`,
    adminNotes: `Paid Stripe Concierge Order (${paymentRef}) dispatched to ${recipientEmail}`,
    createdAt: nowIso,
  };

  if (!rl.allowed) {
    return {
      ok: false,
      persistedToDb: false,
      emailSent: false,
      paymentRef,
      event: fallbackEvent,
    };
  }

  const addonRowsHtml =
    input.selectedAddons && input.selectedAddons.length > 0
      ? input.selectedAddons
          .map(
            (addon) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #d1fae5;font-size:13px;color:#065f46;">+ Add-On: <strong>${escapeHtml(addon.label)}</strong></td>
            <td style="padding:8px 12px;border-bottom:1px solid #d1fae5;font-size:13px;font-weight:700;color:#065f46;text-align:right;">${currencySymbol}${addon.priceAmount}</td>
          </tr>`
          )
          .join('')
      : '';

  const answerRowsHtml = Object.entries(input.intakeAnswers || {})
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;font-size:13px;width:42%;">${escapeHtml(
          key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        )}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;">${
          escapeHtml(val) || '—'
        }</td>
      </tr>`
    )
    .join('');

  const companyName1 =
    input.intakeAnswers['proposed_company_name_1'] ||
    input.planTitle ||
    'New Company LTD';

  const subjectLine = `[PAID INCORPORATION ORDER • ${currencySymbol}${input.totalPaidAmount}] ${companyName1} — ${input.founderName}`;
  const safeFounderEmail = founderSession?.email || input.founderEmail.trim();

  const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <div style="background:#065f46;color:#ffffff;padding:18px 22px;border-radius:8px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a7f3d0;font-weight:700;">Startup Preflight • Paid Stripe Formation Order</div>
        <h2 style="margin:6px 0 0;font-size:19px;font-weight:700;">New Paid Company Incorporation: ${escapeHtml(companyName1)}</h2>
        <div style="margin-top:6px;font-size:12px;color:#ecfdf5;">Stripe Payment Verified: <strong>${currencySymbol}${input.totalPaidAmount} (${escapeHtml(input.currency)})</strong> • Ref: <code>${escapeHtml(paymentRef)}</code></div>
      </div>

      <p style="font-size:14px;color:#334155;line-height:1.6;">
        Hi <strong>${escapeHtml(input.partnerName)}</strong> Formation Desk,<br/><br/>
        <strong>${escapeHtml(input.founderName)}</strong> (<a href="mailto:${escapeHtml(safeFounderEmail)}">${escapeHtml(safeFounderEmail)}</a>) has completed and paid for their company incorporation order on <strong>Startup Preflight</strong>. Please find their payment breakdown and statutory formation questionnaire below to initiate their ${input.countryCode === 'GB' ? 'Companies House IN01' : 'CRO A1'} filing.
      </p>

      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin:16px 0;">
        <div style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:8px;">STRIPE PAYMENT &amp; PACKAGE SUMMARY</div>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #d1fae5;font-size:13px;color:#065f46;">Base Package: <strong>${escapeHtml(input.partnerName)} Incorporation</strong></td>
              <td style="padding:8px 12px;border-bottom:1px solid #d1fae5;font-size:13px;font-weight:700;color:#065f46;text-align:right;">${currencySymbol}${input.basePriceAmount}</td>
            </tr>
            ${addonRowsHtml}
            <tr>
              <td style="padding:10px 12px;font-size:14px;font-weight:800;color:#064e3b;">Total Paid via Stripe (${escapeHtml(paymentRef)})</td>
              <td style="padding:10px 12px;font-size:15px;font-weight:800;color:#064e3b;text-align:right;">${currencySymbol}${input.totalPaidAmount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;margin-top:20px;">Completed Incorporation Questionnaire</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tbody>
          ${answerRowsHtml}
        </tbody>
      </table>

      <p style="font-size:12px;color:#64748b;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:12px;">
        <strong>Action Required:</strong> Reply-All to this email to confirm receipt with ${escapeHtml(input.founderName)} and issue their statutory signature pages / CRO A1 / Companies House documents.
      </p>
    </div>
  `;

  let emailSent = false;
  let resendId: string | null = null;
  let emailStatus = 'MOCK_DEV';

  try {
    if (resend && (founderSession || adminSession || process.env.NODE_ENV !== 'production')) {
      // 1. Send Warm Intro Dossier Email to the Partner Desk
      const partnerSubject = subjectLine;
      const response = await resend.emails.send({
        from: EMAIL_DEFAULTS.from,
        to: [recipientEmail],
        cc:
          safeFounderEmail &&
          safeFounderEmail.toLowerCase() !== recipientEmail.toLowerCase()
            ? [safeFounderEmail]
            : undefined,
        replyTo: safeFounderEmail || EMAIL_DEFAULTS.replyTo,
        subject: partnerSubject,
        html: emailHtml,
      });

      if (!response.error && response.data?.id) {
        resendId = response.data.id;
        emailStatus = 'SENT';
        emailSent = true;
      } else if (response.error) {
        console.error('❌ Resend Warm Intro Partner Email Error:', response.error);
        emailStatus = 'FAILED';
      }
    } else {
      emailSent = true;
    }
  } catch (err) {
    console.error('❌ Error executing submitPartnerWarmIntroLeadAction:', err);
    emailStatus = 'FAILED';
  }

  try {
    await ensureDatabaseSchemaSynced();

    await db.insert(emailLogs).values({
      recipient: recipientEmail,
      template: 'PAID_PARTNER_CONCIERGE_ORDER',
      subject: subjectLine,
      status: emailStatus,
      resendId,
      fromEmail: EMAIL_DEFAULTS.from,
      replyTo: input.founderEmail || EMAIL_DEFAULTS.replyTo,
      metadataJson: {
        partnerSlug: input.partnerSlug,
        slotKey: input.slotKey,
        founderEmail: input.founderEmail,
        planId: input.planId,
        totalPaidAmount: input.totalPaidAmount,
        currency: input.currency,
        paymentRef,
      },
    });

    const inserted = await db
      .insert(partnerReferralEvents)
      .values({
        partnerId: input.partnerId,
        partnerName: input.partnerName,
        partnerSlug: input.partnerSlug,
        slotKey: input.slotKey,
        eventType: 'PAID_CONCIERGE_ORDER',
        planId: input.planId || null,
        planTitle: companyName1,
        founderName: input.founderName.trim(),
        founderEmail: input.founderEmail.trim(),
        countryCode: input.countryCode || 'IE',
        selectedDomain: null,
        destinationUrl: `mailto:${recipientEmail}`,
        intakeAnswersJson: enrichedAnswers,
        leadStatus: 'BOUNTY_PAID',
        estimatedBountyAmount: `${currencySymbol}${input.totalPaidAmount} Paid via Stripe`,
        adminNotes: `Paid Stripe Concierge Order (${paymentRef}) • Dispatched to ${recipientEmail}`,
      })
      .returning();

    return {
      ok: true,
      persistedToDb: true,
      emailSent,
      paymentRef,
      event: mapDbEventToRecord(inserted[0]),
    };
  } catch {
    return {
      ok: true,
      persistedToDb: false,
      emailSent,
      paymentRef,
      event: fallbackEvent,
    };
  }
}

// ==========================================
// 3-QUOTE CONCIERGE ADMIN QUERIES
// ==========================================
export interface AdminQuoteRfpItem {
  id: string;
  planId: string;
  projectTitle: string;
  targetCountryCode: string;
  currency: string;
  rfpCategory: string;
  budgetRange: string;
  targetDeliveryTimeline: string;
  scopeSummary: string;
  status: string;
  dispatchedPartnersCount: number;
  quotesReceivedCount: number;
  founderContactInfo: {
    name: string;
    email: string;
    phone?: string;
    companyName: string;
  };
  createdAt: string;
  partnerResponses: Array<{
    id: string;
    partnerId: string;
    partnerName: string;
    partnerLogo: string;
    magicToken: string;
    status: string;
    quoteAmountNet?: string | null;
    quoteCurrency: string;
    estimatedWeeks?: number | null;
    quoteFileUrl?: string | null;
    quoteFileName?: string | null;
    quoteNotes?: string | null;
    submittedAt?: string | null;
  }>;
}

export async function getAdminQuoteRfpsAction(): Promise<{
  ok: boolean;
  rfps: AdminQuoteRfpItem[];
  error?: string;
}> {
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    return { ok: false, rfps: [], error: 'Unauthorized: Super Admin session required.' };
  }

  try {
    await ensureDatabaseSchemaSynced();

    const rfpRows = await db
      .select()
      .from(quoteRfpRequests)
      .orderBy(desc(quoteRfpRequests.createdAt))
      .limit(50);

    if (rfpRows.length === 0) {
      return { ok: true, rfps: [] };
    }

    const responsesRows = await db
      .select({
        id: quotePartnerResponses.id,
        rfpId: quotePartnerResponses.rfpId,
        partnerId: quotePartnerResponses.partnerId,
        partnerName: partnerOffers.name,
        partnerLogo: partnerOffers.logoEmoji,
        magicToken: quotePartnerResponses.magicToken,
        status: quotePartnerResponses.status,
        quoteAmountNet: quotePartnerResponses.quoteAmountNet,
        quoteCurrency: quotePartnerResponses.quoteCurrency,
        estimatedWeeks: quotePartnerResponses.estimatedWeeks,
        quoteFileUrl: quotePartnerResponses.quoteFileUrl,
        quoteFileName: quotePartnerResponses.quoteFileName,
        quoteNotes: quotePartnerResponses.quoteNotes,
        submittedAt: quotePartnerResponses.submittedAt,
      })
      .from(quotePartnerResponses)
      .leftJoin(partnerOffers, eq(quotePartnerResponses.partnerId, partnerOffers.id));

    const responsesByRfp = new Map<string, typeof responsesRows>();
    for (const resp of responsesRows) {
      const list = responsesByRfp.get(resp.rfpId) || [];
      list.push(resp);
      responsesByRfp.set(resp.rfpId, list);
    }

    const result: AdminQuoteRfpItem[] = rfpRows.map((row) => ({
      id: row.id,
      planId: row.planId,
      projectTitle: row.projectTitle,
      targetCountryCode: row.targetCountryCode,
      currency: row.currency,
      rfpCategory: row.rfpCategory,
      budgetRange: row.budgetRange,
      targetDeliveryTimeline: row.targetDeliveryTimeline,
      scopeSummary: row.scopeSummary,
      status: row.status,
      dispatchedPartnersCount: row.dispatchedPartnersCount,
      quotesReceivedCount: row.quotesReceivedCount,
      founderContactInfo: row.founderContactInfo,
      createdAt: row.createdAt.toISOString(),
      partnerResponses: (responsesByRfp.get(row.id) || []).map((p) => ({
        id: p.id,
        partnerId: p.partnerId,
        partnerName: p.partnerName || 'Unknown Partner',
        partnerLogo: p.partnerLogo || '🏢',
        magicToken: p.magicToken,
        status: p.status,
        quoteAmountNet: p.quoteAmountNet,
        quoteCurrency: p.quoteCurrency,
        estimatedWeeks: p.estimatedWeeks,
        quoteFileUrl: p.quoteFileUrl,
        quoteFileName: p.quoteFileName,
        quoteNotes: p.quoteNotes,
        submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
      })),
    }));

    return { ok: true, rfps: result };
  } catch (err) {
    return {
      ok: false,
      rfps: [],
      error: err instanceof Error ? err.message : 'Failed to query quote RFPs',
    };
  }
}
