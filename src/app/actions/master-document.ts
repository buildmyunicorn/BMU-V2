'use server';

import { and, eq, sql } from 'drizzle-orm';
import { db, planModulesData } from '@/db';
import { verifyActiveSessionAndPlanOwnership } from '@/lib/auth/server-auth';
import {
  weaveMasterDocumentStoryViaRouter,
  type MasterDocumentStoryWeaveResult,
} from '@/lib/ai/router';
import {
  buildDeterministicMasterStory,
  sanitizeSurveyTerminologyForReader,
  type MasterDocumentVerifiedFacts,
} from '@/lib/export/master-document-brief';
import type { SavedMasterDocumentData } from '@/lib/auth/session-store';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let modLEnumEnsured = false;

async function ensureModLEnumInPostgres(): Promise<void> {
  if (modLEnumEnsured) return;
  try {
    await db.execute(
      sql`ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_L_BUSINESS_PLAN'`
    );
    modLEnumEnsured = true;
  } catch {
    // Non-fatal if enum value already exists
  }
}

/**
 * Persists the founder's Living Master Document story or view settings
 * to `plan_modules_data` (`MOD_L_BUSINESS_PLAN`).
 */
export async function saveMasterDocumentDataAction(input: {
  planId: string;
  masterDocumentData: SavedMasterDocumentData;
}): Promise<{ ok: boolean; persistedToCloudSql: boolean }> {
  if (!UUID_REGEX.test(input.planId)) {
    return { ok: true, persistedToCloudSql: false };
  }

  const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
  if (!authCheck.authorized) {
    return { ok: false, persistedToCloudSql: false };
  }

  const sanitizedData: SavedMasterDocumentData = {
    ...input.masterDocumentData,
    paragraph1OpportunityAndMarket: sanitizeSurveyTerminologyForReader(
      input.masterDocumentData.paragraph1OpportunityAndMarket
    ),
    paragraph2ValidationAndProduct: sanitizeSurveyTerminologyForReader(
      input.masterDocumentData.paragraph2ValidationAndProduct
    ),
    paragraph3OperationsAndExecution: sanitizeSurveyTerminologyForReader(
      input.masterDocumentData.paragraph3OperationsAndExecution
    ),
  };

  try {
    await ensureModLEnumInPostgres();

    const existingMod = await db
      .select()
      .from(planModulesData)
      .where(
        and(
          eq(planModulesData.planId, input.planId),
          eq(planModulesData.moduleCode, 'MOD_L_BUSINESS_PLAN')
        )
      )
      .limit(1);

    const existingPayload = (existingMod[0]?.structuredInputsJsonb ??
      {}) as Record<string, unknown>;

    const nextPayload = {
      ...existingPayload,
      masterDocumentData: sanitizedData,
      lastSavedAt: new Date().toISOString(),
    };

    if (existingMod[0]) {
      await db
        .update(planModulesData)
        .set({
          structuredInputsJsonb: nextPayload,
          updatedAt: new Date(),
        })
        .where(eq(planModulesData.id, existingMod[0].id));
    } else {
      await db.insert(planModulesData).values({
        planId: input.planId,
        moduleCode: 'MOD_L_BUSINESS_PLAN',
        completionPercentage: 50,
        structuredInputsJsonb: nextPayload,
        aiThingsToConsiderJsonb: [],
      });
    }

    return { ok: true, persistedToCloudSql: true };
  } catch (err) {
    console.warn(
      '[SPF Master Document] Non-fatal error saving master document data:',
      err
    );
    return { ok: true, persistedToCloudSql: false };
  }
}

/**
 * Weaves the 3-Paragraph Cohesive Executive Story using strictly grounded,
 * zero-hallucination facts from Modules A–E via the central AI router,
 * and saves the result to PostgreSQL when a cloud plan is active.
 */
export async function weaveMasterDocumentStoryWithAiAction(input: {
  planId: string;
  facts: MasterDocumentVerifiedFacts;
}): Promise<MasterDocumentStoryWeaveResult> {
  if (UUID_REGEX.test(input.planId)) {
    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized) {
      return {
        allowed: false,
        reason: authCheck.reason || 'Unauthorized access to startup plan.',
        story: buildDeterministicMasterStory(input.facts),
        engineMode: 'smart-synthesizer',
      };
    }
  }

  const res = await weaveMasterDocumentStoryViaRouter({
    planId: input.planId,
    facts: input.facts,
  });

  if (UUID_REGEX.test(input.planId) && res.allowed) {
    await saveMasterDocumentDataAction({
      planId: input.planId,
      masterDocumentData: res.story,
    }).catch(() => {});
  }

  return res;
}
