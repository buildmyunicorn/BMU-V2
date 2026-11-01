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
  SavedModuleHData,
  SavedModuleFData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import type { SupportedCountryCode } from '@/lib/localization';
import {
  generatePricingStrategyJustificationViaRouter,
  type GeneratePricingStrategyJustificationResult,
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

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: 'Unauthorized plan access' };
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

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false, error: 'Unauthorized plan access' };
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

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
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

    const modFData = modFRecord[0].structuredInputsJsonb as SavedModuleFData;
    const step5 = modFData?.step5HiringPlanData;
    const step3 = modFData?.step3SurvivalBudgetData;

    // Calculate monthly founder survival budget across all co-founders if defined
    let survivalBudgetMonthly = 2500;
    if (step3?.founderBudgets && Array.isArray(step3.founderBudgets) && step3.founderBudgets.length > 0) {
      const totalMonthly = step3.founderBudgets.reduce((sum, b) => {
        const core =
          (Number(b.housingAndUtilities) || 0) +
          (Number(b.groceriesAndEssentials) || 0) +
          (Number(b.transportAndCommute) || 0) +
          (Number(b.debtAndLoanCommitments) || 0) +
          (Number(b.dependentsAndFamily) || 0);
        const netRequired = Math.max(0, core - (Number(b.incomeOffsetCushion) || 0));
        return sum + netRequired;
      }, 0);
      if (totalMonthly > 0) {
        survivalBudgetMonthly = Math.round(totalMonthly);
      }
    }

    // Calculate Y1, Y2, Y3 monthly payroll from Step 5 roles if present
    let y1AnnualTotal = 0;
    let y2AnnualTotal = 0;
    let y3AnnualTotal = 0;

    if (step5?.roles && Array.isArray(step5.roles)) {
      for (const role of step5.roles) {
        const gross = Number(role.grossAnnualSalary) || 0;
        const taxRate = 0.11; // Standard employer social contribution
        const fullyLoaded = gross * (1 + taxRate);
        if (role.yearScheduled <= 1) y1AnnualTotal += fullyLoaded;
        if (role.yearScheduled <= 2) y2AnnualTotal += fullyLoaded;
        if (role.yearScheduled <= 3) y3AnnualTotal += fullyLoaded;
      }
    }

    // Add contractor budgets
    const y1Contractor = Number(step5?.contractorBudgetYear1) || 0;
    const y2Contractor = Number(step5?.contractorBudgetYear2) || 0;
    const y3Contractor = Number(step5?.contractorBudgetYear3) || 0;

    const y1Monthly = Math.round((y1AnnualTotal + y1Contractor) / 12) || (survivalBudgetMonthly + 1000);
    const y2Monthly = Math.round((y2AnnualTotal + y2Contractor) / 12) || (y1Monthly * 2.2);
    const y3Monthly = Math.round((y3AnnualTotal + y3Contractor) / 12) || (y1Monthly * 4.2);

    return {
      ok: true,
      year1MonthlyPayroll: y1Monthly,
      year2MonthlyPayroll: y2Monthly,
      year3MonthlyPayroll: y3Monthly,
      personalSurvivalBudgetMonthly: survivalBudgetMonthly,
      currency: 'EUR',
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
}): Promise<GeneratePricingStrategyJustificationResult> {
  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return {
      allowed: false,
      pricingStrategyNotes:
        'Unauthorized plan access. Please refresh and log into your account.',
      engineMode: 'smart-synthesizer',
    };
  }

  // Cross-module context aggregation from Cloud SQL / local Postgres
  let planTitle = 'Startup Plan';
  let industryCategory = 'Technology';
  let hqCountryCode: SupportedCountryCode = 'IE';
  let primaryChannel = 'DIRECT_WEB_STRIPE';
  let estimatedBlendedFeePercent = 2.9;
  let beachheadCustomer = '';
  let willingnessToPayInsights = '';
  let competitorPriceRange = '';
  let unfairAdvantage = '';

  try {
    const planRows = await db
      .select()
      .from(startupPlans)
      .where(eq(startupPlans.id, input.planId))
      .limit(1);

    if (planRows.length > 0) {
      planTitle = planRows[0].title;
      industryCategory = planRows[0].industryCategory || 'Technology';
      hqCountryCode = (planRows[0].hqCountryCode as SupportedCountryCode) || 'IE';
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
        '';
    }

    // Module B context (Beachhead persona & competitor positioning)
    const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
    if (modB?.structuredInputsJsonb) {
      const bData = modB.structuredInputsJsonb as Record<string, any>;
      beachheadCustomer =
        bData.step1BeachheadPersona?.personaTitle ||
        bData.step1BeachheadPersona?.demographicsSummary ||
        '';
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
  } catch (e) {
    console.warn('Non-fatal context gathering warning for pricing justification AI:', e);
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

