'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
  openQuestionsParkingLot,
} from '@/db';
import type {
  OperationsBlueprintStep1Data,
  OperationsFulfillmentModeType,
  OrderTurnaroundSlaType,
  OperationalCapacityConstraintType,
  OrderLifecycleStageItem,
  PremisesAndEquipmentStep2Data,
  PremisesSetupModeType,
  PremisesComplianceStatusType,
  EquipmentAssetItem,
  RiskRegisterStep3Data,
  SupplierRedundancyPostureType,
  ProjectRiskRegisterItem,
  ProductTrackType,
  SalesChannelOptionType,
  DeliveryFulfillmentModelType,
  SavedModuleEData,
} from '@/lib/auth/session-store';
import type { SupportedCountryCode } from '@/lib/localization';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  generateModuleEOperationsBlueprintViaRouter,
  type ModuleEOperationsBlueprintGenerationResult,
  generateModuleEPremisesEquipmentViaRouter,
  type ModuleEPremisesEquipmentGenerationResult,
  generateModuleERiskRegisterViaRouter,
  type ModuleERiskRegisterGenerationResult,
} from '@/lib/ai/router';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleEEnumEnsured = false;

async function ensureModuleEEnumInPostgres(): Promise<void> {
  if (moduleEEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_E_OPERATIONS'`
    );
    moduleEEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module E Step 1 ("A Day in the Life of an Order" — End-to-End Fulfillment Blueprint)
 * to `plan_modules_data` (`MOD_E_OPERATIONS`).
 */
export async function saveModuleEStep1OperationsBlueprintAction(input: {
  planId: string;
  operationsBlueprint: OperationsBlueprintStep1Data;
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
    await ensureModuleEEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_E_OPERATIONS')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleEData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleEData = {
      ...existingPayload,
      operationsBlueprint: {
        ...input.operationsBlueprint,
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
        moduleCode: 'MOD_E_OPERATIONS',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_E_STEP_1',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module E] Could not persist Step 1 Operations Blueprint to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Parks an operations/fulfillment/equipment question into `open_questions_parking_lot` under `MOD_E_OPERATIONS`.
 */
export async function parkModuleEOpenQuestionAction(input: {
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
    await ensureModuleEEnumInPostgres();
    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_E_OPERATIONS',
      questionText: input.questionText.trim().slice(0, 1000),
      status: 'OPEN',
    });
    return { ok: true, persistedToCloudSql: true };
  } catch {
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleEOperationsBlueprintViaRouter`) to draft
 * a 5-stage Order Lifecycle Blueprint + End-to-End Fulfillment & Scaling Narratives.
 */
export async function generateModuleEOperationsBlueprintWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  primaryChannel?: SalesChannelOptionType;
  deliveryFulfillmentModel?: DeliveryFulfillmentModelType;
  weeklyOpsHoursAllocated?: number;
  currentFulfillmentMode?: OperationsFulfillmentModeType | '';
  currentTurnaroundSla?: OrderTurnaroundSlaType | '';
  currentCapacityConstraint?: OperationalCapacityConstraintType | '';
  currentStages?: OrderLifecycleStageItem[];
  mode?: 'POPULATE_STAGES_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEOperationsBlueprintGenerationResult> {
  return generateModuleEOperationsBlueprintViaRouter(input);
}

/**
 * Persists Module E Step 2 (Premises, Workshop & Equipment Schedule — IE LEO 3-Quote & Mobile Asset Ban + UK Innovate UK Depreciation)
 * to `plan_modules_data` (`MOD_E_OPERATIONS`).
 */
export async function saveModuleEStep2PremisesEquipmentAction(input: {
  planId: string;
  premisesAndEquipment: PremisesAndEquipmentStep2Data;
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
    await ensureModuleEEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_E_OPERATIONS')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleEData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleEData = {
      ...existingPayload,
      premisesAndEquipment: {
        ...input.premisesAndEquipment,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 50
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
        moduleCode: 'MOD_E_OPERATIONS',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_E_STEP_2',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module E] Could not persist Step 2 Premises & Equipment Schedule to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleEPremisesEquipmentViaRouter`) to draft
 * a Grant-Ready Equipment & Capex Schedule + Premises & Capital ROI Narratives.
 */
export async function generateModuleEPremisesEquipmentWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentPremisesSetupMode?: PremisesSetupModeType | '';
  currentPremisesLocationSummary?: string;
  currentMonthlyPremisesCost?: number;
  currentPremisesComplianceStatus?: PremisesComplianceStatusType | '';
  currentEquipmentItems?: EquipmentAssetItem[];
  mode?: 'POPULATE_ASSETS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleEPremisesEquipmentGenerationResult> {
  return generateModuleEPremisesEquipmentViaRouter(input);
}

/**
 * Persists Module E Step 3 (Supply-Chain Resilience & Formal 4-Category Project Risk Register)
 * to `plan_modules_data` (`MOD_E_OPERATIONS`).
 */
export async function saveModuleEStep3RiskRegisterAction(input: {
  planId: string;
  riskRegister: RiskRegisterStep3Data;
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
    await ensureModuleEEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_E_OPERATIONS')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as SavedModuleEData;

    const nowIso = new Date().toISOString();
    const updatedPayload: SavedModuleEData = {
      ...existingPayload,
      riskRegister: {
        ...input.riskRegister,
        lastSavedAt: nowIso,
      },
      lastSavedAt: nowIso,
    };

    const nextProgress = Math.max(
      existingMod[0]?.completionPercentage ?? 0,
      input.completionPercentage ?? 75
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
        moduleCode: 'MOD_E_OPERATIONS',
        structuredInputsJsonb: updatedPayload,
        aiThingsToConsiderJsonb: [],
        completionPercentage: nextProgress,
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_E_STEP_3',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[BMU Module E] Could not persist Step 3 Risk Register to Cloud SQL:',
      err instanceof Error ? err.message : err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Calls the central AI router (`generateModuleERiskRegisterViaRouter`) to draft
 * a 4-Category Grant-Ready Project Risk Register + Supply-Chain Resilience & Risk Governance Narratives.
 */
export async function generateModuleERiskRegisterWithAiAction(input: {
  planId?: string;
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency?: string;
  brainDumpText?: string;
  coreProblem?: string;
  targetCustomer?: string;
  proposedSolution?: string;
  selectedTrack: ProductTrackType;
  otherProductTrackText?: string;
  currentSupplierRedundancyPosture?: SupplierRedundancyPostureType | '';
  currentLeadTimeBufferDays?: number;
  currentPrimarySuppliersSummary?: string;
  currentBackupSuppliersSummary?: string;
  currentRiskItems?: ProjectRiskRegisterItem[];
  mode?: 'POPULATE_RISKS_AND_NARRATIVES' | 'NARRATIVES_ONLY';
}): Promise<ModuleERiskRegisterGenerationResult> {
  return generateModuleERiskRegisterViaRouter(input);
}
