CREATE TYPE "public"."quote_response_status" AS ENUM('SENT', 'OPENED', 'QUOTE_SUBMITTED', 'DECLINED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."quote_rfp_status" AS ENUM('DISPATCHED', 'QUOTES_IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."quote_supplier_category" AS ENUM('DEV_AGENCY', 'NO_CODE_STUDIO', 'EQUIPMENT_SUPPLIER', 'BRANDING_DESIGN', 'OTHER');--> statement-breakpoint
CREATE TABLE "quote_partner_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"magic_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"status" "quote_response_status" DEFAULT 'SENT' NOT NULL,
	"quote_amount_net" numeric(12, 2),
	"quote_currency" text DEFAULT 'EUR' NOT NULL,
	"estimated_weeks" integer,
	"quote_file_url" text,
	"quote_file_name" text,
	"quote_notes" text,
	"opened_at" timestamp,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_partner_responses_magic_token_unique" UNIQUE("magic_token")
);
--> statement-breakpoint
CREATE TABLE "quote_rfp_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"founder_user_id" uuid NOT NULL,
	"rfp_category" "quote_supplier_category" NOT NULL,
	"target_country_code" text DEFAULT 'IE' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"project_title" text NOT NULL,
	"budget_range" text NOT NULL,
	"target_delivery_timeline" text NOT NULL,
	"scope_summary" text NOT NULL,
	"work_packages_json" jsonb DEFAULT '[]'::jsonb,
	"founder_contact_info" jsonb NOT NULL,
	"source_module" text DEFAULT 'MOD_D_PRODUCT_BUILD' NOT NULL,
	"equipment_item_name" text,
	"status" "quote_rfp_status" DEFAULT 'DISPATCHED' NOT NULL,
	"dispatched_partners_count" integer DEFAULT 0 NOT NULL,
	"quotes_received_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "is_supplier_partner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "supplier_category" "quote_supplier_category";--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "dispatch_email" text;--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "monthly_rfp_cap" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "rfps_dispatched_this_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_offers" ADD COLUMN "last_rfp_dispatched_at" timestamp;--> statement-breakpoint
ALTER TABLE "quote_partner_responses" ADD CONSTRAINT "quote_partner_responses_rfp_id_quote_rfp_requests_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."quote_rfp_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_partner_responses" ADD CONSTRAINT "quote_partner_responses_partner_id_partner_offers_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_rfp_requests" ADD CONSTRAINT "quote_rfp_requests_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_rfp_requests" ADD CONSTRAINT "quote_rfp_requests_founder_user_id_users_id_fk" FOREIGN KEY ("founder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quote_responses_magic_token_idx" ON "quote_partner_responses" USING btree ("magic_token");