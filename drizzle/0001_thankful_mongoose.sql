CREATE TYPE "public"."voucher_reward_type" AS ENUM('APPSUMO_LTD', 'PASS_SOLO', 'PASS_COFOUNDER');--> statement-breakpoint
ALTER TYPE "public"."voucher_source" ADD VALUE 'PARTNER';--> statement-breakpoint
CREATE TABLE "early_access_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"jurisdiction_code" text DEFAULT 'IE' NOT NULL,
	"custom_jurisdiction_text" text,
	"source" text DEFAULT 'LANDING_HERO' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "early_access_waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'ADMIN_TRACKER' NOT NULL,
	"ticket_type" text DEFAULT 'BUG' NOT NULL,
	"custom_type_text" text,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"module_scope" text DEFAULT 'GLOBAL' NOT NULL,
	"step_context" text,
	"page_url" text,
	"plan_id" text,
	"plan_title" text,
	"reporter_email" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"expected_behavior" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD COLUMN "promoter_background_profile_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD COLUMN "personal_survival_budget_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD COLUMN "proposed_equity_percent" numeric;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD COLUMN "vesting_schedule_months" integer DEFAULT 48;--> statement-breakpoint
ALTER TABLE "plan_collaborators" ADD COLUMN "cliff_months" integer DEFAULT 12;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "grant_eligibility_sector" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "innovate_uk_research_category" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "product_vehicle_type" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "primary_sales_channel" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "selected_build_tier" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "local_authority_or_region" text;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "target_launch_date" timestamp;--> statement-breakpoint
ALTER TABLE "startup_plans" ADD COLUMN "grant_compliance_metadata_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "joined_waitlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "founder_profile_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "validation_surveys" ADD COLUMN "waitlist_incentive_text" text;--> statement-breakpoint
ALTER TABLE "validation_surveys" ADD COLUMN "outreach_templates_jsonb" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "validation_surveys" ADD COLUMN "interview_logs_jsonb" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "reward_type" "voucher_reward_type" DEFAULT 'APPSUMO_LTD' NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "duration_months" integer DEFAULT 6;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD CONSTRAINT "grants_directory_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "public"."ai_prompts" ALTER COLUMN "module_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."open_questions_parking_lot" ALTER COLUMN "source_module" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."plan_modules_data" ALTER COLUMN "module_code" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."module_code";--> statement-breakpoint
CREATE TYPE "public"."module_code" AS ENUM('MOD_A_IDEATION', 'MOD_B_MARKET', 'MOD_C_SURVEYS_FEEDBACK', 'MOD_D_PRODUCT_BUILD', 'MOD_E_OPERATIONS', 'MOD_F_COFOUNDER_TEAM', 'MOD_G_LAUNCHPAD', 'MOD_H_REVENUE', 'MOD_I_MARKETING', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING', 'MOD_L_BUSINESS_PLAN');--> statement-breakpoint
ALTER TABLE "public"."ai_prompts" ALTER COLUMN "module_code" SET DATA TYPE "public"."module_code" USING "module_code"::"public"."module_code";--> statement-breakpoint
ALTER TABLE "public"."open_questions_parking_lot" ALTER COLUMN "source_module" SET DATA TYPE "public"."module_code" USING "source_module"::"public"."module_code";--> statement-breakpoint
ALTER TABLE "public"."plan_modules_data" ALTER COLUMN "module_code" SET DATA TYPE "public"."module_code" USING "module_code"::"public"."module_code";