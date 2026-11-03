CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" text NOT NULL,
	"template" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"resend_id" text,
	"from_email" text NOT NULL,
	"reply_to" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb,
	"error_message" text,
	"opened_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
