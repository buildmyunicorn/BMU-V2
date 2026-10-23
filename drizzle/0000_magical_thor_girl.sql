CREATE TYPE "public"."collaborator_role" AS ENUM('OWNER', 'CO_FOUNDER', 'ADVISOR_READONLY');--> statement-breakpoint
CREATE TYPE "public"."entitlement_plan_type" AS ENUM('FREE_HOOK', 'SIX_MONTH_SOLO', 'SIX_MONTH_COFOUNDER', 'APPSUMO_LTD', 'COHORT_PASS');--> statement-breakpoint
CREATE TYPE "public"."module_code" AS ENUM('MOD_A_IDEATION', 'MOD_B_MARKET', 'MOD_C_OPERATIONS_TEAM', 'MOD_D_REVENUE', 'MOD_E_MARKETING', 'MOD_F_FINANCE_GRANTS', 'MOD_G_BUSINESS_PLAN');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('FOUNDER', 'MENTOR', 'TENANT_ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'SOFT_DELETED');--> statement-breakpoint
CREATE TYPE "public"."voucher_source" AS ENUM('APPSUMO', 'COHORT', 'PROMO');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('UNCLAIMED', 'REDEEMED', 'REFUNDED_REVOKED');--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_key" text NOT NULL,
	"module_code" "module_code" NOT NULL,
	"model_name" text DEFAULT 'gemini-2.5-flash' NOT NULL,
	"system_instruction" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_prompts_prompt_key_unique" UNIQUE("prompt_key")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"plan_id" uuid,
	"prompt_key" text NOT NULL,
	"model_used" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"used_byok_key" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"max_seats" integer DEFAULT 50 NOT NULL,
	"seats_used" integer DEFAULT 0 NOT NULL,
	"access_duration_months" integer DEFAULT 6 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cohorts_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "country_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"default_currency" text NOT NULL,
	"tax_name" text NOT NULL,
	"standard_tax_rate_percent" numeric NOT NULL,
	"employer_payroll_tax_name" text NOT NULL,
	"employer_payroll_tax_percent" numeric NOT NULL,
	"common_entity_types_json" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "country_rules_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "grants_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"grant_name" text NOT NULL,
	"provider_agency" text NOT NULL,
	"funding_type" text NOT NULL,
	"max_amount_formatted" text NOT NULL,
	"reimbursement_warning" text NOT NULL,
	"eligibility_rules_jsonb" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"official_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_questions_parking_lot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"source_module" "module_code" NOT NULL,
	"question_text" text NOT NULL,
	"status" "question_status" DEFAULT 'OPEN' NOT NULL,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "plan_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid,
	"invited_email" text NOT NULL,
	"invite_accepted" boolean DEFAULT false NOT NULL,
	"role" "collaborator_role" DEFAULT 'CO_FOUNDER' NOT NULL,
	"assigned_hats_array" jsonb DEFAULT '[]'::jsonb,
	"alignment_interview_completed" boolean DEFAULT false NOT NULL,
	"alignment_interview_answers_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_modules_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"module_code" "module_code" NOT NULL,
	"structured_inputs_jsonb" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_things_to_consider_jsonb" jsonb DEFAULT '[]'::jsonb,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startup_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"cohort_id" uuid,
	"parent_plan_id" uuid,
	"title" text NOT NULL,
	"one_liner_summary" text,
	"industry_category" text,
	"hq_country_code" text DEFAULT 'IE' NOT NULL,
	"base_currency" text DEFAULT 'EUR' NOT NULL,
	"target_markets_array" jsonb DEFAULT '["IE"]'::jsonb,
	"current_module_step" text DEFAULT 'MOD_A_STEP_1' NOT NULL,
	"idea_comparator_scores_json" jsonb DEFAULT '{}'::jsonb,
	"status" "plan_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"answers_jsonb" jsonb NOT NULL,
	"respondent_email" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"branding_json" jsonb DEFAULT '{}'::jsonb,
	"custom_rubric_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" "entitlement_plan_type" DEFAULT 'FREE_HOOK' NOT NULL,
	"stacked_codes_count" integer DEFAULT 0 NOT NULL,
	"max_startup_plans" integer DEFAULT 1 NOT NULL,
	"max_seats_per_plan" integer DEFAULT 1 NOT NULL,
	"monthly_ai_credits_limit" integer DEFAULT 50 NOT NULL,
	"ai_credits_used_this_month" integer DEFAULT 0 NOT NULL,
	"credits_reset_at" timestamp,
	"white_label_export_enabled" boolean DEFAULT false NOT NULL,
	"custom_api_key_encrypted" text,
	"access_expires_at" timestamp,
	"is_vault_readonly" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_entitlements_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"cohort_id" uuid,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'FOUNDER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"suspension_reason" text,
	"admin_internal_notes" text,
	"last_active_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "validation_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"public_slug" text NOT NULL,
	"title" text NOT NULL,
	"intro_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"collect_lead_emails" boolean DEFAULT true NOT NULL,
	"questions_jsonb" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_insights_summary_jsonb" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "validation_surveys_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"batch_name" text NOT NULL,
	"source" "voucher_source" DEFAULT 'APPSUMO' NOT NULL,
	"status" "voucher_status" DEFAULT 'UNCLAIMED' NOT NULL,
	"redeemed_by_user_id" uuid,
	"redeemed_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_questions_parking_lot" ADD CONSTRAINT "open_questions_parking_lot_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD CONSTRAINT "plan_collaborators_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD CONSTRAINT "plan_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_modules_data" ADD CONSTRAINT "plan_modules_data_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD CONSTRAINT "startup_plans_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD CONSTRAINT "startup_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD CONSTRAINT "startup_plans_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_validation_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."validation_surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_surveys" ADD CONSTRAINT "validation_surveys_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_redeemed_by_user_id_users_id_fk" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_collab_email_idx" ON "plan_collaborators" USING btree ("plan_id","invited_email");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_module_unique_idx" ON "plan_modules_data" USING btree ("plan_id","module_code");