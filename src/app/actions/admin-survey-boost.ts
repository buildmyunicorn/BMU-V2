'use server';

import { db } from '@/db';
import {
  surveyBoostPricingTiers,
  surveyBoostOrders,
  surveyResponses,
  validationSurveys,
  startupPlans,
  users,
} from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { ProlificService } from '@/lib/panels/prolific-service';

export interface AdminSurveyBoostData {
  stats: {
    totalOrders: number;
    totalRevenueEur: number;
    totalDeliveredResponses: number;
    activeOrdersCount: number;
  };
  orders: any[];
  tiers: any[];
  prolificAccount: any;
}

/**
 * Fetch all survey boost orders, tiers, and live Prolific account telemetry
 */
export async function getAdminSurveyBoostDataAction(): Promise<{
  success: boolean;
  data?: AdminSurveyBoostData;
  error?: string;
}> {
  try {
    const [tiers, orders] = await Promise.all([
      db
        .select()
        .from(surveyBoostPricingTiers)
        .orderBy(surveyBoostPricingTiers.displayOrder),
      db
        .select({
          order: surveyBoostOrders,
          surveyTitle: validationSurveys.title,
          surveySlug: validationSurveys.publicSlug,
          planTitle: startupPlans.title,
          userEmail: users.email,
          userName: users.name,
        })
        .from(surveyBoostOrders)
        .leftJoin(
          validationSurveys,
          eq(surveyBoostOrders.surveyId, validationSurveys.id)
        )
        .leftJoin(startupPlans, eq(surveyBoostOrders.planId, startupPlans.id))
        .leftJoin(users, eq(surveyBoostOrders.userId, users.id))
        .orderBy(desc(surveyBoostOrders.createdAt)),
    ]);

    // Calculate revenue & stats
    const totalOrders = orders.length;
    const totalDeliveredResponses = orders.reduce(
      (sum, o) => sum + (o.order.deliveredResponses || 0),
      0
    );
    const totalRevenueEur =
      orders
        .filter((o) => o.order.status !== 'PENDING_PAYMENT')
        .reduce((sum, o) => sum + (o.order.amountPaidCents || 0), 0) / 100;

    const activeOrdersCount = orders.filter(
      (o) =>
        o.order.status === 'PAID' ||
        o.order.status === 'DISPATCHED_TO_PANEL' ||
        o.order.status === 'PARTIALLY_DELIVERED'
    ).length;

    // Check Prolific account info
    const prolificRes = await ProlificService.getAccountDetails();

    return {
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenueEur,
          totalDeliveredResponses,
          activeOrdersCount,
        },
        orders: orders.map((o) => ({
          ...o.order,
          surveyTitle: o.surveyTitle,
          surveySlug: o.surveySlug,
          planTitle: o.planTitle,
          userEmail: o.userEmail,
          userName: o.userName,
        })),
        tiers,
        prolificAccount: prolificRes.success ? prolificRes.account : null,
      },
    };
  } catch (err: unknown) {
    console.error('[getAdminSurveyBoostDataAction] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update pricing, turnaround, or active status of a Survey Response Pack
 */
export async function updateAdminSurveyBoostTierAction(input: {
  id: string;
  tierName: string;
  responseCount: number;
  priceEurCents: number;
  priceGbpCents: number;
  priceUsdCents: number;
  turnaroundHours: number;
  badgeLabel?: string | null;
  description: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(surveyBoostPricingTiers)
      .set({
        tierName: input.tierName,
        responseCount: input.responseCount,
        priceEurCents: input.priceEurCents,
        priceGbpCents: input.priceGbpCents,
        priceUsdCents: input.priceUsdCents,
        turnaroundHours: input.turnaroundHours,
        badgeLabel: input.badgeLabel || null,
        description: input.description,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(surveyBoostPricingTiers.id, input.id));

    return { success: true };
  } catch (err: unknown) {
    console.error('[updateAdminSurveyBoostTierAction] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Dispatch an order to Prolific programmatically with 1 click
 */
export async function dispatchOrderToProlificAction(orderId: string): Promise<{
  success: boolean;
  studyId?: string;
  error?: string;
}> {
  try {
    const [order] = await db
      .select({
        order: surveyBoostOrders,
        surveySlug: validationSurveys.publicSlug,
        surveyTitle: validationSurveys.title,
      })
      .from(surveyBoostOrders)
      .leftJoin(
        validationSurveys,
        eq(surveyBoostOrders.surveyId, validationSurveys.id)
      )
      .where(eq(surveyBoostOrders.id, orderId as any))
      .limit(1);

    if (!order || !order.surveySlug) {
      return { success: false, error: 'Order or survey slug not found.' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://startuppreflight.com';
    const completionCode = `SPF_${order.order.id.slice(0, 8).toUpperCase()}`;
    const externalStudyUrl = `${appUrl}/v/${order.surveySlug}?src=prolific&order_id=${order.order.id}&prolific_pid={{%PROLIFIC_PID%}}&session_id={{%SESSION_ID%}}`;

    const demo = (order.order.targetDemographicsJson as any) || {};

    const createRes = await ProlificService.createStudy({
      name: `${order.surveyTitle || 'Startup Concept'} Validation Survey`,
      description: `Short 3-minute validation study for an early-stage venture. Please answer honestly.`,
      externalStudyUrl,
      totalAvailablePlaces: order.order.targetResponses,
      targetCountryCode: (order.order.targetCountryCode as any) || 'IE',
      completionCode,
    });

    if (!createRes.success || !createRes.study) {
      return { success: false, error: createRes.error };
    }

    // Update order with study details
    await db
      .update(surveyBoostOrders)
      .set({
        panelProvider: 'PROLIFIC',
        panelSurveyId: createRes.study.id,
        panelStatus: createRes.study.status,
        status: 'DISPATCHED_TO_PANEL',
        dispatchedAt: new Date(),
        adminNotes: `Prolific Study Created: ${createRes.study.id} (${createRes.study.status}). Completion Code: ${completionCode}`,
      })
      .where(eq(surveyBoostOrders.id, orderId as any));

    return { success: true, studyId: createRes.study.id };
  } catch (err: unknown) {
    console.error('[dispatchOrderToProlificAction] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Manually update status or delivered count for an order
 */
export async function updateSurveyBoostOrderStatusAction(input: {
  orderId: string;
  status: string;
  deliveredResponses?: number;
  adminNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status: input.status,
    };
    if (input.deliveredResponses !== undefined) {
      updateData.deliveredResponses = input.deliveredResponses;
    }
    if (input.adminNotes !== undefined) {
      updateData.adminNotes = input.adminNotes;
    }
    if (input.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    await db
      .update(surveyBoostOrders)
      .set(updateData)
      .where(eq(surveyBoostOrders.id, input.orderId as any));

    return { success: true };
  } catch (err: unknown) {
    console.error('[updateSurveyBoostOrderStatusAction] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
