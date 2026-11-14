'use server';

import crypto from 'crypto';
import { desc, eq, and, inArray } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  quoteRfpRequests,
  quotePartnerResponses,
  partnerOffers,
  partnerReferralEvents,
  startupPlans,
} from '@/db';
import type {
  QuoteRfpWorkPackageItem,
  QuoteRfpFounderContact,
} from '@/db/schema';
import {
  verifyActiveSessionAndPlanOwnership,
  getTrustedClientIp,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import { sendSystemEmail } from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';
import type { QuoteSupplierCategory } from '@/lib/partners/partner-catalog-store';

/**
 * 1. Founder Action: Submits standardized RFP from Module D or Module E.
 * Auto-matches top 3 active suppliers, generates cryptographic magic tokens,
 * and sends automated emails via Resend.
 */
export async function submitThreeQuoteRfpAction(input: {
  planId: string;
  sourceModule: 'MOD_D_PRODUCT_BUILD' | 'MOD_E_OPERATIONS';
  rfpCategory: QuoteSupplierCategory;
  projectTitle: string;
  budgetRange: string;
  targetDeliveryTimeline: string;
  scopeSummary: string;
  workPackages: QuoteRfpWorkPackageItem[];
  founderContact: QuoteRfpFounderContact;
  equipmentItemName?: string;
}): Promise<{
  ok: boolean;
  rfpId?: string;
  dispatchedCount?: number;
  partnerNames?: string[];
  error?: string;
}> {
  try {
    if (!input.planId || !/^[0-9a-f-]{36}$/i.test(input.planId)) {
      return { ok: false, error: 'Valid startup plan ID required.' };
    }
    const targetMod =
      input.sourceModule === 'MOD_E_OPERATIONS'
        ? 'MOD_E_OPERATIONS'
        : 'MOD_D_PRODUCT_BUILD';
    const verified = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requiredModule: targetMod,
      requireWrite: true,
    });
    if (!verified || !verified.authorized || !verified.userId) {
      return {
        ok: false,
        error: verified?.reason || 'Unauthorized: Access to this plan is restricted.',
      };
    }

    const rfpRl = checkRateLimit(`quote_rfp_submit:${verified.userId}`, 6, 15 * 60_000);
    if (!rfpRl.allowed) {
      return {
        ok: false,
        error: 'Too many RFP dispatches in a short window. Please wait a few minutes.',
      };
    }

    const verifiedFounderEmail = verified.email || input.founderContact.email;

    await ensureDatabaseSchemaSynced();

    // 1. Fetch Plan localization
    const [plan] = await db
      .select({
        id: startupPlans.id,
        title: startupPlans.title,
        ownerUserId: startupPlans.ownerUserId,
        hqCountryCode: startupPlans.hqCountryCode,
        baseCurrency: startupPlans.baseCurrency,
      })
      .from(startupPlans)
      .where(eq(startupPlans.id, input.planId))
      .limit(1);

    if (!plan) {
      return { ok: false, error: 'Plan not found.' };
    }

    const countryCode = plan.hqCountryCode || 'IE';
    const currency = plan.baseCurrency || (countryCode === 'GB' ? 'GBP' : 'EUR');
    const founderUserId = verified.userId || plan.ownerUserId;

    // 2. Query available active suppliers for this category & country
    const allSuppliers = await db
      .select()
      .from(partnerOffers)
      .where(
        and(
          eq(partnerOffers.isActive, true),
          eq(partnerOffers.isSupplierPartner, true),
          eq(partnerOffers.supplierCategory, input.rfpCategory)
        )
      );

    // Filter by country scope: 'ALL' or matching countryCode
    const eligibleSuppliers = allSuppliers.filter(
      (s) => s.countryScope === 'ALL' || s.countryScope === countryCode
    );

    // Pick up to 3 suppliers (sorted by least recently dispatched to balance load)
    const selectedPartners = [...eligibleSuppliers]
      .sort((a, b) => {
        const aDispatched = a.rfpsDispatchedThisMonth || 0;
        const bDispatched = b.rfpsDispatchedThisMonth || 0;
        return aDispatched - bDispatched;
      })
      .slice(0, 3);

    // 3. Insert quote_rfp_requests
    const [rfp] = await db
      .insert(quoteRfpRequests)
      .values({
        planId: plan.id,
        founderUserId,
        rfpCategory: input.rfpCategory,
        targetCountryCode: countryCode,
        currency,
        projectTitle: input.projectTitle.trim() || plan.title,
        budgetRange: input.budgetRange,
        targetDeliveryTimeline: input.targetDeliveryTimeline,
        scopeSummary: input.scopeSummary,
        workPackagesJson: input.workPackages,
        founderContactInfo: input.founderContact,
        sourceModule: input.sourceModule,
        equipmentItemName: input.equipmentItemName || null,
        status: 'DISPATCHED',
        dispatchedPartnersCount: selectedPartners.length,
        quotesReceivedCount: 0,
      })
      .returning();

    // 4. For each selected partner, generate secure magic token and response row
    const partnerNames: string[] = [];
    const appUrl = EMAIL_DEFAULTS.appUrl;

    for (const partner of selectedPartners) {
      partnerNames.push(partner.name);
      const magicToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 21 days TTL

      await db.insert(quotePartnerResponses).values({
        rfpId: rfp.id,
        partnerId: partner.id,
        magicToken,
        tokenExpiresAt: expiresAt,
        status: 'SENT',
        quoteCurrency: currency,
      });

      // Update partner monthly dispatch count
      await db
        .update(partnerOffers)
        .set({
          rfpsDispatchedThisMonth: (partner.rfpsDispatchedThisMonth || 0) + 1,
          lastRfpDispatchedAt: new Date(),
        })
        .where(eq(partnerOffers.id, partner.id));

      // Log referral lead event
      await db.insert(partnerReferralEvents).values({
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        slotKey: partner.slotKey,
        eventType: 'WARM_INTRO_LEAD',
        planId: plan.id,
        planTitle: plan.title,
        founderName: input.founderContact.name,
        founderEmail: input.founderContact.email,
        countryCode,
        destinationUrl: `${appUrl}/quotes/submit/${magicToken}`,
        intakeAnswersJson: {
          projectTitle: input.projectTitle,
          budgetRange: input.budgetRange,
          timeline: input.targetDeliveryTimeline,
          rfpCategory: input.rfpCategory,
        },
        leadStatus: 'INTRO_SENT',
        estimatedBountyAmount: partner.commissionBountySummary || '€75 qualified lead fee',
        adminNotes: `Automated 3-Quote RFP dispatch (${rfp.id}) to ${partner.dispatchEmail || partner.warmIntroRecipientEmail}`,
      });

      // Send dispatch email to partner
      const targetInbox =
        partner.dispatchEmail ||
        partner.warmIntroRecipientEmail ||
        'quotes@startuppreflight.com';

      const magicPortalUrl = `${appUrl}/quotes/submit/${magicToken}`;

      await sendSystemEmail({
        to: targetInbox,
        template: 'QUOTE_RFP_PARTNER_INVITE',
        subject: `[New Project RFP] ${input.projectTitle} (${countryCode}) — Quote Request`,
        props: {
          partnerName: partner.name,
          projectTitle: input.projectTitle,
          category: input.rfpCategory,
          countryCode,
          currency,
          budgetRange: input.budgetRange,
          targetTimeline: input.targetDeliveryTimeline,
          scopeSummary: input.scopeSummary,
          workPackagesCount: input.workPackages.length,
          magicPortalUrl,
        },
      });
    }

    // 5. Send confirmation receipt to the founder
    const workspaceUrl = `${appUrl}/workspace?planId=${plan.id}&module=${input.sourceModule}`;

    await sendSystemEmail({
      to: verifiedFounderEmail,
      template: 'QUOTE_RFP_FOUNDER_RECEIPT',
      subject: `⚡ 3-Quote Request Dispatched for "${input.projectTitle}"`,
      props: {
        founderName: input.founderContact.name,
        planTitle: plan.title,
        projectTitle: input.projectTitle,
        category: input.rfpCategory,
        currency,
        budgetRange: input.budgetRange,
        partnersCount: selectedPartners.length,
        partnerNames,
        workspaceUrl,
      },
    });

    return {
      ok: true,
      rfpId: rfp.id,
      dispatchedCount: selectedPartners.length,
      partnerNames,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to dispatch 3-Quote RFP',
    };
  }
}

/**
 * 2. Magic Link Portal: Loads RFP brief for a partner via their secure magic token.
 * Unauthenticated (secured by high-entropy token).
 */
export async function getQuoteRfpByTokenAction(token: string): Promise<{
  ok: boolean;
  rfp?: {
    id: string;
    projectTitle: string;
    rfpCategory: string;
    targetCountryCode: string;
    currency: string;
    budgetRange: string;
    targetDeliveryTimeline: string;
    scopeSummary: string;
    workPackages: QuoteRfpWorkPackageItem[];
    founderName: string;
    founderCompany: string;
    equipmentItemName?: string | null;
  };
  partner?: {
    id: string;
    name: string;
    logoEmoji: string;
    category: string;
  };
  response?: {
    id: string;
    status: string;
    quoteAmountNet?: string | null;
    quoteCurrency: string;
    estimatedWeeks?: number | null;
    quoteFileUrl?: string | null;
    quoteFileName?: string | null;
    quoteNotes?: string | null;
    submittedAt?: string | null;
  };
  isExpired?: boolean;
  error?: string;
}> {
  try {
    await ensureDatabaseSchemaSynced();

    const [respRow] = await db
      .select({
        responseId: quotePartnerResponses.id,
        magicToken: quotePartnerResponses.magicToken,
        tokenExpiresAt: quotePartnerResponses.tokenExpiresAt,
        status: quotePartnerResponses.status,
        quoteAmountNet: quotePartnerResponses.quoteAmountNet,
        quoteCurrency: quotePartnerResponses.quoteCurrency,
        estimatedWeeks: quotePartnerResponses.estimatedWeeks,
        quoteFileUrl: quotePartnerResponses.quoteFileUrl,
        quoteFileName: quotePartnerResponses.quoteFileName,
        quoteNotes: quotePartnerResponses.quoteNotes,
        submittedAt: quotePartnerResponses.submittedAt,
        rfpId: quotePartnerResponses.rfpId,
        partnerId: quotePartnerResponses.partnerId,
        // RFP fields
        projectTitle: quoteRfpRequests.projectTitle,
        rfpCategory: quoteRfpRequests.rfpCategory,
        targetCountryCode: quoteRfpRequests.targetCountryCode,
        currency: quoteRfpRequests.currency,
        budgetRange: quoteRfpRequests.budgetRange,
        targetDeliveryTimeline: quoteRfpRequests.targetDeliveryTimeline,
        scopeSummary: quoteRfpRequests.scopeSummary,
        workPackagesJson: quoteRfpRequests.workPackagesJson,
        founderContactInfo: quoteRfpRequests.founderContactInfo,
        equipmentItemName: quoteRfpRequests.equipmentItemName,
        // Partner fields
        partnerName: partnerOffers.name,
        partnerLogo: partnerOffers.logoEmoji,
        partnerCategory: partnerOffers.category,
      })
      .from(quotePartnerResponses)
      .innerJoin(quoteRfpRequests, eq(quotePartnerResponses.rfpId, quoteRfpRequests.id))
      .innerJoin(partnerOffers, eq(quotePartnerResponses.partnerId, partnerOffers.id))
      .where(eq(quotePartnerResponses.magicToken, token))
      .limit(1);

    if (!respRow) {
      return { ok: false, error: 'Invalid or expired quotation link.' };
    }

    const isExpired = new Date() > respRow.tokenExpiresAt;

    // Mark as OPENED if first time view
    if (respRow.status === 'SENT') {
      await db
        .update(quotePartnerResponses)
        .set({
          status: 'OPENED',
          openedAt: new Date(),
        })
        .where(eq(quotePartnerResponses.id, respRow.responseId));
    }

    return {
      ok: true,
      isExpired,
      rfp: {
        id: respRow.rfpId,
        projectTitle: respRow.projectTitle,
        rfpCategory: respRow.rfpCategory,
        targetCountryCode: respRow.targetCountryCode,
        currency: respRow.currency,
        budgetRange: respRow.budgetRange,
        targetDeliveryTimeline: respRow.targetDeliveryTimeline,
        scopeSummary: respRow.scopeSummary,
        workPackages: (respRow.workPackagesJson as QuoteRfpWorkPackageItem[]) || [],
        founderName: respRow.founderContactInfo.name,
        founderCompany: respRow.founderContactInfo.companyName,
        equipmentItemName: respRow.equipmentItemName,
      },
      partner: {
        id: respRow.partnerId,
        name: respRow.partnerName,
        logoEmoji: respRow.partnerLogo || '🏢',
        category: respRow.partnerCategory,
      },
      response: {
        id: respRow.responseId,
        status: respRow.status,
        quoteAmountNet: respRow.quoteAmountNet,
        quoteCurrency: respRow.quoteCurrency,
        estimatedWeeks: respRow.estimatedWeeks,
        quoteFileUrl: respRow.quoteFileUrl,
        quoteFileName: respRow.quoteFileName,
        quoteNotes: respRow.quoteNotes,
        submittedAt: respRow.submittedAt ? respRow.submittedAt.toISOString() : null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve RFP brief',
    };
  }
}

/**
 * 3. Magic Link Portal: Partner submits their official quote.
 * Updates quote_partner_responses, increments RFP counter, logs referral conversion,
 * auto-attaches to Module L Appendix C, and triggers Resend notification to founder!
 */
export async function submitQuoteResponseAction(input: {
  magicToken: string;
  quoteAmountNet: number;
  estimatedWeeks?: number;
  quoteNotes?: string;
  quoteFileUrl: string;
  quoteFileName: string;
}): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const cleanToken = (typeof input?.magicToken === 'string' ? input.magicToken : '').trim();
    if (!cleanToken || !/^[a-f0-9]{32,128}$/i.test(cleanToken)) {
      return { ok: false, error: 'Invalid quotation token format.' };
    }

    const clientIp = await getTrustedClientIp();
    const tokenRl = checkRateLimit(`quote_submit:${cleanToken}`, 5, 3_600_000);
    const ipRl = checkRateLimit(`quote_submit_ip:${clientIp}`, 12, 3_600_000);
    if (!tokenRl.allowed || !ipRl.allowed) {
      return { ok: false, error: 'Too many quote submission attempts. Please wait before retrying.' };
    }

    const netVal = Number(input.quoteAmountNet);
    if (!Number.isFinite(netVal) || netVal <= 0 || netVal > 10_000_000) {
      return { ok: false, error: 'Quote amount must be a valid positive number up to 10,000,000.' };
    }

    const weeksVal =
      input.estimatedWeeks !== undefined && input.estimatedWeeks !== null
        ? Math.max(1, Math.min(260, Math.round(Number(input.estimatedWeeks))))
        : null;

    const cleanNotes =
      typeof input.quoteNotes === 'string'
        ? input.quoteNotes.trim().slice(0, 5000) || null
        : null;

    const cleanFileUrl = typeof input.quoteFileUrl === 'string' ? input.quoteFileUrl.trim() : '';
    const isSafePdfDataUri =
      cleanFileUrl.length <= 21_000_000 &&
      /^data:application\/pdf;base64,[A-Za-z0-9+/=\s]+$/.test(cleanFileUrl);
    const isSafeHttpsUrl =
      cleanFileUrl.length <= 2048 && /^https:\/\/[^\s"'<>]+$/i.test(cleanFileUrl);

    if (!cleanFileUrl || (!isSafePdfDataUri && !isSafeHttpsUrl)) {
      return {
        ok: false,
        error: 'Quote attachment must be a valid PDF upload or HTTPS document link.',
      };
    }

    const cleanFileName =
      typeof input.quoteFileName === 'string'
        ? input.quoteFileName.replace(/[^\w.\- ()]/g, '_').slice(0, 180) || 'supplier-quote.pdf'
        : 'supplier-quote.pdf';

    await ensureDatabaseSchemaSynced();

    const [respRow] = await db
      .select({
        responseId: quotePartnerResponses.id,
        rfpId: quotePartnerResponses.rfpId,
        partnerId: quotePartnerResponses.partnerId,
        currency: quotePartnerResponses.quoteCurrency,
        tokenExpiresAt: quotePartnerResponses.tokenExpiresAt,
        status: quotePartnerResponses.status,
        // RFP & Founder
        planId: quoteRfpRequests.planId,
        projectTitle: quoteRfpRequests.projectTitle,
        founderContactInfo: quoteRfpRequests.founderContactInfo,
        sourceModule: quoteRfpRequests.sourceModule,
        // Partner
        partnerName: partnerOffers.name,
        partnerLogo: partnerOffers.logoEmoji,
      })
      .from(quotePartnerResponses)
      .innerJoin(quoteRfpRequests, eq(quotePartnerResponses.rfpId, quoteRfpRequests.id))
      .innerJoin(partnerOffers, eq(quotePartnerResponses.partnerId, partnerOffers.id))
      .where(eq(quotePartnerResponses.magicToken, cleanToken))
      .limit(1);

    if (!respRow) {
      return { ok: false, error: 'Quotation request token not found.' };
    }

    if (new Date() > respRow.tokenExpiresAt) {
      return { ok: false, error: 'This quote submission link has expired.' };
    }

    if (
      respRow.status === 'QUOTE_SUBMITTED' ||
      respRow.status === 'DECLINED' ||
      respRow.status === 'EXPIRED'
    ) {
      return {
        ok: false,
        error: 'An official quote has already been submitted for this invitation.',
      };
    }

    const netAmountStr = netVal.toFixed(2);
    const submittedDate = new Date();

    // 1. Update quote_partner_responses
    await db
      .update(quotePartnerResponses)
      .set({
        status: 'QUOTE_SUBMITTED',
        quoteAmountNet: netAmountStr,
        estimatedWeeks: weeksVal,
        quoteNotes: cleanNotes,
        quoteFileUrl: cleanFileUrl,
        quoteFileName: cleanFileName,
        submittedAt: submittedDate,
      })
      .where(eq(quotePartnerResponses.id, respRow.responseId));

    // 2. Increment quotes_received_count on the RFP request
    const existingResponses = await db
      .select()
      .from(quotePartnerResponses)
      .where(
        and(
          eq(quotePartnerResponses.rfpId, respRow.rfpId),
          eq(quotePartnerResponses.status, 'QUOTE_SUBMITTED')
        )
      );

    const receivedCount = existingResponses.length;

    await db
      .update(quoteRfpRequests)
      .set({
        quotesReceivedCount: receivedCount,
        status: receivedCount >= 3 ? 'COMPLETED' : 'QUOTES_IN_PROGRESS',
        updatedAt: new Date(),
      })
      .where(eq(quoteRfpRequests.id, respRow.rfpId));

    // 3. Auto-notify the founder via Resend Email (omit huge base64 data URIs from email href)
    const appUrl = EMAIL_DEFAULTS.appUrl;
    const workspaceUrl = `${appUrl}/workspace?planId=${respRow.planId}&module=${respRow.sourceModule}`;
    const emailSafeQuoteUrl = isSafeHttpsUrl ? cleanFileUrl : workspaceUrl;

    await sendSystemEmail({
      to: respRow.founderContactInfo.email,
      template: 'QUOTE_RECEIVED_FOUNDER',
      subject: `🎉 Quote Received: ${respRow.partnerName} quoted ${respRow.currency} ${netAmountStr} for ${respRow.projectTitle}`,
      props: {
        founderName: respRow.founderContactInfo.name,
        planTitle: respRow.projectTitle,
        partnerName: respRow.partnerName,
        partnerLogo: respRow.partnerLogo || '🏢',
        quoteAmountNet: netAmountStr,
        quoteCurrency: respRow.currency,
        estimatedWeeks: weeksVal ?? undefined,
        quoteNotes: cleanNotes ?? undefined,
        quoteFileUrl: emailSafeQuoteUrl,
        workspaceUrl,
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to submit quote',
    };
  }
}

/**
 * 4. Workspace Action: Query active quotes for a plan (used by Module D, Module E, and Module L)
 */
export async function getPlanQuotesAction(planId: string): Promise<{
  ok: boolean;
  rfps: Array<{
    id: string;
    projectTitle: string;
    rfpCategory: string;
    budgetRange: string;
    targetTimeline: string;
    status: string;
    sourceModule: string;
    quotesReceivedCount: number;
    createdAt: string;
    responses: Array<{
      id: string;
      partnerId: string;
      partnerName: string;
      partnerLogo: string;
      status: string;
      quoteAmountNet?: string | null;
      quoteCurrency: string;
      estimatedWeeks?: number | null;
      quoteFileUrl?: string | null;
      quoteFileName?: string | null;
      quoteNotes?: string | null;
      submittedAt?: string | null;
    }>;
  }>;
  error?: string;
}> {
  try {
    if (!planId || !/^[0-9a-f-]{36}$/i.test(planId)) {
      return { ok: false, rfps: [], error: 'Valid plan ID required.' };
    }
    const verified = await verifyActiveSessionAndPlanOwnership(planId);
    if (!verified || !verified.authorized || !verified.userId) {
      return { ok: false, rfps: [], error: verified?.reason || 'Unauthorized plan access.' };
    }

    await ensureDatabaseSchemaSynced();

    const rfpRows = await db
      .select()
      .from(quoteRfpRequests)
      .where(eq(quoteRfpRequests.planId, planId))
      .orderBy(desc(quoteRfpRequests.createdAt));

    if (rfpRows.length === 0) {
      return { ok: true, rfps: [] };
    }

    const rfpIds = rfpRows.map((r) => r.id);

    const responsesRows = await db
      .select({
        id: quotePartnerResponses.id,
        rfpId: quotePartnerResponses.rfpId,
        partnerId: quotePartnerResponses.partnerId,
        partnerName: partnerOffers.name,
        partnerLogo: partnerOffers.logoEmoji,
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
      .leftJoin(partnerOffers, eq(quotePartnerResponses.partnerId, partnerOffers.id))
      .where(inArray(quotePartnerResponses.rfpId, rfpIds));

    const responsesByRfp = new Map<string, typeof responsesRows>();
    for (const r of responsesRows) {
      const list = responsesByRfp.get(r.rfpId) || [];
      list.push(r);
      responsesByRfp.set(r.rfpId, list);
    }

    const rfps = rfpRows.map((r) => ({
      id: r.id,
      projectTitle: r.projectTitle,
      rfpCategory: r.rfpCategory,
      budgetRange: r.budgetRange,
      targetTimeline: r.targetDeliveryTimeline,
      status: r.status,
      sourceModule: r.sourceModule,
      quotesReceivedCount: r.quotesReceivedCount,
      createdAt: r.createdAt.toISOString(),
      responses: (responsesByRfp.get(r.id) || []).map((p) => ({
        id: p.id,
        partnerId: p.partnerId,
        partnerName: p.partnerName || 'Vetted Supplier',
        partnerLogo: p.partnerLogo || '🏢',
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

    return { ok: true, rfps };
  } catch (err) {
    return {
      ok: false,
      rfps: [],
      error: err instanceof Error ? err.message : 'Failed to query plan quotes',
    };
  }
}
