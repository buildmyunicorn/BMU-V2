import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://bmu_user:bmu_local_password@localhost:5432/bmu_dev';

const DB_CONNECTION_TIMEOUT_MS =
  process.env.DB_CONNECTION_TIMEOUT_MS
    ? parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10)
    : 10_000;
const DB_OFFLINE_COOLDOWN_MS = 15_000;
const POOL_CONFIG_VERSION = 4;

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
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
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
    } catch (err: unknown) {
      const errMsg =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message.toLowerCase()
          : '';

      // If an idle connection in the pool was terminated by Cloud SQL / proxy while sitting idle,
      // retry once with a freshly negotiated socket instead of failing the request.
      if (errMsg.includes('connection terminated unexpectedly')) {
        try {
          const retryResult = await (origQuery as (...a: unknown[]) => Promise<unknown>)(
            ...args
          );
          globalForDb.lastConnectionFailureAt = undefined;
          return retryResult;
        } catch (retryErr) {
          if (isConnectionLevelError(retryErr)) {
            globalForDb.lastConnectionFailureAt = Date.now();
          }
          throw retryErr;
        }
      }

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

          DO $$ BEGIN
            CREATE TYPE "public"."voucher_reward_type" AS ENUM('APPSUMO_LTD', 'PASS_SOLO', 'PASS_COFOUNDER');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          ALTER TYPE "public"."voucher_source" ADD VALUE IF NOT EXISTS 'PARTNER';

          ALTER TABLE vouchers
            ADD COLUMN IF NOT EXISTS reward_type "public"."voucher_reward_type" DEFAULT 'APPSUMO_LTD' NOT NULL,
            ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 6,
            ADD COLUMN IF NOT EXISTS notes text;

          CREATE TABLE IF NOT EXISTS partner_offers (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            slug text NOT NULL UNIQUE,
            slot_key text NOT NULL,
            name text NOT NULL,
            logo_emoji text NOT NULL DEFAULT '⚡',
            category text NOT NULL,
            headline text NOT NULL,
            perk_description text NOT NULL,
            badge_text text NOT NULL,
            promo_code text,
            country_scope text NOT NULL DEFAULT 'ALL',
            action_type text NOT NULL DEFAULT 'AFFILIATE_LINK',
            action_label text NOT NULL,
            referral_url text NOT NULL,
            trust_factor text NOT NULL,
            warm_intro_recipient_email text,
            warm_intro_questions_json jsonb DEFAULT '[]'::jsonb,
            checkout_price_amount integer,
            checkout_currency text DEFAULT 'EUR',
            checkout_addons_json jsonb DEFAULT '[]'::jsonb,
            commission_bounty_summary text,
            partner_contact_notes text,
            sort_order integer NOT NULL DEFAULT 10,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp NOT NULL DEFAULT now(),
            updated_at timestamp NOT NULL DEFAULT now()
          );

          ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS checkout_price_amount integer;
          ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS checkout_currency text DEFAULT 'EUR';
          ALTER TABLE partner_offers ADD COLUMN IF NOT EXISTS checkout_addons_json jsonb DEFAULT '[]'::jsonb;

          CREATE TABLE IF NOT EXISTS partner_referral_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            partner_id text NOT NULL,
            partner_name text NOT NULL,
            partner_slug text NOT NULL,
            slot_key text NOT NULL,
            event_type text NOT NULL DEFAULT 'AFFILIATE_CLICK',
            plan_id text,
            plan_title text,
            founder_name text,
            founder_email text,
            country_code text NOT NULL DEFAULT 'IE',
            selected_domain text,
            destination_url text,
            intake_answers_json jsonb DEFAULT '{}'::jsonb,
            lead_status text NOT NULL DEFAULT 'CLICKED',
            estimated_bounty_amount text,
            admin_notes text,
            created_at timestamp NOT NULL DEFAULT now()
          );

          ALTER TABLE cohorts
            ADD COLUMN IF NOT EXISTS organization_name text,
            ADD COLUMN IF NOT EXISTS partner_logo_url text,
            ADD COLUMN IF NOT EXISTS intake_type text DEFAULT 'FIXED_BATCH',
            ADD COLUMN IF NOT EXISTS milestone_config_json jsonb DEFAULT '{}'::jsonb;

          CREATE TABLE IF NOT EXISTS cohort_staff (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
            user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            email text NOT NULL,
            name text,
            role text NOT NULL DEFAULT 'DIRECTOR',
            created_at timestamp NOT NULL DEFAULT now()
          );

          CREATE INDEX IF NOT EXISTS idx_cohort_staff_cohort_id ON cohort_staff(cohort_id);
          CREATE INDEX IF NOT EXISTS idx_cohort_staff_email ON cohort_staff(email);

          ALTER TABLE startup_plans
            ADD COLUMN IF NOT EXISTS cohort_milestone_status text DEFAULT 'IN_PROGRESS',
            ADD COLUMN IF NOT EXISTS cohort_milestone_claimed_at timestamp,
            ADD COLUMN IF NOT EXISTS verified_cohort_domain text,
            ADD COLUMN IF NOT EXISTS verified_cohort_work_email text,
            ADD COLUMN IF NOT EXISTS cohort_milestone_claim_data_json jsonb DEFAULT '{}'::jsonb;

          CREATE TABLE IF NOT EXISTS system_settings (
            key text PRIMARY KEY,
            value_json jsonb DEFAULT '{}'::jsonb NOT NULL,
            updated_at timestamp NOT NULL DEFAULT now()
          );

          ALTER TABLE users
            ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;

          CREATE TABLE IF NOT EXISTS stripe_webhook_events (
            event_id text PRIMARY KEY,
            event_type text NOT NULL,
            processed_at timestamptz NOT NULL DEFAULT now()
          );

          ALTER TABLE survey_responses
            ADD COLUMN IF NOT EXISTS source text DEFAULT 'ORGANIC' NOT NULL,
            ADD COLUMN IF NOT EXISTS boost_order_id text;

          CREATE TABLE IF NOT EXISTS survey_boost_pricing_tiers (
            id text PRIMARY KEY NOT NULL,
            tier_name text NOT NULL,
            response_count integer NOT NULL,
            price_eur_cents integer NOT NULL,
            price_gbp_cents integer NOT NULL,
            price_usd_cents integer DEFAULT 5900 NOT NULL,
            turnaround_hours integer DEFAULT 48 NOT NULL,
            target_audience_type text DEFAULT 'CONSUMER' NOT NULL,
            badge_label text,
            description text NOT NULL,
            features_json jsonb DEFAULT '[]'::jsonb NOT NULL,
            is_active boolean DEFAULT true NOT NULL,
            display_order integer DEFAULT 0 NOT NULL,
            updated_at timestamp DEFAULT now() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS survey_boost_orders (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            plan_id uuid NOT NULL REFERENCES startup_plans(id) ON DELETE CASCADE,
            survey_id uuid NOT NULL REFERENCES validation_surveys(id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            tier_id text NOT NULL,
            tier_name text NOT NULL,
            target_responses integer NOT NULL,
            delivered_responses integer DEFAULT 0 NOT NULL,
            amount_paid_cents integer NOT NULL,
            currency text DEFAULT 'EUR' NOT NULL,
            stripe_session_id text,
            stripe_payment_intent_id text,
            status text DEFAULT 'PENDING_PAYMENT' NOT NULL,
            target_country_code text DEFAULT 'IE' NOT NULL,
            target_audience_type text DEFAULT 'CONSUMER' NOT NULL,
            target_demographics_json jsonb DEFAULT '{}'::jsonb NOT NULL,
            screener_question text,
            screener_accept_answer text,
            panel_provider text DEFAULT 'POLLFISH',
            panel_survey_id text,
            panel_status text,
            admin_notes text,
            created_at timestamp DEFAULT now() NOT NULL,
            dispatched_at timestamp,
            completed_at timestamp
          );

          DO $$ BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'survey_boost_orders'
                AND column_name = 'user_id'
                AND data_type = 'text'
            ) THEN
              ALTER TABLE survey_boost_orders DROP CONSTRAINT IF EXISTS survey_boost_orders_user_id_users_id_fk;
              DELETE FROM survey_boost_orders
                WHERE user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
              ALTER TABLE survey_boost_orders
                ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
              ALTER TABLE survey_boost_orders
                ADD CONSTRAINT survey_boost_orders_user_id_users_id_fk
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
          END $$;

          DO $$ BEGIN
            CREATE TYPE "public"."quote_supplier_category" AS ENUM('DEV_AGENCY', 'NO_CODE_STUDIO', 'EQUIPMENT_SUPPLIER', 'BRANDING_DESIGN', 'OTHER');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          DO $$ BEGIN
            CREATE TYPE "public"."quote_rfp_status" AS ENUM('DISPATCHED', 'QUOTES_IN_PROGRESS', 'COMPLETED', 'CANCELLED');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          DO $$ BEGIN
            CREATE TYPE "public"."quote_response_status" AS ENUM('SENT', 'OPENED', 'QUOTE_SUBMITTED', 'DECLINED', 'EXPIRED');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;

          ALTER TABLE partner_offers
            ADD COLUMN IF NOT EXISTS is_supplier_partner boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS supplier_category "public"."quote_supplier_category",
            ADD COLUMN IF NOT EXISTS dispatch_email text,
            ADD COLUMN IF NOT EXISTS monthly_rfp_cap integer NOT NULL DEFAULT 10,
            ADD COLUMN IF NOT EXISTS rfps_dispatched_this_month integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_rfp_dispatched_at timestamp;

          CREATE TABLE IF NOT EXISTS quote_rfp_requests (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            plan_id uuid NOT NULL REFERENCES startup_plans(id) ON DELETE CASCADE,
            founder_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rfp_category "public"."quote_supplier_category" NOT NULL,
            target_country_code text DEFAULT 'IE' NOT NULL,
            currency text DEFAULT 'EUR' NOT NULL,
            project_title text NOT NULL,
            budget_range text NOT NULL,
            target_delivery_timeline text NOT NULL,
            scope_summary text NOT NULL,
            work_packages_json jsonb DEFAULT '[]'::jsonb,
            founder_contact_info jsonb NOT NULL,
            source_module text DEFAULT 'MOD_D_PRODUCT_BUILD' NOT NULL,
            equipment_item_name text,
            status "public"."quote_rfp_status" DEFAULT 'DISPATCHED' NOT NULL,
            dispatched_partners_count integer DEFAULT 0 NOT NULL,
            quotes_received_count integer DEFAULT 0 NOT NULL,
            created_at timestamp DEFAULT now() NOT NULL,
            updated_at timestamp DEFAULT now() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS quote_partner_responses (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            rfp_id uuid NOT NULL REFERENCES quote_rfp_requests(id) ON DELETE CASCADE,
            partner_id uuid NOT NULL REFERENCES partner_offers(id) ON DELETE CASCADE,
            magic_token text NOT NULL UNIQUE,
            token_expires_at timestamp NOT NULL,
            status "public"."quote_response_status" DEFAULT 'SENT' NOT NULL,
            quote_amount_net numeric(12, 2),
            quote_currency text DEFAULT 'EUR' NOT NULL,
            estimated_weeks integer,
            quote_file_url text,
            quote_file_name text,
            quote_notes text,
            opened_at timestamp,
            submitted_at timestamp,
            created_at timestamp DEFAULT now() NOT NULL
          );

          CREATE UNIQUE INDEX IF NOT EXISTS quote_responses_magic_token_idx
            ON quote_partner_responses(magic_token);

          CREATE TABLE IF NOT EXISTS cohort_inquiries (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            name text NOT NULL,
            email text NOT NULL,
            organization_name text NOT NULL,
            organization_type text NOT NULL,
            cohort_size text NOT NULL,
            regional_focus text DEFAULT 'IE_UK' NOT NULL,
            target_start_date text,
            goals_json jsonb DEFAULT '[]'::jsonb,
            notes text,
            status text DEFAULT 'NEW' NOT NULL,
            metadata_json jsonb DEFAULT '{}'::jsonb,
            created_at timestamp DEFAULT now() NOT NULL,
            updated_at timestamp DEFAULT now() NOT NULL
          );
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
