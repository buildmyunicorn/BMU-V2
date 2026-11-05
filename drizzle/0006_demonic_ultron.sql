CREATE TABLE "survey_boost_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"tier_name" text NOT NULL,
	"target_responses" integer NOT NULL,
	"delivered_responses" integer DEFAULT 0 NOT NULL,
	"amount_paid_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"target_country_code" text DEFAULT 'IE' NOT NULL,
	"target_audience_type" text DEFAULT 'CONSUMER' NOT NULL,
	"target_demographics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"screener_question" text,
	"screener_accept_answer" text,
	"panel_provider" text DEFAULT 'POLLFISH',
	"panel_survey_id" text,
	"panel_status" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dispatched_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_boost_pricing_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"tier_name" text NOT NULL,
	"response_count" integer NOT NULL,
	"price_eur_cents" integer NOT NULL,
	"price_gbp_cents" integer NOT NULL,
	"price_usd_cents" integer DEFAULT 5900 NOT NULL,
	"turnaround_hours" integer DEFAULT 48 NOT NULL,
	"target_audience_type" text DEFAULT 'CONSUMER' NOT NULL,
	"badge_label" text,
	"description" text NOT NULL,
	"features_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "source" text DEFAULT 'ORGANIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "boost_order_id" text;--> statement-breakpoint
ALTER TABLE "survey_boost_orders" ADD CONSTRAINT "survey_boost_orders_plan_id_startup_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."startup_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_boost_orders" ADD CONSTRAINT "survey_boost_orders_survey_id_validation_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."validation_surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_boost_orders" ADD CONSTRAINT "survey_boost_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;