'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, startupPlans, planModulesData, openQuestionsParkingLot } from '@/db';
import type {
  ModuleKStep1AuditSavedData,
  ModuleKStep2CapitalStackSavedData,
} from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleKEnumEnsured = false;

async function ensureModuleKEnumInPostgres(): Promise<void> {
  if (moduleKEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_K_GRANTS_FUNDING'`
    );
    moduleKEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module K Step 1 (Grant Audit & Checklist) to `plan_modules_data`.
 */
export async function saveModuleKStep1AuditAction(input: {
  planId: string;
  step1Audit: ModuleKStep1AuditSavedData;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep1: ModuleKStep1AuditSavedData = {
      ...input.step1Audit,
      lastAuditedAt: nowIso,
    };

    const currentJson: Record<string, unknown> =
      existingMod.length > 0 &&
      typeof existingMod[0].structuredInputsJsonb === 'object' &&
      existingMod[0].structuredInputsJsonb !== null
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {};

    const updatedJson: Record<string, unknown> = {
      ...currentJson,
      step1Audit: cleanStep1,
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    // Update active step in startup_plans
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_1_AUDIT',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { ok: false, persistedToCloudSql: false, error: message };
  }
}

/**
 * Persists Module K Step 2 (Capital Stack & Funding Blend) to `plan_modules_data`.
 */
export async function saveModuleKStep2CapitalStackAction(input: {
  planId: string;
  step2CapitalStack: ModuleKStep2CapitalStackSavedData;
  completionPercentage?: number;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: true, persistedToCloudSql: false };
    }

    await ensureModuleKEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_K_GRANTS_FUNDING')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const cleanStep2: ModuleKStep2CapitalStackSavedData = {
      ...input.step2CapitalStack,
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
      step2CapitalStack: cleanStep2,
      lastSavedAt: nowIso,
    };

    if (existingMod.length > 0) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: updatedJson,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_K_GRANTS_FUNDING',
        structuredInputsJsonb: updatedJson,
      });
    }

    // Update active step in startup_plans
    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_K_STEP_2_CAPITAL_STACK',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { ok: false, persistedToCloudSql: false, error: message };
  }
}

/**
 * Park an unresolved grant question into the Open Questions Parking Lot.
 */
export async function parkModuleKOpenQuestionAction(input: {
  planId: string;
  questionText: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true };
  }

  try {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return { ok: false, error: 'Unauthorized' };
    }

    await db.insert(openQuestionsParkingLot).values({
      planId: input.planId,
      sourceModule: 'MOD_K_GRANTS_FUNDING',
      questionText: input.questionText.trim(),
      status: 'OPEN',
    });

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to park question';
    return { ok: false, error: message };
  }
}
