CREATE TYPE "public"."grant_status" AS ENUM('ACTIVE', 'PENDING_REVIEW', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "currency" text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "max_funding_amount" integer;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "match_rate_percentage" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "is_repayable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "min_employees" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "max_employees" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "max_trading_months" integer;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "stage_fit" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "turnaround_label" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "turnaround_speed" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "leo_three_quote_enforced" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "compiler_template_id" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "description_markdown" text;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "eligible_costs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "ineligible_costs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "application_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "disqualification_red_flags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "deadline_date" timestamp;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "status" "grant_status" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "confidence_score" integer;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "source_snippets" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "discovered_via" text DEFAULT 'SYSTEM_SEED';--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "last_verified_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "grants_directory" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;