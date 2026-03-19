CREATE TABLE "dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"capacity" integer NOT NULL,
	"label" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_id" uuid NOT NULL,
	"name" text NOT NULL,
	"party_size" integer DEFAULT 1 NOT NULL,
	"email" text,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signups" ADD CONSTRAINT "signups_date_id_dates_id_fk" FOREIGN KEY ("date_id") REFERENCES "public"."dates"("id") ON DELETE cascade ON UPDATE no action;