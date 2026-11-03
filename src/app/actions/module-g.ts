'use server';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  startupPlans,
  planModulesData,
} from '@/db';
import type { SavedModuleGData } from '@/lib/auth/session-store';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let moduleGEnumEnsured = false;

async function ensureModuleGEnumInPostgres(): Promise<void> {
  if (moduleGEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_G_LAUNCHPAD'`
    );
    moduleGEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists Module G (Launchpad & Operations Hub) setup cards to `plan_modules_data`.
 */
export async function saveModuleGLaunchpadDataAction(input: {
  planId: string;
  data: SavedModuleGData;
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

    await ensureModuleGEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_G_LAUNCHPAD')
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();
    const updatedJson: Record<string, unknown> = {
      ...(existingMod[0]?.structuredInputsJsonb &&
      typeof existingMod[0].structuredInputsJsonb === 'object'
        ? (existingMod[0].structuredInputsJsonb as Record<string, unknown>)
        : {}),
      ...input.data,
      lastSavedAt: nowIso,
    };

    const newCompletion = Math.max(
      existingMod[0]?.completionPercentage || 0,
      input.completionPercentage ?? input.data.completionPercentage ?? 0
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
            eq(planModulesData.moduleCode, 'MOD_G_LAUNCHPAD')
          )
        );
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_G_LAUNCHPAD',
        structuredInputsJsonb: updatedJson,
        completionPercentage: newCompletion,
        aiThingsToConsiderJsonb: [],
        updatedAt: new Date(),
      });
    }

    await db
      .update(startupPlans)
      .set({
        currentModuleStep: 'MOD_G_LAUNCHPAD',
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, input.planId));

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Module G] Non-fatal error persisting Launchpad data:',
      err
    );
    return {
      ok: false,
      persistedToCloudSql: false,
      error: err instanceof Error ? err.message : 'Database save failed',
    };
  }
}
