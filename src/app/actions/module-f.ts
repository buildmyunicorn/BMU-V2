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
  PromoterProfilesStep1Data,
  RoleMatrixStep2Data,
  SurvivalBudgetStep3Data,
  CoFounderAlignmentStep4Data,
  HiringPlanStep5Data,
  SavedModuleFData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  parseCvAndDraftPromoterBioViaRouter,
  generateRoleMatrixSummaryViaRouter,
  generateHiringStrategySummaryViaRouter,
  generateTeamAuditAndBriefViaRouter,
  type ParseCvAndDraftBioResult,
  type GenerateRoleMatrixSummaryResult,
  type GenerateHiringStrategySummaryResult,
  type GenerateTeamAuditAndBriefResult,
} from '@/lib/ai/router';
import type { SupportedCountryCode } from '@/lib/localization';

export type {
  ParseCvAndDraftBioResult,
  GenerateRoleMatrixSummaryResult,
  GenerateHiringStrategySummaryResult,
  GenerateTeamAuditAndBriefResult,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleFEnumEnsured = false;

async function ensureModuleFEnumInPostgres(): Promise<void> {
  if (moduleFEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_F_COFOUNDER_TEAM'`
    );
    moduleFEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module F Step 1 (Promoter & Core Team Profiles) to `plan_modules_data`.
 */
export async function saveModuleFStep1PromoterProfilesAction(input: {
  planId: string;
  promoterProfiles: PromoterProfilesStep1Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      promoterProfiles: {
        ...input.promoterProfiles,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 20
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_1',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 1 Promoter Profiles to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module F Step 2 (7 Startup Hats Matrix & Advisor Roster) to `plan_modules_data`.
 */
export async function saveModuleFStep2RoleMatrixAction(input: {
  planId: string;
  roleMatrix: RoleMatrixStep2Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      step2RoleMatrixData: {
        ...input.roleMatrix,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 40
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_2',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 2 Role Matrix to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module F Step 3 (Founder Survival Budget & Living Runway Analysis) to `plan_modules_data`.
 */
export async function saveModuleFStep3SurvivalBudgetAction(input: {
  planId: string;
  survivalBudget: SurvivalBudgetStep3Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      step3SurvivalBudgetData: {
        ...input.survivalBudget,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 60
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_3',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 3 Survival Budget to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module F Step 4 (Co-Founder Alignment Survey & 20 Awkward Questions) to `plan_modules_data`.
 */
export async function saveModuleFStep4AlignmentAction(input: {
  planId: string;
  step4AlignmentData: CoFounderAlignmentStep4Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      step4AlignmentData: {
        ...input.step4AlignmentData,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 80
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_4',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 4 Co-Founder Alignment to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module F Step 5 (3-Year Hiring Plan & Sweat Equity Architecture) to `plan_modules_data`.
 */
export async function saveModuleFStep5HiringPlanAction(input: {
  planId: string;
  hiringPlan: HiringPlanStep5Data;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      step5HiringPlanData: {
        ...input.hiringPlan,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 95
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_5',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 5 Hiring Plan to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Persists Module F Step 6 (Team & Governance Executive Brief & Blind-Spot Audit) to `plan_modules_data`.
 */
export async function saveModuleFStep6BlindSpotAuditAction(input: {
  planId: string;
  blindSpotAudit?: any;
  thingsToConsider?: BlindSpotItem[];
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await ensureModuleFEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_F_COFOUNDER_TEAM')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleFData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleFData = {
      ...existingPayload,
      step6BlindSpotAuditData: input.blindSpotAudit ?? existingPayload.step6BlindSpotAuditData,
      thingsToConsider: input.thingsToConsider ?? existingPayload.thingsToConsider,
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 100
    );

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedPayload,
          aiThingsToConsiderJsonb: input.thingsToConsider ?? existingMod[0].aiThingsToConsiderJsonb,
          completionPercentage: nextProgress,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_F_COFOUNDER_TEAM',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: input.thingsToConsider ?? [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_F_STEP_6',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not persist Step 6 Blind Spot Audit to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Parks a team/founder/hiring question into `open_questions_parking_lot` under `MOD_F_COFOUNDER_TEAM`.
 */
export async function parkModuleFOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId) || !input.questionText.trim()) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  try {
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_F_COFOUNDER_TEAM',
      questionText: input.questionText.trim(),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module F] Could not park question in Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

export async function parseCvAndDraftPromoterBioAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  fileBase64?: string;
  fileMimeType?: string;
  rawText?: string;
  currentRoleTitle?: string;
  candidateName?: string;
}): Promise<ParseCvAndDraftBioResult> {
  return await parseCvAndDraftPromoterBioViaRouter(params);
}

export async function generateRoleMatrixSummaryAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembers: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
  }>;
  hatAssignments: Array<{
    hatKey: string;
    title: string;
    primaryOwnerMemberId: string;
    backupOwnerMemberId?: string;
    weeklyHours: number;
    confidence: string;
    notes?: string;
  }>;
  advisors?: Array<{
    name: string;
    roleOrSpecialty: string;
    organizationOrAffiliation?: string;
    cadence?: string;
  }>;
}): Promise<GenerateRoleMatrixSummaryResult> {
  return await generateRoleMatrixSummaryViaRouter(params);
}

export async function generateHiringStrategySummaryAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  hiringPosture?: string;
  otherHiringPostureText?: string;
  roles: Array<{
    title: string;
    department: string;
    employmentMode: string;
    yearScheduled: number;
    compensationModel: string;
    grossAnnualSalary: number;
    equityGrantPercent?: number;
    vestingYears?: number;
    cliffMonths?: number;
    isGrantReimbursableEligible?: boolean;
    isRdTaxCreditEligible?: boolean;
    sweatEquityMilestoneConditions?: string;
  }>;
  contractorBudgetYear1?: number;
  contractorBudgetYear2?: number;
  contractorBudgetYear3?: number;
}): Promise<GenerateHiringStrategySummaryResult> {
  return await generateHiringStrategySummaryViaRouter(params);
}

export async function generateTeamAuditAndBriefAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembersCount?: number;
  promoters?: Array<{ fullName: string; jobTitle: string; cvReady: boolean }>;
  survivalRunwayMonths?: number;
  monthlySurvivalBurn?: number;
  unassignedHatsCount?: number;
  year1Fte?: number;
  year3Fte?: number;
  equityVestingPlanned?: boolean;
}): Promise<GenerateTeamAuditAndBriefResult> {
  return await generateTeamAuditAndBriefViaRouter(params);
}
