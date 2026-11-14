'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
  type BlindSpotItem,
} from '@/db';
import type {
  RevenueModelStep1Data,
  PricingTiersStep2Data,
  BreakevenCalculatorStep3Data,
  SalesAssumptionsStep4Data,
  RevenueBlindSpotAuditStep5Data,
  SavedModuleHData,
  SavedModuleFData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import type { SupportedCountryCode } from '@/lib/localization';
import { computeModuleFCompensationSchedule } from '@/lib/finance/cross-module-normalizer';
import {
  generatePricingStrategyJustificationViaRouter,
  type GeneratePricingStrategyJustificationResult,
  generateBreakevenAssessorNarrativeViaRouter,
  type GenerateBreakevenAssessorNarrativeResult,
  generateSalesAssumptionsNarrativeViaRouter,
  type GenerateSalesAssumptionsNarrativeResult,
  generateModuleHRevenueBriefViaRouter,
  type GenerateModuleHRevenueBriefResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleHEnumEnsured = false;

async function ensureModuleHEnumInPostgres(): Promise<void> {
  if (moduleHEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_H_REVENUE'`
    );
    moduleHEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module H Step 1 (Revenue Model & Monetization Vehicle) to `plan_modules_data`.
 */
export async function saveModuleHStep1RevenueModelAction(input: {
  planId: string;
  revenueModel: RevenueModelStep1Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: authCheck.reason || 'Unauthorized plan access' };
  }

  try {
    await ensureModuleHEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep1: RevenueModelStep1Data = {
      ...input.revenueModel,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step1RevenueModel: cleanStep1,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 20
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_H_REVENUE',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
      });
    }

    // Update active startup plan touch timestamp
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_H_STEP_1_REVENUE_MODEL',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.error('Error saving Module H Step 1:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Persists Module H Step 2 (Pricing Architecture & Tiers) to `plan_modules_data`.
 */
export async function saveModuleHStep2PricingTiersAction(input: {
  planId: string;
  pricingTiers: PricingTiersStep2Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: authCheck.reason || 'Unauthorized plan access' };
  }

  try {
    await ensureModuleHEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep2: PricingTiersStep2Data = {
      ...input.pricingTiers,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step2PricingTiers: cleanStep2,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 40
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_H_REVENUE',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_H_STEP_2_PRICING_TIERS',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.error('Error saving Module H Step 2:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Persists Module H Step 3 ("Pocket Profit" & 3-Year Breakeven Engine) to `plan_modules_data`.
 */
export async function saveModuleHStep3BreakevenCalculatorAction(input: {
  planId: string;
  breakevenCalculator: BreakevenCalculatorStep3Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: authCheck.reason || 'Unauthorized plan access' };
  }

  try {
    await ensureModuleHEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep3: BreakevenCalculatorStep3Data = {
      ...input.breakevenCalculator,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step3BreakevenCalculator: cleanStep3,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 60
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_H_REVENUE',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_H_STEP_3_BREAKEVEN_ENGINE',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.error('Error saving Module H Step 3:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * Fetches the canonical hiring & payroll baseline from Module F (Step 5)
 * to ensure 100% data sync with no discrepancies.
 */
export async function getCanonicalPayrollBaselineAction(input: {
  planId: string;
}): Promise<{
  ok: boolean;
  year1MonthlyPayroll: number;
  year2MonthlyPayroll: number;
  year3MonthlyPayroll: number;
  personalSurvivalBudgetMonthly: number;
  currency: string;
  sourceModuleFFound: boolean;
}> {
  if (!UUID_REGEX.test(input.planId)) {
    return {
      ok: true,
      year1MonthlyPayroll: 3500,
      year2MonthlyPayroll: 8500,
      year3MonthlyPayroll: 16000,
      personalSurvivalBudgetMonthly: 2500,
      currency: 'EUR',
      sourceModuleFFound: false,
    };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
  });
  if (!authCheck.authorized) {
    return {
      ok: false,
      year1MonthlyPayroll: 0,
      year2MonthlyPayroll: 0,
      year3MonthlyPayroll: 0,
      personalSurvivalBudgetMonthly: 0,
      currency: 'EUR',
      sourceModuleFFound: false,
    };
  }

  try {
    const [planRow] = await db
      .select({
        hqCountryCode: startupPlans.hqCountryCode,
        baseCurrency: startupPlans.baseCurrency,
      })
      .from(startupPlans)
      .where(eq(startupPlans.id, input.planId))
      .limit(1);

    const hqCountry = planRow?.hqCountryCode || 'IE';
    const baseCurrency = planRow?.baseCurrency || (hqCountry === 'GB' ? 'GBP' : 'EUR');

    const modFRecord = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    if (modFRecord.length === 0) {
      const defaultComp = computeModuleFCompensationSchedule(null, hqCountry);
      const y1 = defaultComp.years[1].monthlyTotalCompensationAvg;
      return {
        ok: true,
        year1MonthlyPayroll: y1,
        year2MonthlyPayroll: Math.round(y1 * 1.8),
        year3MonthlyPayroll: Math.round(y1 * 2.8),
        personalSurvivalBudgetMonthly: defaultComp.canonicalMonthlySurvivalTotal,
        currency: baseCurrency,
        sourceModuleFFound: false,
      };
    }

    const modFData = modFRecord[0].structuredInputsJsonb as SavedModuleFData;
    const comp = computeModuleFCompensationSchedule(modFData, hqCountry);
    const y1Monthly = comp.years[1].monthlyTotalCompensationAvg || comp.canonicalMonthlySurvivalTotal;
    const y2Monthly =
      comp.hasExplicitHiringRoles || comp.years[2].monthlyTotalCompensationAvg !== y1Monthly
        ? comp.years[2].monthlyTotalCompensationAvg
        : Math.round(y1Monthly * 1.8);
    const y3Monthly =
      comp.hasExplicitHiringRoles || comp.years[3].monthlyTotalCompensationAvg !== y1Monthly
        ? comp.years[3].monthlyTotalCompensationAvg
        : Math.round(y1Monthly * 2.8);

    return {
      ok: true,
      year1MonthlyPayroll: y1Monthly,
      year2MonthlyPayroll: y2Monthly,
      year3MonthlyPayroll: y3Monthly,
      personalSurvivalBudgetMonthly: comp.canonicalMonthlySurvivalTotal,
      currency: baseCurrency,
      sourceModuleFFound: true,
    };
  } catch (err) {
    console.error('Error fetching canonical payroll baseline:', err);
    return {
      ok: false,
      year1MonthlyPayroll: 3500,
      year2MonthlyPayroll: 8500,
      year3MonthlyPayroll: 16000,
      personalSurvivalBudgetMonthly: 2500,
      currency: 'EUR',
      sourceModuleFFound: false,
    };
  }
}

/**
 * Server action to generate an investor & grant-grade Pricing Strategy Justification
 * using rich cross-module intelligence (Mod A, B, C, D, H).
 */
export async function generatePricingStrategyJustificationAction(input: {
  planId: string;
  blendedAveragePrice: number;
  currencySymbol: string;
  revenueModelVehicle?: string;
  tiersSummary?: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  beachheadCustomer?: string;
  unfairAdvantage?: string;
}): Promise<GeneratePricingStrategyJustificationResult> {
  // Cross-module context aggregation from Cloud SQL / local Postgres
  let planTitle = input.planTitle || 'Startup Plan';
  let industryCategory = input.industryCategory || 'Technology';
  let hqCountryCode: SupportedCountryCode = input.hqCountryCode || 'IE';
  let primaryChannel = 'DIRECT_WEB_STRIPE';
  let estimatedBlendedFeePercent = 2.9;
  let beachheadCustomer = input.beachheadCustomer || '';
  let willingnessToPayInsights = '';
  let competitorPriceRange = '';
  let unfairAdvantage = input.unfairAdvantage || '';

  if (UUID_REGEX.test(input.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
        requiredModule: 'MOD_H_REVENUE',
      });
      if (authCheck.authorized) {
        const planRows = await db
          .select()
          .from(startupPlans)
          .where(eq(startupPlans.id, input.planId))
          .limit(1);

        if (planRows.length > 0) {
          planTitle = planRows[0].title || planTitle;
          industryCategory = planRows[0].industryCategory || industryCategory;
          hqCountryCode = (planRows[0].hqCountryCode as SupportedCountryCode) || hqCountryCode;
        }

        const modRows = await db
          .select()
          .from(planModulesData)
          .where(eq(planModulesData.planId, input.planId));

        // Module A context (Concept & Unfair Advantage)
        const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
        if (modA?.structuredInputsJsonb) {
          const aData = modA.structuredInputsJsonb as Record<string, any>;
          unfairAdvantage =
            aData.conceptCanvas?.unfairAdvantage ||
            aData.brainDumpText ||
            unfairAdvantage;
        }

        // Module B context (Beachhead persona & competitor positioning)
        const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
        if (modB?.structuredInputsJsonb) {
          const bData = modB.structuredInputsJsonb as Record<string, any>;
          beachheadCustomer =
            bData.step1BeachheadPersona?.personaTitle ||
            bData.step1BeachheadPersona?.demographicsSummary ||
            beachheadCustomer;
          if (bData.step2CompetitorScout?.competitors?.length) {
            const comps = bData.step2CompetitorScout.competitors
              .slice(0, 3)
              .map((c: any) => `${c.name} (${c.pricingSummary || 'Standard pricing'})`)
              .join(', ');
            competitorPriceRange = comps;
          }
        }

        // Module C context (Willingness-to-pay & customer feedback)
        const modC = modRows.find((m) => m.moduleCode === 'MOD_C_SURVEYS_FEEDBACK');
        if (modC?.structuredInputsJsonb) {
          const cData = modC.structuredInputsJsonb as Record<string, any>;
          if (cData.surveys?.[0]?.aiInsightsSummary) {
            willingnessToPayInsights =
              cData.surveys[0].aiInsightsSummary.commercialViabilityAssessment ||
              cData.surveys[0].aiInsightsSummary.executiveValidationSummary ||
              '';
          }
        }

        // Module D context (Channel matrix & platform fees)
        const modD = modRows.find((m) => m.moduleCode === 'MOD_D_PRODUCT_BUILD');
        if (modD?.structuredInputsJsonb) {
          const dData = modD.structuredInputsJsonb as Record<string, any>;
          if (dData.channelMatrix) {
            primaryChannel = dData.channelMatrix.primaryChannel || primaryChannel;
            estimatedBlendedFeePercent =
              dData.channelMatrix.estimatedBlendedFeePercent ?? estimatedBlendedFeePercent;
          }
        }
      }
    } catch (e) {
      console.warn('Non-fatal context gathering warning for pricing justification AI:', e);
    }
  }

  return await generatePricingStrategyJustificationViaRouter({
    planTitle,
    industryCategory,
    hqCountryCode,
    currencySymbol: input.currencySymbol,
    revenueModelVehicle: input.revenueModelVehicle,
    blendedAveragePrice: input.blendedAveragePrice,
    tiersSummary: input.tiersSummary,
    primaryChannel,
    estimatedBlendedFeePercent,
    beachheadCustomer,
    willingnessToPayInsights,
    competitorPriceRange,
    unfairAdvantage,
  });
}

/**
 * AI Assessor Mode: Generates a 3-paragraph commercial breakeven, working capital buffer,
 * and export additionality justification for grant and bank loan assessors.
 */
export async function generateBreakevenAssessorNarrativeAction(input: {
  planId: string;
  currencySymbol?: string;
  blendedAveragePrice?: number;
  pocketProfit?: number;
  pocketProfitMarginPercent?: number;
  monthlyFixedOverhead?: number;
  survivalMonthlyBudget?: number;
  targetMonthlyBreakevenCustomers?: number;
  paymentTerms?: string;
  workingCapitalBuffer?: number;
  exportSalesPercent?: number;
  exportFocusRegions?: string;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  unfairAdvantage?: string;
  beachheadCustomer?: string;
}): Promise<GenerateBreakevenAssessorNarrativeResult> {
  let planTitle = input.planTitle || 'Startup Plan';
  let industryCategory = input.industryCategory || 'Technology';
  let hqCountryCode: SupportedCountryCode = input.hqCountryCode || 'IE';
  let unfairAdvantage = input.unfairAdvantage || '';
  let beachheadCustomer = input.beachheadCustomer || '';

  if (UUID_REGEX.test(input.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
        requiredModule: 'MOD_H_REVENUE',
      });
      if (authCheck.authorized) {
        const planRows = await db
          .select()
          .from(startupPlans)
          .where(eq(startupPlans.id, input.planId))
          .limit(1);

        if (planRows.length > 0) {
          planTitle = planRows[0].title || planTitle;
          industryCategory = planRows[0].industryCategory || industryCategory;
          hqCountryCode = (planRows[0].hqCountryCode as SupportedCountryCode) || hqCountryCode;
        }

        const modRows = await db
          .select()
          .from(planModulesData)
          .where(eq(planModulesData.planId, input.planId));

        // Module A context
        const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
        if (modA?.structuredInputsJsonb) {
          const aData = modA.structuredInputsJsonb as Record<string, any>;
          unfairAdvantage =
            aData.conceptCanvas?.unfairAdvantage ||
            aData.brainDumpText ||
            unfairAdvantage;
        }

        // Module B context
        const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
        if (modB?.structuredInputsJsonb) {
          const bData = modB.structuredInputsJsonb as Record<string, any>;
          beachheadCustomer =
            bData.step1BeachheadPersona?.personaTitle ||
            bData.step1BeachheadPersona?.demographicsSummary ||
            beachheadCustomer;
        }
      }
    } catch (e) {
      console.warn('Non-fatal context gathering warning for breakeven narrative AI:', e);
    }
  }

  return await generateBreakevenAssessorNarrativeViaRouter({
    planTitle,
    industryCategory,
    hqCountryCode,
    currencySymbol: input.currencySymbol,
    blendedAveragePrice: input.blendedAveragePrice,
    pocketProfit: input.pocketProfit,
    pocketProfitMarginPercent: input.pocketProfitMarginPercent,
    monthlyFixedOverhead: input.monthlyFixedOverhead,
    survivalMonthlyBudget: input.survivalMonthlyBudget,
    targetMonthlyBreakevenCustomers: input.targetMonthlyBreakevenCustomers,
    paymentTerms: input.paymentTerms,
    workingCapitalBuffer: input.workingCapitalBuffer,
    exportSalesPercent: input.exportSalesPercent,
    exportFocusRegions: input.exportFocusRegions,
    unfairAdvantage,
    beachheadCustomer,
  });
}

/**
 * Persists Module H Step 4 (Sales Velocity, Capacity & Written Assumptions) to `plan_modules_data`.
 */
export async function saveModuleHStep4SalesAssumptionsAction(input: {
  planId: string;
  salesAssumptions: SalesAssumptionsStep4Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: authCheck.reason || 'Unauthorized plan access' };
  }

  try {
    await ensureModuleHEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep4: SalesAssumptionsStep4Data = {
      ...input.salesAssumptions,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step4SalesAssumptions: cleanStep4,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 80
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          completionPercentage: newCompletion,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_H_REVENUE',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_H_STEP_4_SALES_ASSUMPTIONS',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.error('Error saving Module H Step 4:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * AI Assessor Mode: Generates a 3-paragraph commercial conversion, velocity lag,
 * and delivery capacity defense for grant and bank loan assessors.
 */
export async function generateSalesAssumptionsNarrativeAction(input: {
  planId: string;
  salesMotion?: string;
  salesCycleDays?: number;
  conversionRatePercent?: number;
  breakevenMonthlyUnits?: number;
  requiredMonthlyLeads?: number;
  monthlyCapacityCap?: number;
  capacityFeasibilityStatus?: string;
  retentionMetricLabel?: string;
  retentionPercent?: number;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  primaryChannel?: string;
  beachheadCustomer?: string;
}): Promise<GenerateSalesAssumptionsNarrativeResult> {
  let planTitle = input.planTitle || 'Startup Plan';
  let industryCategory = input.industryCategory || 'Technology';
  let hqCountryCode: SupportedCountryCode = input.hqCountryCode || 'IE';
  let beachheadCustomer = input.beachheadCustomer || '';
  let primaryChannel = input.primaryChannel || 'Direct Web';

  if (UUID_REGEX.test(input.planId)) {
    try {
      const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
        requiredModule: 'MOD_H_REVENUE',
      });
      if (authCheck.authorized) {
        const planRows = await db
          .select()
          .from(startupPlans)
          .where(eq(startupPlans.id, input.planId))
          .limit(1);

        if (planRows.length > 0) {
          planTitle = planRows[0].title || planTitle;
          industryCategory = planRows[0].industryCategory || industryCategory;
          hqCountryCode = (planRows[0].hqCountryCode as SupportedCountryCode) || hqCountryCode;
        }

        const modRows = await db
          .select()
          .from(planModulesData)
          .where(eq(planModulesData.planId, input.planId));

        // Module B context (Beachhead persona)
        const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
        if (modB?.structuredInputsJsonb) {
          const bData = modB.structuredInputsJsonb as Record<string, any>;
          beachheadCustomer =
            bData.step1BeachheadPersona?.personaTitle ||
            bData.step1BeachheadPersona?.demographicsSummary ||
            bData.beachhead?.beachheadSegment ||
            beachheadCustomer;
        }

        // Module D context (Channel matrix)
        const modD = modRows.find((m) => m.moduleCode === 'MOD_D_PRODUCT_BUILD');
        if (modD?.structuredInputsJsonb) {
          const dData = modD.structuredInputsJsonb as Record<string, any>;
          if (dData.channelMatrix?.primaryChannel) {
            primaryChannel = dData.channelMatrix.primaryChannel;
          }
        }
      }
    } catch (e) {
      console.warn('Non-fatal context gathering warning for sales assumptions AI:', e);
    }
  }

  return await generateSalesAssumptionsNarrativeViaRouter({
    planTitle,
    industryCategory,
    hqCountryCode,
    salesMotion: input.salesMotion,
    salesCycleDays: input.salesCycleDays,
    conversionRatePercent: input.conversionRatePercent,
    breakevenMonthlyUnits: input.breakevenMonthlyUnits,
    requiredMonthlyLeads: input.requiredMonthlyLeads,
    monthlyCapacityCap: input.monthlyCapacityCap,
    capacityFeasibilityStatus: input.capacityFeasibilityStatus,
    retentionMetricLabel: input.retentionMetricLabel,
    retentionPercent: input.retentionPercent,
    primaryChannel,
    beachheadCustomer,
  });
}

/**
 * Persists Module H Step 5 (Revenue & Breakeven Executive Brief & Blind Spots) to `plan_modules_data`.
 */
export async function saveModuleHStep5RevenueBriefAction(input: {
  planId: string;
  revenueBrief: RevenueBlindSpotAuditStep5Data;
  thingsToConsider?: BlindSpotItem[];
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
    requiredModule: 'MOD_H_REVENUE',
    requireWrite: true,
  });
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: authCheck.reason || 'Unauthorized plan access' };
  }

  try {
    await ensureModuleHEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep5: RevenueBlindSpotAuditStep5Data = {
      ...input.revenueBrief,
      lastSavedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step5RevenueBrief: cleanStep5,
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? 100
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          aiThingsToConsiderJsonb: input.thingsToConsider ?? input.revenueBrief.blindSpots,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(planModulesData.planId, input.planId),
            eq(planModulesData.moduleCode, 'MOD_H_REVENUE')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_H_REVENUE',
        structuredInputsJsonb: updatedJson,
        aiThingsToConsiderJsonb: input.thingsToConsider ?? input.revenueBrief.blindSpots,
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_H_STEP_5_REVENUE_BRIEF',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.error('Error saving Module H Step 5:', err);
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

/**
 * AI Assessor Mode: Generates Module H Step 5 Executive Commercial Brief and Blind-Spot Audit.
 */
export async function generateModuleHRevenueBriefAction(input: {
  planId: string;
  currencySymbol: string;
  revenueModelVehicle: string;
  blendedAveragePrice: number;
  pocketProfitPerSale: number;
  contributionMarginPercent: number;
  yr1BreakevenUnits: number;
  monthlyFixedNut: number;
  salesMotion: string;
  monthlyCapacity: number;
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
}): Promise<GenerateModuleHRevenueBriefResult> {
  let planTitle = input.planTitle || 'Startup Venture';
  let industryCategory = input.industryCategory || 'Startup';
  let hqCountryCode: SupportedCountryCode = input.hqCountryCode || 'IE';

  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId, {
      requiredModule: 'MOD_H_REVENUE',
    });
    if (!authCheck.authorized) {
      return {
        allowed: false,
        reason: authCheck.reason || 'Unauthorized plan access.',
        blindSpots: [],
        revenueReadinessConfidence: 'PRICING_TESTING_RECOMMENDED',
        executiveCommercialSummaryNarrative: '',
        assessorTip: 'Unauthorized access to startup plan.',
        engineMode: 'smart-synthesizer',
      };
    }

    try {
      const [planRow] = await db
        .select({
          title: startupPlans.title,
          industryCategory: startupPlans.industryCategory,
          hqCountryCode: startupPlans.hqCountryCode,
        })
        .from(startupPlans)
        .where(eq(startupPlans.id, input.planId))
        .limit(1);

      if (planRow) {
        planTitle = planRow.title || planTitle;
        industryCategory = planRow.industryCategory || industryCategory;
        hqCountryCode = (planRow.hqCountryCode as SupportedCountryCode) || hqCountryCode;
      }
    } catch (e) {
      console.warn('Non-fatal context gathering warning for Module H Brief AI:', e);
    }
  }

  return await generateModuleHRevenueBriefViaRouter({
    planId: input.planId,
    planTitle,
    industryCategory,
    hqCountryCode,
    currencySymbol: input.currencySymbol,
    revenueModelVehicle: input.revenueModelVehicle,
    blendedAveragePrice: input.blendedAveragePrice,
    pocketProfitPerSale: input.pocketProfitPerSale,
    contributionMarginPercent: input.contributionMarginPercent,
    yr1BreakevenUnits: input.yr1BreakevenUnits,
    monthlyFixedNut: input.monthlyFixedNut,
    salesMotion: input.salesMotion,
    monthlyCapacity: input.monthlyCapacity,
  });
}


