import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://bmu_user:bmu_local_password@localhost:5432/bmu_dev';

const DB_CONNECTION_TIMEOUT_MS = 2500;
const DB_OFFLINE_COOLDOWN_MS = 15_000;
const POOL_CONFIG_VERSION = 2;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  poolVersion: number | undefined;
  schemaSyncedPromise: Promise<void> | undefined;
  lastConnectionFailureAt: number | undefined;
};

function isConnectionLevelError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg =
    'message' in err && typeof (err as { message?: unknown }).message === 'string'
      ? (err as { message: string }).message.toLowerCase()
      : '';
  const code =
    'code' in err && typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code.toUpperCase()
      : '';
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH' ||
    code === 'ENOTFOUND' ||
    msg.includes('timeout expired') ||
    msg.includes('connection terminated') ||
    msg.includes('connect etimedout') ||
    msg.includes('connect econnrefused') ||
    msg.includes('offline circuit breaker')
  );
}

function createConfiguredPool(): Pool {
  const rawPool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: 10_000,
  });

  // Prevent unhandled pool error events from crashing the Node process when offline/hotspotting
  rawPool.on('error', (err) => {
    if (isConnectionLevelError(err)) {
      globalForDb.lastConnectionFailureAt = Date.now();
    }
  });

  const origConnect = rawPool.connect.bind(rawPool);
  const origQuery = rawPool.query.bind(rawPool);

  // Wrap connect & query with a 15-second offline circuit breaker so when Cloud SQL is
  // unreachable (e.g. mobile hotspot IP not in GCP Authorized Networks), subsequent queries
  // fail in 0ms instead of queuing multiple 2.5s–75s TCP timeouts.
  rawPool.connect = (async (...args: Parameters<typeof origConnect>) => {
    const lastFail = globalForDb.lastConnectionFailureAt;
    if (lastFail && Date.now() - lastFail < DB_OFFLINE_COOLDOWN_MS) {
      throw new Error(
        '[SPF DB Offline Circuit Breaker] PostgreSQL unreachable (cooldown active).'
      );
    }
    try {
      const result = await (origConnect as (...a: unknown[]) => Promise<unknown>)(
        ...args
      );
      globalForDb.lastConnectionFailureAt = undefined;
      return result;
    } catch (err) {
      if (isConnectionLevelError(err)) {
        globalForDb.lastConnectionFailureAt = Date.now();
      }
      throw err;
    }
  }) as typeof rawPool.connect;

  rawPool.query = (async (...args: Parameters<typeof origQuery>) => {
    const lastFail = globalForDb.lastConnectionFailureAt;
    if (lastFail && Date.now() - lastFail < DB_OFFLINE_COOLDOWN_MS) {
      throw new Error(
        '[SPF DB Offline Circuit Breaker] PostgreSQL unreachable (cooldown active).'
      );
    }
    try {
      const result = await (origQuery as (...a: unknown[]) => Promise<unknown>)(
        ...args
      );
      globalForDb.lastConnectionFailureAt = undefined;
      return result;
    } catch (err) {
      if (isConnectionLevelError(err)) {
        globalForDb.lastConnectionFailureAt = Date.now();
      }
      throw err;
    }
  }) as typeof rawPool.query;

  return rawPool;
}

if (
  globalForDb.pool &&
  globalForDb.poolVersion !== POOL_CONFIG_VERSION
) {
  globalForDb.pool.end().catch(() => {});
  globalForDb.pool = undefined;
  globalForDb.schemaSyncedPromise = undefined;
}

export const pool = globalForDb.pool ?? createConfiguredPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
  globalForDb.poolVersion = POOL_CONFIG_VERSION;
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
