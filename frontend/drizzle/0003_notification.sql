CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"reference_type" text,
	"reference_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "notification_user_read_created_idx" ON "notification" ("user_id", "read", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "notification" ("user_id", "created_at" DESC);
