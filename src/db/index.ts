import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://bmu_user:bmu_local_password@localhost:5432/bmu_dev';

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  schemaSyncedPromise: Promise<void> | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

/**
 * Idempotent runtime schema guard that ensures any newly added Drizzle columns
 * or module_code enum values exist in PostgreSQL before queries run.
 * Prevents production login/onboarding crashes if a code deploy precedes a manual migration.
 */
export function ensureDatabaseSchemaSynced(): Promise<void> {
  if (!globalForDb.schemaSyncedPromise) {
    globalForDb.schemaSyncedPromise = (async () => {
      try {
        await pool.query(`
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_C_SURVEYS_FEEDBACK';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_D_PRODUCT_BUILD';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_E_OPERATIONS';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_F_COFOUNDER_TEAM';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_G_LAUNCHPAD';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_H_REVENUE';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_I_MARKETING';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_J_FINANCE';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_K_GRANTS_FUNDING';
          ALTER TYPE "public"."module_code" ADD VALUE IF NOT EXISTS 'MOD_L_BUSINESS_PLAN';

          ALTER TABLE startup_plans
            ADD COLUMN IF NOT EXISTS grant_eligibility_sector text,
            ADD COLUMN IF NOT EXISTS innovate_uk_research_category text,
            ADD COLUMN IF NOT EXISTS product_vehicle_type text,
            ADD COLUMN IF NOT EXISTS primary_sales_channel text,
            ADD COLUMN IF NOT EXISTS selected_build_tier text,
            ADD COLUMN IF NOT EXISTS local_authority_or_region text,
            ADD COLUMN IF NOT EXISTS target_launch_date timestamp,
            ADD COLUMN IF NOT EXISTS grant_compliance_metadata_json jsonb DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS idea_comparator_scores_json jsonb DEFAULT '{}'::jsonb;

          ALTER TABLE plan_collaborators
            ADD COLUMN IF NOT EXISTS promoter_background_profile_json jsonb DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS personal_survival_budget_json jsonb DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS proposed_equity_percent numeric,
            ADD COLUMN IF NOT EXISTS vesting_schedule_months integer DEFAULT 48,
            ADD COLUMN IF NOT EXISTS cliff_months integer DEFAULT 12;

          ALTER TABLE validation_surveys
            ADD COLUMN IF NOT EXISTS waitlist_incentive_text text,
            ADD COLUMN IF NOT EXISTS outreach_templates_jsonb jsonb DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS interview_logs_jsonb jsonb DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS ai_insights_summary_jsonb jsonb DEFAULT '{}'::jsonb;

          ALTER TABLE grants_directory
            ADD COLUMN IF NOT EXISTS slug text;
        `);
      } catch (err) {
        // Reset promise so a transient connection issue can retry on next request
        globalForDb.schemaSyncedPromise = undefined;
        console.warn('[Startup Preflight DB] Non-fatal schema sync warning:', err);
      }
    })();
  }
  return globalForDb.schemaSyncedPromise;
}

export * from './schema';
